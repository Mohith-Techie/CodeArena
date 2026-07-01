/**
 * BullMQ Submission Producer
 * Enqueues code submission jobs into the 'submission-queue' for worker processing.
 */

const { Queue } = require('bullmq');
const { Redis } = require('ioredis');

// Redis connection for BullMQ
// Supports both REDIS_URL (redis://host:port) and individual REDIS_HOST/REDIS_PORT vars
function createRedisConnection() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const url = new URL(redisUrl);
    return new Redis({
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      maxRetriesPerRequest: null,
    });
  }
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  });
}

const redisConnection = createRedisConnection();

redisConnection.on('error', (err) => {
  console.error('[BullMQ Redis] Connection error:', err.message);
});

redisConnection.on('connect', () => {
  console.log('[BullMQ Redis] Connected to Redis');
});

// Initialize the submission queue
const submissionQueue = new Queue('submission-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 1000 }, // Keep last 1000 completed jobs
    removeOnFail: { count: 500 },      // Keep last 500 failed jobs
  },
});

/**
 * Enqueues a submission job into the BullMQ queue.
 *
 * @param {Object} jobData
 * @param {string} jobData.submissionId  - Unique submission ID (used as BullMQ job ID)
 * @param {string} jobData.userId        - ID of the submitting user
 * @param {string} jobData.problemId     - ID of the problem
 * @param {string} jobData.language      - Programming language (python, javascript, etc.)
 * @param {string} jobData.code          - Source code to execute
 * @param {number} jobData.timeLimitMs   - Time limit in milliseconds
 * @param {number} jobData.memoryLimitMb - Memory limit in megabytes
 * @param {string} [jobData.contestId]   - Optional contest ID if part of a contest
 * @returns {Promise<Job>} The created BullMQ job
 */
async function enqueueSubmission(jobData) {
  const job = await submissionQueue.add('judge', jobData, {
    jobId: jobData.submissionId, // Use submissionId as job ID for deduplication
  });

  console.log(`[Queue] Enqueued submission ${jobData.submissionId} (job ${job.id})`);
  return job;
}

module.exports = { enqueueSubmission, submissionQueue, redisConnection };
