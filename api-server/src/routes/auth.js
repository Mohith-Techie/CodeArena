/**
 * Auth Routes
 * Handles user registration, login, token refresh, logout, and profile fetch.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const { verifyToken, getRank } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_jwt_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'changeme_refresh_secret';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 7;

// ─── Validation Schemas ──────────────────────────────────────────────────────

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generates a short-lived access token (15m).
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      rating: user.rating,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

/**
 * Generates a long-lived refresh token (7d) and persists it to DB.
 */
async function generateAndStoreRefreshToken(userId) {
  const token = uuidv4(); // Opaque random token
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

/**
 * Sanitizes user object for API responses (removes passwordHash).
 */
function sanitizeUser(user) {
  const { passwordHash, refreshTokens, ...safe } = user;
  return safe;
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    // Validate input
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.errors.map((e) => ({ field: e.path[0], message: e.message })),
      });
    }

    const { username, email, password } = parsed.data;

    // Check for conflicts
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      if (existing.email === email) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const initialRating = 1500;

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        rating: initialRating,
        maxRating: initialRating,
        rank: getRank(initialRating),
      },
    });

    // Issue tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateAndStoreRefreshToken(user.id);

    return res.status(201).json({
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.errors.map((e) => ({ field: e.path[0], message: e.message })),
      });
    }

    const { email, password } = parsed.data;

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Generic message to avoid email enumeration
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Issue tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateAndStoreRefreshToken(user.id);

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/refresh ──────────────────────────────────────────────────

router.post('/refresh', async (req, res) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { refreshToken } = parsed.data;

    // Look up token in DB
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check expiry
    if (new Date() > stored.expiresAt) {
      // Clean up expired token
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    // Issue new access token (token rotation: delete old refresh, issue new one)
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const newAccessToken = generateAccessToken(stored.user);
    const newRefreshToken = await generateAndStoreRefreshToken(stored.userId);

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error('[Auth] Refresh error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────

router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Delete the token (ignore if not found — idempotent)
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('[Auth] Logout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
        createdAt: true,
        updatedAt: true,
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
    console.error('[Auth] /me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
