/**
 * Submission Routes
 * Handle code submission, queueing, and retrieval.
 */

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { enqueueSubmission } = require('../queue/producer');

// ─── Supported Languages ─────────────────────────────────────────────────────

const SUPPORTED_LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'c'];

// ─── Validation Schema ───────────────────────────────────────────────────────

const submitSchema = z.object({
  problemId: z.string().min(1, 'Problem ID is required'),
  language: z.enum(SUPPORTED_LANGUAGES, {
    errorMap: () => ({
      message: `Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`,
    }),
  }),
  code: z
    .string()
    .min(1, 'Code cannot be empty')
    .max(65536, 'Code must not exceed 65536 characters'),
  contestId: z.string().optional(),
});

// ─── POST /api/submissions ───────────────────────────────────────────────────

router.post('/', verifyToken, async (req, res) => {
  try {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.errors.map((e) => ({ field: e.path[0], message: e.message })),
      });
    }

    const { problemId, language, code, contestId } = parsed.data;

    // Verify problem exists and is visible
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        title: true,
        timeLimitMs: true,
        memoryLimitMb: true,
        isVisible: true,
        _count: { select: { testCases: true } },
      },
    });

    if (!problem || !problem.isVisible) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // If contestId is provided, verify contest is live and user is registered
    if (contestId) {
      const now = new Date();
      const entry = await prisma.contestEntry.findUnique({
        where: { userId_contestId: { userId: req.user.id, contestId } },
        include: {
          contest: { select: { startTime: true, endTime: true, status: true } },
        },
      });

      if (!entry) {
        return res.status(403).json({ error: 'You are not registered for this contest' });
      }

      if (now < entry.contest.startTime) {
        return res.status(403).json({ error: 'Contest has not started yet' });
      }

      if (now > entry.contest.endTime) {
        return res.status(403).json({ error: 'Contest has already ended' });
      }
    }

    // Create submission record with PENDING status
    const submission = await prisma.submission.create({
      data: {
        userId: req.user.id,
        problemId,
        language,
        code,
        status: 'PENDING',
        totalCases: problem._count.testCases,
        contestId: contestId || null,
      },
    });

    // Update total submissions counter on the problem
    await prisma.problem.update({
      where: { id: problemId },
      data: { totalSubmissions: { increment: 1 } },
    });

    // Enqueue job for the judge worker
    await enqueueSubmission({
      submissionId: submission.id,
      userId: req.user.id,
      problemId,
      language,
      code,
      timeLimitMs: problem.timeLimitMs,
      memoryLimitMb: problem.memoryLimitMb,
      contestId: contestId || null,
    });

    return res.status(202).json({
      message: 'Submission received and queued',
      submissionId: submission.id,
    });
  } catch (err) {
    console.error('[Submissions] POST / error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/submissions ────────────────────────────────────────────────────

router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    // Optional filters
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;
    if (req.query.language) where.language = req.query.language;
    if (req.query.problemId) where.problemId = req.query.problemId;
    if (req.query.contestId) where.contestId = req.query.contestId;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          language: true,
          status: true,
          runtimeMs: true,
          memoryKb: true,
          passedCases: true,
          totalCases: true,
          createdAt: true,
          problem: {
            select: { id: true, title: true, slug: true, difficulty: true },
          },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    return res.status(200).json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[Submissions] GET / error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/submissions/:id ────────────────────────────────────────────────

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        problem: {
          select: { id: true, title: true, slug: true, difficulty: true, timeLimitMs: true, memoryLimitMb: true },
        },
        user: {
          select: { id: true, username: true },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Users can only view their own submissions
    // (Admins can view all — extend with role check as needed)
    if (submission.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.status(200).json({ submission });
  } catch (err) {
    console.error('[Submissions] GET /:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
