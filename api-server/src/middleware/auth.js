/**
 * Authentication Middleware
 * Provides JWT verification for protected routes.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_jwt_secret';

/**
 * Determines the rank label based on rating.
 * @param {number} rating
 * @returns {string}
 */
function getRank(rating) {
  if (rating < 1200) return 'Newbie';
  if (rating < 1400) return 'Pupil';
  if (rating < 1600) return 'Specialist';
  if (rating < 1900) return 'Expert';
  if (rating < 2100) return 'Candidate Master';
  if (rating < 2300) return 'Master';
  return 'Grandmaster';
}

/**
 * verifyToken - Strict middleware. Rejects requests without a valid Bearer token.
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user payload to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      rating: decoded.rating,
      rank: getRank(decoded.rating),
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired' });
    }
    return res.status(401).json({ error: 'Invalid access token' });
  }
};

/**
 * optionalAuth - Lenient middleware. Attaches user if token present, otherwise continues.
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      rating: decoded.rating,
      rank: getRank(decoded.rating),
    };
  } catch {
    // Token is invalid or expired — treat as unauthenticated
    req.user = null;
  }

  next();
};

module.exports = { verifyToken, optionalAuth, getRank };
