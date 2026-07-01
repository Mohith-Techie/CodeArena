/**
 * Contest Routes
 * List, register for, and view standings of contests.
 */

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Computes the live contest status based on current time.
 * @param {Date} startTime
 * @param {Date} endTime
 * @returns {'UPCOMING' | 'LIVE' | 'ENDED'}
 */
function computeStatus(startTime, endTime) {
  const now = new Date();
  if (now < startTime) return 'UPCOMING';
  if (now > endTime) return 'ENDED';
  return 'LIVE';
}

// ─── Validation Schemas ──────────────────────────────────────────────────────

const createContestSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  isRated: z.boolean().optional(),
  freezeTime: z.string().datetime().optional(),
  problems: z
    .array(
      z.object({
        problemId: z.string(),
        label: z.string().min(1).max(5),
        points: z.number().int().min(0).optional(),
      })
    )
    .min(1)
    .max(26),
});

// ─── GET /api/contests ───────────────────────────────────────────────────────

router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    // Optional filter by status
    const statusFilter = req.query.status; // UPCOMING | LIVE | ENDED

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
          isRated: true,
          status: true,
          _count: {
            select: { problems: true, entries: true },
          },
        },
      }),
      prisma.contest.count(),
    ]);

    // Compute live status and optionally filter
    const enriched = contests
      .map((c) => ({
        ...c,
        computedStatus: computeStatus(c.startTime, c.endTime),
      }))
      .filter((c) => !statusFilter || c.computedStatus === statusFilter);

    // Check registration status for authenticated users
    if (req.user) {
      const userEntries = await prisma.contestEntry.findMany({
        where: {
          userId: req.user.id,
          contestId: { in: enriched.map((c) => c.id) },
        },
        select: { contestId: true },
      });
      const registeredIds = new Set(userEntries.map((e) => e.contestId));

      enriched.forEach((c) => {
        c.isRegistered = registeredIds.has(c.id);
      });
    }

    return res.status(200).json({
      contests: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[Contests] GET / error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/contests/:id ───────────────────────────────────────────────────

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        problems: {
          orderBy: { label: 'asc' },
          select: {
            label: true,
            points: true,
            problem: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                rating: true,
                tags: true,
                acceptanceRate: true,
                totalSubmissions: true,
              },
            },
          },
        },
        _count: { select: { entries: true } },
      },
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const computedStatus = computeStatus(contest.startTime, contest.endTime);

    // Check if current user is registered
    let isRegistered = false;
    if (req.user) {
      const entry = await prisma.contestEntry.findUnique({
        where: { userId_contestId: { userId: req.user.id, contestId: id } },
      });
      isRegistered = !!entry;
    }

    return res.status(200).json({
      contest: {
        ...contest,
        computedStatus,
        isRegistered,
      },
    });
  } catch (err) {
    console.error('[Contests] GET /:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/contests/:id/register ────────────────────────────────────────

router.post('/:id/register', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const contest = await prisma.contest.findUnique({
      where: { id },
      select: { id: true, startTime: true, endTime: true, title: true },
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const now = new Date();

    // Can only register before contest ends
    if (now > contest.endTime) {
      return res.status(400).json({ error: 'Cannot register for an ended contest' });
    }

    // Check if already registered
    const existingEntry = await prisma.contestEntry.findUnique({
      where: { userId_contestId: { userId: req.user.id, contestId: id } },
    });

    if (existingEntry) {
      return res.status(409).json({ error: 'Already registered for this contest' });
    }

    // Create contest entry
    const entry = await prisma.contestEntry.create({
      data: {
        userId: req.user.id,
        contestId: id,
      },
    });

    return res.status(201).json({
      message: `Successfully registered for "${contest.title}"`,
      entry,
    });
  } catch (err) {
    console.error('[Contests] POST /:id/register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/contests/:id/standings ────────────────────────────────────────

router.get('/:id/standings', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const contest = await prisma.contest.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        isFrozen: true,
        freezeTime: true,
        isRated: true,
        problems: {
          orderBy: { label: 'asc' },
          select: { label: true, points: true, problemId: true },
        },
      },
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.contestEntry.findMany({
        where: { contestId: id },
        orderBy: [{ score: 'desc' }, { penalty: 'asc' }],
        skip,
        take: limit,
        select: {
          score: true,
          penalty: true,
          rank: true,
          ratingChange: true,
          solvedLabels: true,
          user: {
            select: { id: true, username: true, rating: true, rank: true, avatar: true, country: true },
          },
        },
      }),
      prisma.contestEntry.count({ where: { contestId: id } }),
    ]);

    // Assign live rank positions
    const standings = entries.map((entry, idx) => ({
      position: skip + idx + 1,
      ...entry,
    }));

    return res.status(200).json({
      contest: {
        id: contest.id,
        title: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
        computedStatus: computeStatus(contest.startTime, contest.endTime),
        isFrozen: contest.isFrozen,
        isRated: contest.isRated,
        problems: contest.problems,
      },
      standings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[Contests] GET /:id/standings error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/contests ──────────────────────────────────────────────────────
// Admin only

router.post('/', verifyToken, async (req, res) => {
  try {
    const parsed = createContestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { problems: problemsData, ...contestData } = parsed.data;

    // Validate all problem IDs exist
    const problemIds = problemsData.map((p) => p.problemId);
    const foundProblems = await prisma.problem.findMany({
      where: { id: { in: problemIds } },
      select: { id: true },
    });

    if (foundProblems.length !== problemIds.length) {
      return res.status(400).json({ error: 'One or more problem IDs are invalid' });
    }

    // Validate labels are unique
    const labels = problemsData.map((p) => p.label);
    if (new Set(labels).size !== labels.length) {
      return res.status(400).json({ error: 'Problem labels must be unique within a contest' });
    }

    // Validate startTime < endTime
    if (new Date(contestData.startTime) >= new Date(contestData.endTime)) {
      return res.status(400).json({ error: 'startTime must be before endTime' });
    }

    const contest = await prisma.contest.create({
      data: {
        ...contestData,
        startTime: new Date(contestData.startTime),
        endTime: new Date(contestData.endTime),
        freezeTime: contestData.freezeTime ? new Date(contestData.freezeTime) : null,
        problems: {
          create: problemsData.map((p) => ({
            problemId: p.problemId,
            label: p.label,
            points: p.points ?? 100,
          })),
        },
      },
      include: {
        problems: {
          select: {
            label: true,
            points: true,
            problem: { select: { id: true, title: true, slug: true, difficulty: true } },
          },
        },
      },
    });

    return res.status(201).json({ contest });
  } catch (err) {
    console.error('[Contests] POST / error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
