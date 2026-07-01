'use strict';

/**
 * testCaseRunner.js
 *
 * Orchestrates running user code against all test cases for a problem.
 * Uses a fail-fast strategy: stops on the first failed test case to avoid
 * wasting resources on subsequent cases that would also fail.
 *
 * Verdict priority (highest to lowest):
 *   CE  → Compilation Error   (exit code non-zero on first run, stderr non-empty)
 *   TLE → Time Limit Exceeded
 *   MLE → Memory Limit Exceeded
 *   RE  → Runtime Error       (non-zero exit code without TLE/MLE)
 *   WA  → Wrong Answer
 *   AC  → Accepted
 */

const { runInSandbox } = require('./dockerRunner');

/**
 * Normalises program output for comparison:
 *  - Trim leading/trailing whitespace from the full string
 *  - Trim trailing whitespace from each line (handles \r\n on Windows judges)
 *
 * @param {string} raw
 * @returns {string}
 */
function normalise(raw) {
  return raw
    .trim()
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
}

/**
 * Determines the verdict for a single sandbox result.
 *
 * @param {object} result   - Output from runInSandbox()
 * @param {string} expected - Expected output string from the test case
 * @returns {{ verdict: string, errorMessage: string|null }}
 */
function verdictForResult(result, expected) {
  const { timedOut, memoryExceeded, exitCode, stdout, stderr } = result;

  if (timedOut) {
    return { verdict: 'TLE', errorMessage: 'Time limit exceeded' };
  }

  if (memoryExceeded) {
    return { verdict: 'MLE', errorMessage: 'Memory limit exceeded' };
  }

  // Non-zero exit code without TLE/MLE → Runtime Error or Compilation Error.
  // We distinguish CE by checking stderr on the FIRST test case; the caller
  // handles this distinction if needed.
  if (exitCode !== 0) {
    const errMsg = stderr
      ? stderr.slice(0, 512) // cap error message length stored in DB
      : 'Runtime error (non-zero exit code)';
    return { verdict: 'RE', errorMessage: errMsg };
  }

  // Compare output
  if (normalise(stdout) === normalise(expected)) {
    return { verdict: 'ACCEPTED', errorMessage: null };
  }

  return {
    verdict: 'WRONG_ANSWER',
    errorMessage: `Expected:\n${expected.slice(0, 256)}\nGot:\n${stdout.slice(0, 256)}`,
  };
}

/**
 * Runs the submitted code against every test case and aggregates results.
 *
 * @param {object} params
 * @param {string}   params.code           - User's source code
 * @param {string}   params.language       - Language key ('python', 'cpp', etc.)
 * @param {Array<{
 *   id:             string,
 *   input:          string,
 *   expectedOutput: string
 * }>}               params.testCases      - Ordered array of test cases
 * @param {number}   params.timeLimitMs    - Per-test-case time limit (ms)
 * @param {number}   params.memoryLimitMb  - Memory cap per container (MB)
 *
 * @returns {Promise<{
 *   verdict:      string,
 *   passedCases:  number,
 *   totalCases:   number,
 *   runtimeMs:    number,
 *   memoryKb:     number,
 *   errorMessage: string|null,
 *   results:      Array<object>
 * }>}
 */
async function runAllTestCases({ code, language, testCases, timeLimitMs, memoryLimitMb }) {
  if (!testCases || testCases.length === 0) {
    throw new Error('No test cases provided for evaluation');
  }

  const perCaseResults = [];
  let passedCases     = 0;
  let maxRuntimeMs    = 0;
  let finalVerdict    = 'ACCEPTED';
  let finalError      = null;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];

    // ----------------------------------------------------------------
    // Run this test case in the sandbox
    // ----------------------------------------------------------------
    let sandboxResult;
    try {
      sandboxResult = await runInSandbox({
        code,
        language,
        input:         tc.input,
        timeLimitMs,
        memoryLimitMb,
      });
    } catch (err) {
      // Docker-level failure (image not found, daemon unreachable, etc.)
      // Treat as a system error → Runtime Error
      const caseResult = {
        passed:         false,
        testCaseId:     tc.id,
        input:          tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput:   '',
        runtimeMs:      0,
        timedOut:       false,
        memoryExceeded: false,
        errorMessage:   `Execution system error: ${err.message}`,
      };
      perCaseResults.push(caseResult);

      finalVerdict = 'RE';
      finalError   = caseResult.errorMessage;
      break; // fail-fast
    }

    // Track peak runtime across all cases
    if (sandboxResult.runtimeMs > maxRuntimeMs) {
      maxRuntimeMs = sandboxResult.runtimeMs;
    }

    // ----------------------------------------------------------------
    // Determine verdict for this individual test case
    // ----------------------------------------------------------------
    const { verdict, errorMessage } = verdictForResult(sandboxResult, tc.expectedOutput);

    // Special-case: treat RE on the very first test case where we also
    // have stderr content as a Compilation Error (CE).
    let effectiveVerdict = verdict;
    if (
      verdict === 'RE' &&
      i === 0 &&
      sandboxResult.stderr &&
      sandboxResult.stderr.length > 0
    ) {
      // Heuristic: compilers write to stderr and exit with non-zero.
      // For interpreted languages (Python/JS) this is still RE, but for
      // compiled ones the worker.js layer can log it as CE if desired.
      // We expose it here and let the worker decide.
      effectiveVerdict = 'CE';
    }

    const passed = effectiveVerdict === 'ACCEPTED';
    if (passed) passedCases++;

    const caseResult = {
      passed,
      testCaseId:     tc.id,
      input:          tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput:   sandboxResult.stdout,
      runtimeMs:      sandboxResult.runtimeMs,
      timedOut:       sandboxResult.timedOut,
      memoryExceeded: sandboxResult.memoryExceeded,
      errorMessage:   errorMessage,
    };
    perCaseResults.push(caseResult);

    // ----------------------------------------------------------------
    // Fail-fast: stop on first non-accepted result
    // ----------------------------------------------------------------
    if (!passed) {
      finalVerdict = effectiveVerdict;
      finalError   = errorMessage;
      break;
    }
  }

  // Map internal 'ACCEPTED' (per-case) to final verdict strings
  const verdictMap = {
    ACCEPTED:     'ACCEPTED',
    WRONG_ANSWER: 'WRONG_ANSWER',
    TLE:          'TLE',
    MLE:          'MLE',
    RE:           'RE',
    CE:           'CE',
  };

  return {
    verdict:      verdictMap[finalVerdict] || 'RE',
    passedCases,
    totalCases:   testCases.length,
    runtimeMs:    maxRuntimeMs,
    memoryKb:     0, // Placeholder – Docker's memory stats API requires
                     // an additional Stats call; omitted for performance.
    errorMessage: finalError,
    results:      perCaseResults,
  };
}

module.exports = { runAllTestCases };
