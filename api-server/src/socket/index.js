/**
 * Socket.IO Handler
 * Manages real-time connections and bridges Redis pub/sub to connected clients.
 * When a worker finishes judging, it publishes to 'submission-results' channel.
 * This module receives that message and emits it to the correct user's socket room.
 */

const { Server } = require('socket.io');
const { Redis } = require('ioredis');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_jwt_secret';

/** @type {Server} */
let io;

/**
 * Initializes Socket.IO on the given HTTP server.
 * Sets up authentication, room management, and Redis pub/sub subscriber.
 *
 * @param {import('http').Server} server - The Node.js HTTP server instance
 * @returns {Server} The initialized Socket.IO server
 */
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Ping every 25s, disconnect after 5s without pong
    pingInterval: 25000,
    pingTimeout: 5000,
  });

  // ─── JWT Auth Middleware for Socket.IO ─────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        // Allow unauthenticated connections (read-only / public events)
        socket.data.user = null;
        return next();
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.data.user = { id: decoded.id, username: decoded.username };
      next();
    } catch {
      // Don't block connection; treat as unauthenticated
      socket.data.user = null;
      next();
    }
  });

  // ─── Connection Handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const user = socket.data.user;

    if (user) {
      // Each authenticated user has their own private room
      const userRoom = `user:${user.id}`;
      socket.join(userRoom);
      console.log(`[Socket.IO] User ${user.username} (${user.id}) joined room ${userRoom}`);

      socket.on('disconnect', (reason) => {
        console.log(`[Socket.IO] User ${user.username} disconnected: ${reason}`);
      });
    } else {
      console.log(`[Socket.IO] Anonymous connection: ${socket.id}`);
    }

    // Allow client to manually join a submission room to track specific submissions
    socket.on('track:submission', (submissionId) => {
      if (submissionId && typeof submissionId === 'string') {
        socket.join(`submission:${submissionId}`);
      }
    });
  });

  // ─── Redis Subscriber for Submission Results ───────────────────────────────
  // Supports both REDIS_URL and individual REDIS_HOST/REDIS_PORT vars
  function createSubscriberRedis() {
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
  const subscriber = createSubscriberRedis();

  subscriber.on('error', (err) => {
    console.error('[Socket.IO Redis] Subscriber error:', err.message);
  });

  subscriber.on('connect', () => {
    console.log('[Socket.IO Redis] Subscriber connected');
  });

  /**
   * Subscribe to the channel that workers publish results to.
   * Expected message format (JSON string):
   * {
   *   submissionId: string,
   *   userId: string,
   *   result: {
   *     status: string,       // ACCEPTED | WRONG_ANSWER | TIME_LIMIT_EXCEEDED | ...
   *     runtimeMs: number,
   *     memoryKb: number,
   *     passedCases: number,
   *     totalCases: number,
   *     errorMessage?: string
   *   }
   * }
   */
  subscriber.subscribe('submission-results', (err, count) => {
    if (err) {
      console.error('[Socket.IO Redis] Failed to subscribe:', err.message);
      return;
    }
    console.log(`[Socket.IO Redis] Subscribed to ${count} channel(s)`);
  });

  subscriber.on('message', (channel, message) => {
    if (channel !== 'submission-results') return;

    try {
      const payload = JSON.parse(message);
      const { submissionId, userId, result } = payload;

      if (!submissionId || !result) {
        console.warn('[Socket.IO] Received malformed message:', message);
        return;
      }

      console.log(`[Socket.IO] Emitting result for submission ${submissionId} to user ${userId}`);

      // Emit to the user's personal room (if they are connected)
      if (userId) {
        io.to(`user:${userId}`).emit('submission-result', { submissionId, ...result });
      }

      // Also emit to any client explicitly tracking this submission
      io.to(`submission:${submissionId}`).emit('submission-result', { submissionId, ...result });
    } catch (parseErr) {
      console.error('[Socket.IO] Failed to parse message:', parseErr.message);
    }
  });

  return io;
}

/**
 * Returns the initialized Socket.IO instance.
 * Throws if called before initSocket().
 * @returns {Server}
 */
function getIO() {
  if (!io) throw new Error('Socket.IO not initialized. Call initSocket(server) first.');
  return io;
}

module.exports = { initSocket, getIO };
