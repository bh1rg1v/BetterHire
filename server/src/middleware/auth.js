const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isOrgStaff } = require('../constants/roles');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Attach req.user if valid JWT in Authorization: Bearer <token> or cookie.
 * Does not reject unauthenticated requests.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token =
    (authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7)) || null;

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId)
      .select('+passwordHash')
      .populate('organizationId', 'name slug');
    if (!user || user.isActive === false) {
      return next();
    }
    req.user = user;
    req.token = token;
  } catch {
    // Invalid or expired token — continue without user
  }
  next();
}

/**
 * Require authenticated user. Responds 401 if not logged in.
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Require one of the given roles. Use after requireAuth.
 * Example: requireRole([ROLES.ADMIN, ROLES.MANAGER])
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Require user to be org staff (Admin or Manager) with matching organizationId.
 * Use for routes that are scoped to the current user's organization.
 */
function requireOrgStaff(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!isOrgStaff(req.user.role)) {
    return res.status(403).json({ error: 'Organization access required' });
  }
  if (!req.user.organizationId) {
    return res.status(403).json({ error: 'No organization assigned' });
  }
  req.organizationId = req.user.organizationId._id || req.user.organizationId;
  next();
}

/** Require Org Admin (Admin role). Use for manager invites, approve, deactivate, canPostJobs. */
function requireOrgAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (!req.user.organizationId) {
    return res.status(403).json({ error: 'No organization assigned' });
  }
  req.organizationId = req.user.organizationId._id || req.user.organizationId;
  next();
}

/** Require org staff with permission to post jobs (Admin or Manager with canPostJobs). */
function requireCanPostJobs(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
    return res.status(403).json({ error: 'Organization access required' });
  }
  if (!req.user.organizationId) {
    return res.status(403).json({ error: 'No organization assigned' });
  }
  if (req.user.role === 'Manager' && !req.user.canPostJobs) {
    return res.status(403).json({ error: 'You do not have permission to manage job positions' });
  }
  req.organizationId = req.user.organizationId._id || req.user.organizationId;
  next();
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  signToken,
  verifyToken,
  authenticate,
  requireAuth,
  requireRole,
  requireOrgStaff,
  requireOrgAdmin,
  requireCanPostJobs,
};
