/**
 * Leaderboard Routes
 * Global rankings and per-user statistics.
 */

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { optionalAuth } = require('../middleware/auth');

// ─── GET /api/leaderboard ────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: [{ rating: 'desc' }, { username: 'asc' }],
        select: {
          id: true,
          username: true,
          rating: true,
          maxRating: true,
          rank: true,
          avatar: true,
          country: true,
          _count: {
            select: { submissions: true, contestEntries: true },
          },
        },
      }),
      prisma.user.count(),
    ]);

    // Add global rank position
    const rankedUsers = users.map((u, idx) => ({
      position: skip + idx + 1,
      ...u,
    }));

    return res.status(200).json({
      leaderboard: rankedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[Leaderboard] GET / error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/leaderboard/user/:username ─────────────────────────────────────

router.get('/user/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: false, // Do not expose email in public profiles
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

    // Count accepted submissions
    const acceptedCount = await prisma.submission.count({
      where: { userId: user.id, status: 'ACCEPTED' },
    });

    // Count unique problems solved
    const uniqueSolved = await prisma.submission.groupBy({
      by: ['problemId'],
      where: { userId: user.id, status: 'ACCEPTED' },
    });

    // Recent submissions (last 10)
    const recentSubmissions = await prisma.submission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        language: true,
        runtimeMs: true,
        createdAt: true,
        problem: {
          select: { title: true, slug: true, difficulty: true },
        },
      },
    });

    // Contest participation
    const contestEntries = await prisma.contestEntry.findMany({
      where: { userId: user.id },
      orderBy: { contest: { startTime: 'desc' } },
      take: 10,
      select: {
        score: true,
        rank: true,
        ratingChange: true,
        contest: {
          select: { id: true, title: true, startTime: true, endTime: true },
        },
      },
    });

    // Rank position on global leaderboard
    const higherRatedCount = await prisma.user.count({
      where: { rating: { gt: user.rating } },
    });
    const globalRank = higherRatedCount + 1;

    // Rating history is static for now (returns current rating as single data point)
    const ratingHistory = [
      {
        date: user.createdAt,
        rating: 1500,
        event: 'Account Created',
      },
    ];

    // Append contest rating changes
    for (const entry of contestEntries.reverse()) {
      if (entry.ratingChange !== null) {
        ratingHistory.push({
          date: entry.contest.endTime,
          rating: ratingHistory[ratingHistory.length - 1].rating + (entry.ratingChange || 0),
          event: entry.contest.title,
          contestId: entry.contest.id,
          ratingChange: entry.ratingChange,
        });
      }
    }

    return res.status(200).json({
      user: {
        ...user,
        globalRank,
        acceptedCount,
        uniqueProblemsSolved: uniqueSolved.length,
      },
      recentSubmissions,
      contestHistory: contestEntries.reverse(),
      ratingHistory,
    });
  } catch (err) {
    console.error('[Leaderboard] GET /user/:username error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
