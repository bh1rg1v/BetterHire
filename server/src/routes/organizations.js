const express = require('express');
const crypto = require('crypto');
const Organization = require('../models/Organization');
const User = require('../models/User');
const ManagerInvite = require('../models/ManagerInvite');
const { ROLES } = require('../constants/roles');
const { requireOrgStaff, requireOrgAdmin } = require('../middleware/auth');

const router = express.Router();

/** Normalize slug for validation (lowercase, hyphens, alphanumeric). */
function toSlug(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * GET /api/organizations/check-slug?slug=acme
 * Public. Returns { available: true|false }. Slug must be 2+ chars, alphanumeric + hyphens.
 */
router.get('/check-slug', async (req, res) => {
  const raw = (req.query.slug || '').trim().toLowerCase();
  const slug = toSlug(raw);
  if (!slug || slug.length < 2) {
    return res.status(400).json({ error: 'Slug must be at least 2 characters' });
  }
  const exists = await Organization.exists({ slug });
  res.json({ available: !exists, slug });
});

/**
 * GET /api/organizations/me
 * Current user's organization (Admin/Manager only).
 */
router.get('/me', requireOrgStaff, async (req, res) => {
  const org = await Organization.findById(req.organizationId).lean();
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  res.json({ organization: org });
});

// ---------- Admin-only: invites and managers ----------

/**
 * POST /api/organizations/me/invites
 * Body: { email [, name ] }. Admin only. Creates pending invite.
 */
router.post('/me/invites', requireOrgAdmin, async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const orgId = req.organizationId;

    const existing = await ManagerInvite.findOne({
      organizationId: orgId,
      email: normalizedEmail,
      status: 'pending',
    });
    if (existing) {
      return res.status(409).json({ error: 'An invite is already pending for this email' });
    }

    const existingManager = await User.findOne({
      organizationId: orgId,
      role: ROLES.MANAGER,
      email: normalizedEmail,
    });
    if (existingManager) {
      return res.status(409).json({ error: 'This user is already a manager in your organization' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invite = await ManagerInvite.create({
      organizationId: orgId,
      email: normalizedEmail,
      invitedBy: req.user._id,
      token,
      expiresAt,
      status: 'pending',
    });
    const inviteObj = await invite.populate('invitedBy', 'name');
    res.status(201).json({
      invite: {
        id: inviteObj._id,
        email: inviteObj.email,
        token: inviteObj.token,
        expiresAt: inviteObj.expiresAt,
        status: inviteObj.status,
        invitedBy: inviteObj.invitedBy,
        createdAt: inviteObj.createdAt,
      },
      inviteLink: `${process.env.APP_URL || 'http://localhost:3000'}/invite/accept?token=${inviteObj.token}`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/organizations/me/invites
 * Admin only. List pending (and optionally all) invites.
 */
router.get('/me/invites', requireOrgAdmin, async (req, res) => {
  const status = req.query.status || 'pending'; // pending | all
  const query = { organizationId: req.organizationId };
  if (status !== 'all') query.status = status;
  const invites = await ManagerInvite.find(query)
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ invites });
});

/**
 * GET /api/organizations/me/managers
 * Org staff (Admin or Manager). List managers for the org (e.g. for assigning to positions).
 */
router.get('/me/managers', requireOrgStaff, async (req, res) => {
  const managers = await User.find({
    organizationId: req.organizationId,
    role: ROLES.MANAGER,
  })
    .select('-passwordHash')
    .sort({ createdAt: 1 })
    .lean();
  res.json({ managers });
});

/**
 * PATCH /api/organizations/me/managers/:userId
 * Admin only. Body: { approved?, isActive?, canPostJobs? }
 * - approved: true → set pendingApproval = false
 * - isActive: false → deactivate manager (cannot log in)
 * - canPostJobs: true|false → only Admin can grant
 */
router.patch('/me/managers/:userId', requireOrgAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { approved, isActive, canPostJobs } = req.body;

    const manager = await User.findOne({
      _id: userId,
      organizationId: req.organizationId,
      role: ROLES.MANAGER,
    });
    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    const updates = {};
    if (typeof approved === 'boolean') updates.pendingApproval = !approved;
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (typeof canPostJobs === 'boolean') updates.canPostJobs = canPostJobs;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    Object.assign(manager, updates);
    await manager.save();

    const updated = await User.findById(manager._id).select('-passwordHash').lean();
    res.json({ manager: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
