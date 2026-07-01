'use strict';

/**
 * dockerRunner.js
 *
 * Core sandbox executor. Each code submission is run inside an isolated
 * Docker container with strict resource limits, no network access, and
 * a seccomp syscall whitelist.
 *
 * Flow:
 *  1. Write source code to a temporary host directory
 *  2. Create + start a Docker container with the tmp dir bind-mounted to /code
 *  3. Pipe stdin (test-case input) into the container
 *  4. Collect stdout / stderr via the multiplexed Docker attach stream
 *  5. Enforce a hard wall-clock timeout (timeLimitMs + 2 s grace period)
 *  6. Return structured result: { stdout, stderr, exitCode, timedOut,
 *                                  memoryExceeded, runtimeMs }
 */

const fs      = require('fs/promises');
const path    = require('path');
const os      = require('os');
const Docker  = require('dockerode');
const { v4: uuidv4 } = require('uuid');
const { LANGUAGES } = require('../languages/config');

// ---------------------------------------------------------------------------
// Docker client – connects to the local Docker daemon via Unix socket
// (or named pipe on Windows dev machines)
// ---------------------------------------------------------------------------
const docker = new Docker({
  socketPath: process.platform === 'win32'
    ? '//./pipe/docker_engine'
    : '/var/run/docker.sock',
});

// Path to our seccomp whitelist profile
const SECCOMP_PROFILE_PATH = path.join(__dirname, '../seccomp/profile.json');

/**
 * Demultiplexes a Docker "attach" stream into separate stdout/stderr buffers.
 *
 * Docker multiplexes both streams into one TCP/socket stream using 8-byte
 * frame headers:
 *   [stream_type (1 byte)] [padding (3 bytes)] [size (4 bytes BE)] [data]
 *   stream_type: 1 = stdout, 2 = stderr
 *
 * @param {Buffer} buffer - Raw data from Docker attach stream
 * @returns {{ stdout: string, stderr: string }}
 */
function demuxDockerStream(buffer) {
  let stdout = '';
  let stderr = '';
  let offset = 0;

  while (offset < buffer.length) {
    // Need at least 8 bytes for the header
    if (offset + 8 > buffer.length) break;

    const streamType = buffer[offset];       // 1 = stdout, 2 = stderr
    const frameSize  = buffer.readUInt32BE(offset + 4);
    offset += 8;

    if (offset + frameSize > buffer.length) break;

    const chunk = buffer.slice(offset, offset + frameSize).toString('utf8');
    offset += frameSize;

    if (streamType === 1) {
      stdout += chunk;
    } else if (streamType === 2) {
      stderr += chunk;
    }
  }

  return { stdout, stderr };
}

/**
 * Recursively removes a directory, logging any errors rather than throwing,
 * so cleanup failures never mask the real result.
 *
 * @param {string} dirPath
 */
async function cleanupDir(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (err) {
    console.error(`[dockerRunner] Warning: failed to remove temp dir ${dirPath}: ${err.message}`);
  }
}

/**
 * Main sandbox function. Executes arbitrary user code inside a Docker
 * container and returns the result.
 *
 * @param {object} params
 * @param {string} params.code          - Source code submitted by the user
 * @param {string} params.language      - Language key (e.g. 'python', 'cpp')
 * @param {string} params.input         - stdin to feed into the program
 * @param {number} params.timeLimitMs   - Wall-clock time limit in milliseconds
 * @param {number} params.memoryLimitMb - Memory cap in megabytes
 *
 * @returns {Promise<{
 *   stdout:         string,
 *   stderr:         string,
 *   exitCode:       number,
 *   timedOut:       boolean,
 *   memoryExceeded: boolean,
 *   runtimeMs:      number
 * }>}
 */
async function runInSandbox({ code, language, input, timeLimitMs, memoryLimitMb }) {
  // ------------------------------------------------------------------
  // 1. Resolve language config
  // ------------------------------------------------------------------
  const langConfig = LANGUAGES[language];
  if (!langConfig) {
    throw new Error(`Unsupported language: "${language}". Supported: ${Object.keys(LANGUAGES).join(', ')}`);
  }

  // ------------------------------------------------------------------
  // 2. Create isolated temporary directory on the host
  //    /tmp/codearena/<uuid>  (or OS tmp on Windows)
  // ------------------------------------------------------------------
  const sandboxId = uuidv4();
  const baseDir   = process.platform === 'win32'
    ? path.join(os.tmpdir(), 'codearena')
    : '/tmp/codearena';

  const tmpDir = path.join(baseDir, sandboxId);
  await fs.mkdir(tmpDir, { recursive: true });

  // Write the source file into the temp directory
  const codeFilename = langConfig.filename;
  const codeFilePath = path.join(tmpDir, codeFilename);
  await fs.writeFile(codeFilePath, code, 'utf8');

  // Path as seen inside the container
  const containerCodeFile = `/code/${codeFilename}`;

  // ------------------------------------------------------------------
  // 3. Load seccomp profile (JSON string required by Docker API)
  // ------------------------------------------------------------------
  let seccompProfile;
  try {
    const profileContent = await fs.readFile(SECCOMP_PROFILE_PATH, 'utf8');
    seccompProfile = profileContent; // Docker API accepts the raw JSON string
  } catch (err) {
    console.warn('[dockerRunner] Seccomp profile not found – running without it:', err.message);
    seccompProfile = null;
  }

  // ------------------------------------------------------------------
  // 4. Build container creation options
  // ------------------------------------------------------------------
  const memoryBytes = memoryLimitMb * 1024 * 1024;

  const createOptions = {
    Image: langConfig.image,
    Cmd:   langConfig.buildAndRunCmd(containerCodeFile),

    // Keep stdin open so we can write test-case input
    AttachStdin:  true,
    AttachStdout: true,
    AttachStderr: true,
    OpenStdin:    true,
    StdinOnce:    true,   // close stdin after first client disconnects
    Tty:          false,  // must be false for proper stream multiplexing

    HostConfig: {
      // ---- Memory ----
      Memory:     memoryBytes,
      MemorySwap: memoryBytes,   // swap = Memory → effectively disables swap

      // ---- CPU ----
      NanoCpus: 1e9,             // 1 full CPU core

      // ---- Network ----
      NetworkMode: 'none',       // no network access whatsoever

      // ---- Filesystem ----
      ReadonlyRootfs: false,     // compilation languages need to write binaries
      Binds: [`${tmpDir}:/code`],

      // ---- Security ----
      SecurityOpt: [
        'no-new-privileges:true',
        ...(seccompProfile ? [`seccomp=${seccompProfile}`] : []),
      ],

      // ---- Process limits ----
      PidsLimit: 64,             // prevent fork bombs

      // ---- Cleanup ----
      AutoRemove: true,          // container is removed as soon as it exits
    },
  };

  // ------------------------------------------------------------------
  // 5. Create & start the container
  // ------------------------------------------------------------------
  let container;
  const startTime = Date.now();

  try {
    container = await docker.createContainer(createOptions);
  } catch (err) {
    await cleanupDir(tmpDir);

    // Provide a helpful error if the image hasn't been pulled yet
    if (err.statusCode === 404) {
      throw new Error(
        `Docker image "${langConfig.image}" not found locally. ` +
        `Pull it first: docker pull ${langConfig.image}`
      );
    }
    throw new Error(`Failed to create container: ${err.message}`);
  }

  // ------------------------------------------------------------------
  // 6. Attach to the container streams BEFORE starting it, so we don't
  //    miss any early output
  // ------------------------------------------------------------------
  let stream;
  try {
    stream = await container.attach({
      stream: true,
      stdin:  true,
      stdout: true,
      stderr: true,
    });
  } catch (err) {
    // Best-effort cleanup of the container
    try { await container.remove({ force: true }); } catch (_) {}
    await cleanupDir(tmpDir);
    throw new Error(`Failed to attach to container: ${err.message}`);
  }

  // ------------------------------------------------------------------
  // 7. Start the container
  // ------------------------------------------------------------------
  try {
    await container.start();
  } catch (err) {
    try { await container.remove({ force: true }); } catch (_) {}
    await cleanupDir(tmpDir);
    throw new Error(`Failed to start container: ${err.message}`);
  }

  // ------------------------------------------------------------------
  // 8. Write stdin input then close the write end of the stream
  // ------------------------------------------------------------------
  if (input && input.length > 0) {
    stream.write(input);
  }
  // Signal EOF so the program's stdin.read() / input() returns
  stream.end();

  // ------------------------------------------------------------------
  // 9. Collect stdout / stderr with a hard timeout
  // ------------------------------------------------------------------
  const rawChunks = [];
  let timedOut    = false;
  let killTimer;

  const outputPromise = new Promise((resolve) => {
    stream.on('data', (chunk) => rawChunks.push(chunk));
    stream.on('end',  resolve);
    stream.on('error', resolve); // resolve anyway; we'll check exitCode
  });

  // Grace period: timeLimitMs + 2 000 ms for container startup overhead
  const hardDeadlineMs = timeLimitMs + 2000;

  const timeoutPromise = new Promise((resolve) => {
    killTimer = setTimeout(async () => {
      timedOut = true;
      try {
        await container.kill({ signal: 'SIGKILL' });
      } catch (_) {
        // Container may have already exited – ignore
      }
      resolve();
    }, hardDeadlineMs);
  });

  await Promise.race([outputPromise, timeoutPromise]);
  clearTimeout(killTimer);

  // ------------------------------------------------------------------
  // 10. Wait for the container to fully exit and get the exit code
  // ------------------------------------------------------------------
  let exitCode = 1; // default to error
  let memoryExceeded = false;

  try {
    const waitResult = await container.wait();
    exitCode = waitResult.StatusCode;

    // Docker sets exit code 137 when a container is OOM-killed (SIGKILL)
    // We infer OOM by combining exit code 137 with a non-timeout scenario.
    if (exitCode === 137 && !timedOut) {
      memoryExceeded = true;
    }
  } catch (err) {
    // With AutoRemove=true the container may be gone before wait() resolves
    console.warn(`[dockerRunner] container.wait() error (likely already removed): ${err.message}`);
  }

  const runtimeMs = Date.now() - startTime;

  // ------------------------------------------------------------------
  // 11. Demultiplex the raw Docker stream into stdout / stderr strings
  // ------------------------------------------------------------------
  const rawBuffer         = Buffer.concat(rawChunks);
  const { stdout, stderr } = demuxDockerStream(rawBuffer);

  // ------------------------------------------------------------------
  // 12. Clean up the temp directory
  // ------------------------------------------------------------------
  await cleanupDir(tmpDir);

  // ------------------------------------------------------------------
  // 13. Return structured result
  // ------------------------------------------------------------------
  return {
    stdout:         stdout.trimEnd(),
    stderr:         stderr.trimEnd(),
    exitCode,
    timedOut,
    memoryExceeded,
    runtimeMs,
  };
}

module.exports = { runInSandbox };
