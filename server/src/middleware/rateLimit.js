/**
 * Phase 9 — Rate limiting. In-memory store; use Redis in production for multi-instance.
 * Optional: npm install express-rate-limit
 */
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (_) {
  rateLimit = null;
}

const noop = (req, res, next) => next();

const apiLimiter = rateLimit
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: process.env.RATE_LIMIT_MAX || 200,
      message: { error: 'Too many requests' },
      standardHeaders: true,
      legacyHeaders: false,
    })
  : noop;

const authLimiter = rateLimit
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: process.env.RATE_LIMIT_AUTH_MAX || 20,
      message: { error: 'Too many attempts' },
      standardHeaders: true,
    })
  : noop;

module.exports = { apiLimiter, authLimiter };
