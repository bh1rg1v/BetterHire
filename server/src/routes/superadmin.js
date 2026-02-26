const express = require('express');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { ROLES } = require('../constants/roles');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

router.get('/users', requireAuth, requireSuperAdmin, async (req, res) => {
  const users = await User.find().populate('organizationId', 'name slug').sort({ createdAt: -1 }).lean();
  res.json({ users });
});

router.get('/organizations', requireAuth, requireSuperAdmin, async (req, res) => {
  const organizations = await Organization.find().sort({ createdAt: -1 }).lean();
  res.json({ organizations });
});

module.exports = router;
