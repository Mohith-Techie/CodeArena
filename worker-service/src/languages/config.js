/**
 * Language configuration for the CodeArena sandbox executor.
 *
 * Each entry defines:
 *  - image:         Docker image used for execution
 *  - filename:      Source file written inside the bind-mounted /code dir
 *  - command:       Shell command (string) that compiles/runs the solution.
 *                   Test-case input is fed by the runner via `< /code/input.txt`,
 *                   so commands must NOT read from anywhere else.
 *  - memoryLimitMb: Default memory cap (can be overridden per-problem)
 *  - timeLimitMs:   Default time cap   (can be overridden per-problem)
 *
 * IMPORTANT (Docker Desktop / WSL2):
 *  - The /code directory is a bind mount and is often mounted `noexec`, so
 *    compiled binaries are written to /tmp (the container's own writable layer)
 *    and executed from there — otherwise you get "./solution: Permission denied".
 */

const LANGUAGES = {
  python: {
    image: 'python:3.12-slim',
    filename: 'solution.py',
    command: 'python3 /code/solution.py',
    memoryLimitMb: 256,
    timeLimitMs: 5000,
  },

  javascript: {
    image: 'node:20-slim',
    filename: 'solution.js',
    command: 'node /code/solution.js',
    memoryLimitMb: 256,
    timeLimitMs: 5000,
  },

  java: {
    image: 'eclipse-temurin:21-jdk',
    // Java requires the public class name to match the filename → `public class Main`.
    filename: 'Main.java',
    // Compile classes into /tmp and run from there to avoid the noexec bind mount.
    command: 'javac -d /tmp /code/Main.java && java -cp /tmp Main',
    memoryLimitMb: 256,
    // The JVM + javac reserve well over the runtime limit; give the container room.
    minMemoryMb: 768,
    timeLimitMs: 5000,
  },

  cpp: {
    image: 'gcc:14',
    filename: 'solution.cpp',
    command: 'g++ -O2 -o /tmp/solution /code/solution.cpp && /tmp/solution',
    memoryLimitMb: 256,
    // Compiling <bits/stdc++.h> at -O2 needs ~300-400MB in cc1plus; without this
    // floor the compiler gets OOM-killed and the submission is misreported as CE.
    minMemoryMb: 512,
    timeLimitMs: 5000,
  },

  c: {
    image: 'gcc:14',
    filename: 'solution.c',
    command: 'gcc -O2 -o /tmp/solution /code/solution.c && /tmp/solution',
    memoryLimitMb: 256,
    minMemoryMb: 512,
    timeLimitMs: 5000,
  },
};

module.exports = { LANGUAGES };
