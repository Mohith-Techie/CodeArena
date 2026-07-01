'use strict';

/**
 * worker.js
 *
 * CodeArena Worker Service – entry point.
 *
 * Responsibilities:
 *  1. Connect to Redis (BullMQ consumer + raw pub/sub publisher)
 *  2. Consume jobs from the 'submission-queue'
 *  3. For each job:
 *     a. Idempotency check – skip if submission is no longer PENDING
 *     b. Mark submission as RUNNING
 *     c. Fetch test cases from the database
 *     d. Execute code via testCaseRunner (→ dockerRunner)
 *     e. Persist verdict, runtime, and pass/fail counts back to DB
 *     f. Update problem-level statistics (totalSubmissions, accepted, acceptanceRate)
 *     g. Publish result event to Redis pub/sub (picked up by api-server → Socket.IO)
 *     h. If this is a contest submission, update ContestEntry scores
 *  4. On unexpected worker crash, mark submission as RE to avoid stuck PENDING/RUNNING states
 */

require('dotenv').config();

const { Worker, UnrecoverableError } = require('bullmq');
const { PrismaClient }               = require('@prisma/client');
const IORedis                        = require('ioredis');

const { runAllTestCases }    = require('./executor/testCaseRunner');
const { updateContestEntry } = require('./executor/contestScoring');

// ---------------------------------------------------------------------------
// Environment variables with sensible defaults
// ---------------------------------------------------------------------------
const REDIS_URL          = process.env.REDIS_URL          || 'redis://localhost:6379';
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '2', 10);
const QUEUE_NAME         = 'submission-queue';
const RESULT_CHANNEL     = 'submission-results';

// ---------------------------------------------------------------------------
// Prisma client – single instance shared across all concurrent job handlers
// ---------------------------------------------------------------------------
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// ---------------------------------------------------------------------------
// IORedis connections
//  - BullMQ needs its own connection (it calls .subscribe() internally)
//  - We need a separate connection for publishing results because a Redis
//    client in subscriber mode cannot issue regular commands.
// ---------------------------------------------------------------------------
const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck:     false,
});

const redisPublisher = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck:     false,
});

redisConnection.on('error',  (err) => console.error('[Redis/BullMQ]  connection error:', err.message));
redisPublisher.on('error',   (err) => console.error('[Redis/Publish] connection error:', err.message));
redisConnection.on('connect',  () => console.log('[Redis/BullMQ]  connected'));
redisPublisher.on('connect',   () => console.log('[Redis/Publish] connected'));

// ---------------------------------------------------------------------------
// Helper: publish the submission result so the api-server can push it over
// Socket.IO to the waiting browser tab.
// ---------------------------------------------------------------------------
async function publishResult(payload) {
  try {
    await redisPublisher.publish(RESULT_CHANNEL, JSON.stringify(payload));
  } catch (err) {
    // Non-fatal – the user just won't receive a real-time update
    console.error('[worker] Failed to publish result to Redis:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Helper: safely mark a submission as errored when the worker itself crashes.
// ---------------------------------------------------------------------------
async function markSubmissionFailed(submissionId, errorMessage) {
  try {
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status:       'RE',
        errorMessage: errorMessage || 'Internal worker error',
      },
    });
  } catch (dbErr) {
    console.error(`[worker] Failed to mark submission ${submissionId} as failed:`, dbErr.message);
  }
}

// ---------------------------------------------------------------------------
// Core job processor
// ---------------------------------------------------------------------------
/**
 * Processes a single submission job from BullMQ.
 *
 * @param {import('bullmq').Job} job
 */
async function processSubmission(job) {
  const jobStart = Date.now();
  const { submissionId, userId, problemId, language, code } = job.data;

  console.log(
    `[worker] ▶ Job ${job.id} | submissionId=${submissionId} | ` +
    `lang=${language} | userId=${userId}`
  );

  // -------------------------------------------------------------------------
  // Step 1: Idempotency check
  //   If a previous worker already processed this job (duplicate delivery),
  //   or the submission was cancelled, skip processing.
  // -------------------------------------------------------------------------
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    console.warn(`[worker] Submission ${submissionId} not found in DB – skipping`);
    return; // Ack the job; nothing to do
  }

  if (submission.status !== 'PENDING') {
    console.warn(
      `[worker] Submission ${submissionId} has status "${submission.status}" ` +
      `(expected PENDING) – skipping (idempotency guard)`
    );
    return;
  }

  // -------------------------------------------------------------------------
  // Step 2: Mark submission as RUNNING
  // -------------------------------------------------------------------------
  await prisma.submission.update({
    where: { id: submissionId },
    data:  { status: 'RUNNING' },
  });

  // -------------------------------------------------------------------------
  // Step 3: Fetch test cases (ordered by orderIndex ascending)
  // -------------------------------------------------------------------------
  const testCases = await prisma.testCase.findMany({
    where:   { problemId },
    orderBy: { orderIndex: 'asc' },
    select:  { id: true, input: true, expectedOutput: true },
  });

  if (testCases.length === 0) {
    const msg = `No test cases found for problem ${problemId}`;
    console.error(`[worker] ${msg}`);
    await markSubmissionFailed(submissionId, msg);
    await publishResult({
      submissionId,
      userId,
      status:       'RE',
      runtimeMs:    0,
      passedCases:  0,
      totalCases:   0,
      errorMessage: msg,
    });
    return;
  }

  // -------------------------------------------------------------------------
  // Step 4: Fetch problem limits (may differ from language defaults)
  // -------------------------------------------------------------------------
  const problem = await prisma.problem.findUnique({
    where:  { id: problemId },
    select: { timeLimitMs: true, memoryLimitMb: true },
  });

  const timeLimitMs   = problem?.timeLimitMs   ?? 5000;
  const memoryLimitMb = problem?.memoryLimitMb ?? 256;

  // -------------------------------------------------------------------------
  // Step 5: Execute code against all test cases
  // -------------------------------------------------------------------------
  let judgeResult;
  try {
    judgeResult = await runAllTestCases({
      code,
      language,
      testCases,
      timeLimitMs,
      memoryLimitMb,
    });
  } catch (executionErr) {
    // Catastrophic failure (Docker daemon down, etc.)
    const msg = `Execution system failure: ${executionErr.message}`;
    console.error(`[worker] ${msg}`);
    await markSubmissionFailed(submissionId, msg);
    await publishResult({
      submissionId,
      userId,
      status:       'RE',
      runtimeMs:    0,
      passedCases:  0,
      totalCases:   testCases.length,
      errorMessage: msg,
    });
    // Rethrow so BullMQ marks the job as failed and can retry
    throw executionErr;
  }

  const { verdict, passedCases, totalCases, runtimeMs, memoryKb, errorMessage } = judgeResult;

  console.log(
    `[worker] ✔ Job ${job.id} | submissionId=${submissionId} | ` +
    `verdict=${verdict} | passed=${passedCases}/${totalCases} | ` +
    `runtime=${runtimeMs}ms | elapsed=${Date.now() - jobStart}ms`
  );

  // -------------------------------------------------------------------------
  // Step 6: Persist final verdict to the submission record
  // -------------------------------------------------------------------------
  const updatedSubmission = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status:       verdict,
      runtimeMs,
      memoryKb:     memoryKb || null,
      passedCases,
      totalCases,
      errorMessage: errorMessage || null,
    },
  });

  // -------------------------------------------------------------------------
  // Step 7: Update problem-level statistics atomically
  //   totalSubmissions always increments.
  //   accepted increments only on ACCEPTED verdict.
  //   acceptanceRate is recalculated from the new totals.
  // -------------------------------------------------------------------------
  try {
    // Use a transaction to keep the counters consistent
    await prisma.$transaction(async (tx) => {
      const updatedProblem = await tx.problem.update({
        where: { id: problemId },
        data: {
          totalSubmissions: { increment: 1 },
          accepted:         verdict === 'ACCEPTED' ? { increment: 1 } : undefined,
        },
      });

      // Recalculate acceptance rate (guard against division by zero)
      const newRate =
        updatedProblem.totalSubmissions > 0
          ? (updatedProblem.accepted / updatedProblem.totalSubmissions) * 100
          : 0;

      await tx.problem.update({
        where: { id: problemId },
        data:  { acceptanceRate: parseFloat(newRate.toFixed(2)) },
      });
    });
  } catch (statsErr) {
    // Non-fatal – statistics are cosmetic; don't fail the whole job
    console.error('[worker] Failed to update problem stats:', statsErr.message);
  }

  // -------------------------------------------------------------------------
  // Step 8: Publish real-time result event for Socket.IO relay
  // -------------------------------------------------------------------------
  await publishResult({
    submissionId,
    userId,
    status:       verdict,
    runtimeMs,
    passedCases,
    totalCases,
    errorMessage: errorMessage || null,
  });

  // -------------------------------------------------------------------------
  // Step 9: Contest scoring (only for contest submissions)
  // -------------------------------------------------------------------------
  const contestId = updatedSubmission.contestId || submission.contestId;

  if (contestId) {
    try {
      await updateContestEntry(prisma, {
        userId,
        contestId,
        problemId,
        verdict,
        submittedAt: updatedSubmission.createdAt,
      });
    } catch (contestErr) {
      // Non-fatal – don't fail the job; log for investigation
      console.error(
        `[worker] Failed to update contest entry for contestId=${contestId}:`,
        contestErr.message
      );
    }
  }
}

// ---------------------------------------------------------------------------
// BullMQ Worker
// ---------------------------------------------------------------------------
const worker = new Worker(QUEUE_NAME, processSubmission, {
  connection:  redisConnection,
  concurrency: WORKER_CONCURRENCY,

  // Retry failed jobs up to 3 times with exponential back-off.
  // Jobs that throw UnrecoverableError skip retries immediately.
  defaultJobOptions: {
    attempts:    3,
    backoff: {
      type:  'exponential',
      delay: 1000, // 1 s → 2 s → 4 s
    },
  },
});

// ---------------------------------------------------------------------------
// Worker event listeners
// ---------------------------------------------------------------------------
worker.on('completed', (job) => {
  console.log(`[worker] ✅ Job ${job.id} completed successfully`);
});

worker.on('failed', async (job, err) => {
  console.error(`[worker] ❌ Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);

  // On the final retry attempt, mark the submission as RE in the DB so it
  // doesn't stay stuck in RUNNING state forever.
  if (job && job.attemptsMade >= (job.opts?.attempts ?? 1)) {
    const { submissionId } = job.data || {};
    if (submissionId) {
      await markSubmissionFailed(
        submissionId,
        `Job failed after ${job.attemptsMade} attempts: ${err.message}`
      );
      await publishResult({
        submissionId,
        userId:       job.data.userId,
        status:       'RE',
        runtimeMs:    0,
        passedCases:  0,
        totalCases:   0,
        errorMessage: err.message,
      });
    }
  }
});

worker.on('error', (err) => {
  console.error('[worker] Worker error:', err.message);
});

worker.on('active', (job) => {
  console.log(`[worker] ⏳ Job ${job.id} is now active (submissionId=${job.data?.submissionId})`);
});

worker.on('stalled', (jobId) => {
  console.warn(`[worker] ⚠ Job ${jobId} stalled – will be retried`);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
//   SIGTERM / SIGINT → drain current jobs → close DB & Redis connections
// ---------------------------------------------------------------------------
async function shutdown(signal) {
  console.log(`\n[worker] Received ${signal} – shutting down gracefully…`);

  try {
    // Stop accepting new jobs; wait for active jobs to finish (up to 30 s)
    await worker.close();
    console.log('[worker] BullMQ worker closed');

    await prisma.$disconnect();
    console.log('[worker] Prisma disconnected');

    await redisPublisher.quit();
    await redisConnection.quit();
    console.log('[worker] Redis connections closed');
  } catch (err) {
    console.error('[worker] Error during shutdown:', err.message);
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ---------------------------------------------------------------------------
// Startup banner
// ---------------------------------------------------------------------------
console.log('╔══════════════════════════════════════════╗');
console.log('║      CodeArena Worker Service v1.0       ║');
console.log('╚══════════════════════════════════════════╝');
console.log(`[worker] Queue:       ${QUEUE_NAME}`);
console.log(`[worker] Concurrency: ${WORKER_CONCURRENCY}`);
console.log(`[worker] Redis:       ${REDIS_URL.replace(/:\/\/.*@/, '://****@')}`);
console.log('[worker] Waiting for jobs…\n');
