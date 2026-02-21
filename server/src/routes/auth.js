const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { ROLES, isOrgRole } = require('../constants/roles');
const { signToken, authenticate, requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Body: { type: 'org' | 'applicant', email, password, name [, orgName ] }
 * - type 'org': creates Organization + first Admin. Requires orgName.
 * - type 'applicant': creates Applicant (no org).
 */
router.post('/register', async (req, res, next) => {
  try {
    const { type, email, password, name, orgName } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    if (type === 'org') {
      if (!orgName || !orgName.trim()) {
        return res.status(400).json({ error: 'Organization name is required for org registration' });
      }
      const slug = orgName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      if (!slug) {
        return res.status(400).json({ error: 'Invalid organization name' });
      }
      const existingOrg = await Organization.findOne({ slug });
      if (existingOrg) {
        return res.status(409).json({ error: 'Organization slug already taken' });
      }

      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const [org] = await Organization.create([{ name: orgName.trim(), slug }], { session });
        const passwordHash = await User.hashPassword(password);
        const [user] = await User.create(
          [
            {
              email: email.toLowerCase(),
              passwordHash,
              name: name.trim(),
              role: ROLES.ADMIN,
              organizationId: org._id,
            },
          ],
          { session }
        );
        await session.commitTransaction();
        const token = signToken({ userId: user._id.toString() });
        const userObj = user.toObject();
        delete userObj.passwordHash;
        userObj.organizationId = org;
        res.status(201).json({
          user: userObj,
          token,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        });
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
      return;
    }

    if (type === 'applicant' || !type) {
      const passwordHash = await User.hashPassword(password);
      const user = await User.create({
        email: email.toLowerCase(),
        passwordHash,
        name: name.trim(),
        role: ROLES.APPLICANT,
      });
      const token = signToken({ userId: user._id.toString() });
      const userObj = user.toObject();
      delete userObj.passwordHash;
      res.status(201).json({
        user: userObj,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });
      return;
    }

    return res.status(400).json({ error: 'Invalid registration type. Use "org" or "applicant"' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message, details: err.errors });
    }
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+passwordHash')
    .populate('organizationId', 'name slug');
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.isActive === false) {
    return res.status(403).json({ error: 'Account is deactivated' });
  }

  const token = signToken({ userId: user._id.toString() });
  const userObj = user.toObject();
  delete userObj.passwordHash;
  res.json({
    user: userObj,
    token,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
});

/**
 * GET /api/auth/me
 * Returns current user (requires auth).
 */
router.get('/me', authenticate, requireAuth, async (req, res) => {
  const user = req.user.toObject();
  delete user.passwordHash;
  res.json({ user });
});

module.exports = router;
