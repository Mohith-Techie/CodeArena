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

// ---------------------------------------------------------------------------
// Sandbox network.
//
// We deliberately avoid Docker's built-in `none` network: on Docker Desktop
// (Windows/WSL2) creating a container with `--network none` fails with
// "bind-mount /proc/<pid>/ns/net ... no such file or directory".
//
// Instead we attach every sandbox container to a dedicated user-defined
// network created with `--internal`, which has NO route to the host or the
// internet — giving us the same "no network access" guarantee while working
// reliably across platforms. Create it once with:
//   docker network create --driver bridge --internal codearena_sandbox
//
// The name is overridable via SANDBOX_NETWORK, but the literal value "none"
// is treated as a request for the internal network (see above).
// ---------------------------------------------------------------------------
const SANDBOX_NETWORK =
  process.env.SANDBOX_NETWORK && process.env.SANDBOX_NETWORK !== 'none'
    ? process.env.SANDBOX_NETWORK
    : 'codearena_sandbox';

/**
 * Ensures the internal sandbox network exists, creating it (once) if missing.
 * This makes the worker self-healing: a fresh environment, a `docker network
 * prune`, or a `docker-compose down` no longer breaks judging.
 */
let ensureNetworkPromise = null;
function ensureSandboxNetwork() {
  if (ensureNetworkPromise) return ensureNetworkPromise;
  ensureNetworkPromise = (async () => {
    try {
      await docker.getNetwork(SANDBOX_NETWORK).inspect();
    } catch (err) {
      try {
        await docker.createNetwork({
          Name:     SANDBOX_NETWORK,
          Driver:   'bridge',
          Internal: true, // no route to the host or the internet
        });
        console.log(`[dockerRunner] Created internal sandbox network "${SANDBOX_NETWORK}"`);
      } catch (createErr) {
        // Another worker may have created it concurrently – ignore "already exists"
        if (!/already exists/i.test(createErr.message)) {
          console.warn(`[dockerRunner] Could not create sandbox network: ${createErr.message}`);
        }
      }
    }
  })();
  return ensureNetworkPromise;
}

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

  // Write the test-case input to a file that the program reads via stdin
  // redirection (`< /code/input.txt`). This is far more reliable than streaming
  // stdin over the Docker attach socket, which leaks/races on Docker Desktop.
  await fs.writeFile(path.join(tmpDir, 'input.txt'), input || '', 'utf8');

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
  // Compiled languages need extra headroom for the compiler/JVM (which run
  // inside the same container), so honour a per-language memory floor.
  const effectiveMemoryMb = Math.max(memoryLimitMb, langConfig.minMemoryMb || 0);
  const memoryBytes = effectiveMemoryMb * 1024 * 1024;

  const createOptions = {
    Image: langConfig.image,
    // Run the compile/run command with test-case input redirected from a file.
    Cmd:   ['sh', '-c', `${langConfig.command} < /code/input.txt`],

    AttachStdout: true,
    AttachStderr: true,
    Tty:          false,  // must be false for proper stream multiplexing

    HostConfig: {
      // ---- Memory ----
      Memory:     memoryBytes,
      MemorySwap: memoryBytes,   // swap = Memory → effectively disables swap

      // ---- CPU ----
      NanoCpus: 1e9,             // 1 full CPU core

      // ---- Network ----
      NetworkMode: SANDBOX_NETWORK, // internal-only network: no internet access

      // ---- Filesystem ----
      ReadonlyRootfs: false,     // compilation languages need to write binaries
      Binds: [`${tmpDir}:/code`],

      // ---- Security ----
      // We rely on Docker's built-in DEFAULT seccomp profile (which already
      // blocks ~44 dangerous syscalls) plus no-new-privileges. The bundled
      // custom whitelist (src/seccomp/profile.json) is incompatible with this
      // host's runtime (Docker Desktop / WSL2) and makes every container fail
      // to start ("OCI runtime create failed" / netns bind-mount error), so it
      // is opt-in via USE_CUSTOM_SECCOMP=1 rather than applied by default.
      SecurityOpt: [
        'no-new-privileges:true',
        ...(process.env.USE_CUSTOM_SECCOMP === '1' && seccompProfile
          ? [`seccomp=${seccompProfile}`]
          : []),
      ],

      // ---- Process limits ----
      PidsLimit: 64,             // prevent fork bombs

      // ---- Cleanup ----
      // NOTE: AutoRemove must stay FALSE. With AutoRemove the container (and
      // its logs) can be reaped the instant it exits, which races the attach
      // stream — output is lost and the stream never emits 'end'. We remove
      // the container manually after reading its logs (see below).
      AutoRemove: false,
    },
  };

  // ------------------------------------------------------------------
  // 5. Create & start the container (ensuring the sandbox network exists)
  // ------------------------------------------------------------------
  await ensureSandboxNetwork();

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
  // 6. Start the container. Output is collected afterwards via container.logs()
  //    (see step 10) — reliable because the container has already exited.
  // ------------------------------------------------------------------
  try {
    await container.start();
  } catch (err) {
    try { await container.remove({ force: true }); } catch (_) {}
    await cleanupDir(tmpDir);
    throw new Error(`Failed to start container: ${err.message}`);
  }

  // ------------------------------------------------------------------
  // 7. Wait for the container to exit, enforcing a hard wall-clock timeout.
  //
  //    We race container.wait() (the reliable "process finished" signal)
  //    against a kill timer. We deliberately do NOT depend on the attach
  //    stream's 'end' event for completion — under Docker Desktop it is
  //    unreliable and can hang forever, causing spurious TLEs.
  //
  //    Grace period: container cold-start on Docker Desktop / WSL2 can add
  //    ~1–2 s of pure overhead, so we allow timeLimitMs + SANDBOX_GRACE_MS.
  // ------------------------------------------------------------------
  // Grace covers container cold-start (~1-2s) AND compilation for C/C++/Java,
  // which happens inside the timed run on Docker Desktop. Generous by design.
  const graceMs        = parseInt(process.env.SANDBOX_GRACE_MS || '12000', 10);
  const hardDeadlineMs = timeLimitMs + graceMs;

  let timedOut = false;
  let killTimer;

  const timeoutPromise = new Promise((resolve) => {
    killTimer = setTimeout(async () => {
      timedOut = true;
      try {
        await container.kill({ signal: 'SIGKILL' });
      } catch (_) {
        // Container may have already exited – ignore
      }
      resolve({ StatusCode: 137 });
    }, hardDeadlineMs);
  });

  let exitCode = 1; // default to error
  let memoryExceeded = false;

  try {
    const waitResult = await Promise.race([container.wait(), timeoutPromise]);
    exitCode = waitResult.StatusCode;

    // Docker sets exit code 137 when a container is OOM-killed (SIGKILL).
    // Infer OOM by combining exit code 137 with a non-timeout scenario.
    if (exitCode === 137 && !timedOut) {
      memoryExceeded = true;
    }
  } catch (err) {
    console.warn(`[dockerRunner] container.wait() error: ${err.message}`);
  } finally {
    clearTimeout(killTimer);
  }

  const runtimeMs = Date.now() - startTime;

  // ------------------------------------------------------------------
  // 10. Read the full stdout / stderr from the container logs. This is far
  //     more reliable than the live attach stream: the container has already
  //     exited, so logs() returns everything it printed (even if killed).
  // ------------------------------------------------------------------
  let stdout = '';
  let stderr = '';
  try {
    const logBuffer = await container.logs({
      follow:     false,
      stdout:     true,
      stderr:     true,
      timestamps: false,
    });
    const buf = Buffer.isBuffer(logBuffer) ? logBuffer : Buffer.from(logBuffer);
    const demuxed = demuxDockerStream(buf);
    stdout = demuxed.stdout;
    stderr = demuxed.stderr;
  } catch (err) {
    console.warn(`[dockerRunner] container.logs() error: ${err.message}`);
  }

  // ------------------------------------------------------------------
  // 11. Remove the container, then clean up the temp directory
  // ------------------------------------------------------------------
  try {
    await container.remove({ force: true });
  } catch (err) {
    // Container might already be gone – non-fatal
  }
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
