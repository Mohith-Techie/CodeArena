/**
 * Language configuration for the CodeArena sandbox executor.
 *
 * Each entry defines:
 *  - image:            Docker image to pull/use for execution
 *  - extension:        Source file extension
 *  - filename:         Default filename written inside /code
 *  - buildAndRunCmd:   Function returning the Docker Cmd array
 *  - memoryLimitMb:    Default memory cap (can be overridden per-problem)
 *  - timeLimitMs:      Default time cap   (can be overridden per-problem)
 */

const LANGUAGES = {
  python: {
    image: 'python:3.12-slim',
    extension: '.py',
    filename: 'solution.py',
    /**
     * Runs the Python script directly - no compilation step needed.
     * @param {string} codeFile - Absolute path inside the container (/code/solution.py)
     * @returns {string[]}
     */
    buildAndRunCmd: (codeFile) => ['python3', codeFile],
    memoryLimitMb: 256,
    timeLimitMs: 5000,
  },

  javascript: {
    image: 'node:20-slim',
    extension: '.js',
    filename: 'solution.js',
    /**
     * Runs the JS file with Node - no compilation step needed.
     * @param {string} codeFile
     * @returns {string[]}
     */
    buildAndRunCmd: (codeFile) => ['node', codeFile],
    memoryLimitMb: 256,
    timeLimitMs: 5000,
  },

  java: {
    image: 'eclipse-temurin:21-jdk-slim',
    extension: '.java',
    // IMPORTANT: Java requires the public class name to match the filename.
    // The submitted solution must declare `public class Main`.
    filename: 'Main.java',
    /**
     * Compiles then runs Main.java inside the container's /code directory.
     * Uses sh -c so we can chain two commands with &&.
     * @param {string} _codeFile - Unused; Java always targets Main.java
     * @returns {string[]}
     */
    buildAndRunCmd: (_codeFile) => [
      'sh',
      '-c',
      'cd /code && javac Main.java && java Main',
    ],
    memoryLimitMb: 256,
    timeLimitMs: 5000,
  },

  cpp: {
    image: 'gcc:14',
    extension: '.cpp',
    filename: 'solution.cpp',
    /**
     * Compiles with g++ at -O2, then runs the resulting binary.
     * @param {string} _codeFile
     * @returns {string[]}
     */
    buildAndRunCmd: (_codeFile) => [
      'sh',
      '-c',
      'cd /code && g++ -O2 -o solution solution.cpp && ./solution',
    ],
    memoryLimitMb: 256,
    timeLimitMs: 5000,
  },

  c: {
    image: 'gcc:14',
    extension: '.c',
    filename: 'solution.c',
    /**
     * Compiles with gcc at -O2, then runs the resulting binary.
     * @param {string} _codeFile
     * @returns {string[]}
     */
    buildAndRunCmd: (_codeFile) => [
      'sh',
      '-c',
      'cd /code && gcc -O2 -o solution solution.c && ./solution',
    ],
    memoryLimitMb: 256,
    timeLimitMs: 5000,
  },
};

module.exports = { LANGUAGES };
