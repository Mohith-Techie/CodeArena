/**
 * User Routes
 * Public and private user profile management.
 */

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// ─── Validation Schemas ──────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  country: z.string().max(100).optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional().or(z.literal('')),
});

// ─── GET /api/users/:username ────────────────────────────────────────────────

router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        rating: true,
        maxRating: true,
        rank: true,
        avatar: true,
        country: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            submissions: true,
            contestEntries: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('[Users] GET /:username error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/users/me ─────────────────────────────────────────────────────

router.patch('/me', verifyToken, async (req, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.errors.map((e) => ({ field: e.path[0], message: e.message })),
      });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: parsed.data,
      select: {
        id: true,
        username: true,
        email: true,
        rating: true,
        maxRating: true,
        rank: true,
        avatar: true,
        country: true,
        bio: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ user: updated });
  } catch (err) {
    console.error('[Users] PATCH /me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
