/**
 * Problem Routes
 * Browse, search, and manage coding problems.
 */

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// ─── Validation Schemas ──────────────────────────────────────────────────────

const createProblemSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  rating: z.number().int().min(800).max(3500),
  description: z.string().min(10),
  constraints: z.string().min(1),
  examples: z
    .array(
      z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string().optional(),
      })
    )
    .min(1),
  tags: z.array(z.string()).min(1),
  timeLimitMs: z.number().int().min(100).max(10000).optional(),
  memoryLimitMb: z.number().int().min(16).max(1024).optional(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isSample: z.boolean().optional(),
        orderIndex: z.number().int().optional(),
      })
    )
    .min(1),
});

const updateProblemSchema = createProblemSchema.partial();

// ─── GET /api/problems ───────────────────────────────────────────────────────

router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    // Build where clause from query params
    const where = { isVisible: true };

    if (req.query.difficulty) {
      const diff = req.query.difficulty;
      if (['Easy', 'Medium', 'Hard'].includes(diff)) {
        where.difficulty = diff;
      }
    }

    if (req.query.tag) {
      where.tags = { has: req.query.tag };
    }

    if (req.query.search) {
      where.OR = [
        { title: { contains: req.query.search, mode: 'insensitive' } },
        { tags: { has: req.query.search } },
      ];
    }

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        skip,
        take: limit,
        orderBy: req.query.sort === 'rating'
          ? { rating: 'asc' }
          : req.query.sort === 'acceptance'
          ? { acceptanceRate: 'desc' }
          : { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          rating: true,
          tags: true,
          acceptanceRate: true,
          totalSubmissions: true,
          accepted: true,
          timeLimitMs: true,
          memoryLimitMb: true,
          createdAt: true,
        },
      }),
      prisma.problem.count({ where }),
    ]);

    return res.status(200).json({
      problems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[Problems] GET / error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/problems/:slug ─────────────────────────────────────────────────

router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { slug },
      include: {
        // Return only sample test cases for the public view
        testCases: {
          where: { isSample: true },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            input: true,
            expectedOutput: true,
            isSample: true,
            orderIndex: true,
          },
        },
      },
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    if (!problem.isVisible) {
      return res.status(403).json({ error: 'Problem is not available' });
    }

    return res.status(200).json({ problem });
  } catch (err) {
    console.error('[Problems] GET /:slug error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/problems ──────────────────────────────────────────────────────
// Admin only (for now, any authenticated user can create — extend with role check)

router.post('/', verifyToken, async (req, res) => {
  try {
    const parsed = createProblemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { testCases, ...problemData } = parsed.data;

    // Check slug uniqueness
    const existing = await prisma.problem.findUnique({ where: { slug: problemData.slug } });
    if (existing) {
      return res.status(409).json({ error: 'A problem with this slug already exists' });
    }

    const problem = await prisma.problem.create({
      data: {
        ...problemData,
        testCases: {
          create: testCases.map((tc, idx) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isSample: tc.isSample ?? false,
            orderIndex: tc.orderIndex ?? idx,
          })),
        },
      },
      include: {
        testCases: { orderBy: { orderIndex: 'asc' } },
      },
    });

    return res.status(201).json({ problem });
  } catch (err) {
    console.error('[Problems] POST / error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/problems/:id ───────────────────────────────────────────────────
// Admin only

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const parsed = updateProblemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { testCases, ...problemData } = parsed.data;

    // Verify problem exists
    const existing = await prisma.problem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Update problem (optionally replace test cases)
    const updated = await prisma.$transaction(async (tx) => {
      if (testCases && testCases.length > 0) {
        // Replace all test cases
        await tx.testCase.deleteMany({ where: { problemId: id } });
        await tx.testCase.createMany({
          data: testCases.map((tc, idx) => ({
            problemId: id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isSample: tc.isSample ?? false,
            orderIndex: tc.orderIndex ?? idx,
          })),
        });
      }

      return tx.problem.update({
        where: { id },
        data: problemData,
        include: {
          testCases: { orderBy: { orderIndex: 'asc' } },
        },
      });
    });

    return res.status(200).json({ problem: updated });
  } catch (err) {
    console.error('[Problems] PUT /:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
