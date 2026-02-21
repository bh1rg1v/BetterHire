const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { ROLES, isOrgRole } = require('../constants/roles');
const { signToken, authenticate, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { type, email, password, name, orgName, username } = req.body;

    if (!email || !password || !name || !username) {
      return res.status(400).json({ error: 'Email, password, name, and username are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (normalizedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: normalizedUsername }] 
    });
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      return res.status(409).json({ error: 'Username already taken' });
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
      if (!slug || slug.length < 2) {
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
              username: normalizedUsername,
              email: email.toLowerCase(),
              passwordHash,
              name: name.trim(),
              role: ROLES.ADMIN,
              organizationId: org._id,
              canPostJobs: true,
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
        username: normalizedUsername,
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

    if (type === 'manager') {
      const passwordHash = await User.hashPassword(password);
      const user = await User.create({
        username: normalizedUsername,
        email: email.toLowerCase(),
        passwordHash,
        name: name.trim(),
        role: ROLES.MANAGER,
        isActive: true,
        pendingApproval: false,
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

    return res.status(400).json({ error: 'Invalid registration type. Use "org", "manager", or "applicant"' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message, details: err.errors });
    }
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    next(err);
  }
});

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

router.get('/me', authenticate, requireAuth, async (req, res) => {
  const user = req.user.toObject();
  delete user.passwordHash;
  res.json({ user });
});

router.get('/check-username', async (req, res) => {
  const username = (req.query.username || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  const exists = await User.exists({ username });
  res.json({ available: !exists, username });
});

module.exports = router;
