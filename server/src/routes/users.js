const express = require('express');
const User = require('../models/User');
const { ROLES } = require('../constants/roles');
const { authenticate, requireAuth, requireRole, requireOrgStaff } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/users/me
 * Current user's full profile (authenticated).
 */
router.get('/me', authenticate, requireAuth, async (req, res) => {
  const user = req.user.toObject();
  delete user.passwordHash;
  res.json({ user });
});

/**
 * PATCH /api/users/me
 * Update current user's profile (name, profile fields). Applicant can set profile.visibility.
 */
router.patch('/me', authenticate, requireAuth, async (req, res) => {
  const allowed = ['name', 'profile'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No allowed fields to update' });
  }
  if (updates.profile && typeof updates.profile === 'object') {
    const profileAllowed = ['headline', 'bio', 'phone', 'resumeUrl', 'visibility'];
    const profile = {};
    for (const k of profileAllowed) {
      if (updates.profile[k] !== undefined) profile[k] = updates.profile[k];
    }
    updates.profile = { ...req.user.profile?.toObject?.() || req.user.profile, ...profile };
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .select('-passwordHash')
    .populate('organizationId', 'name slug');
  res.json({ user });
});

/**
 * GET /api/users/:id/public
 * Public profile for an applicant. Only returns fields when profile.visibility === 'public'.
 */
router.get('/:id/public', authenticate, async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('name profile role')
    .lean();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (user.role !== ROLES.APPLICANT) {
    return res.status(404).json({ error: 'User not found' });
  }
  if ((user.profile?.visibility || 'private') !== 'public') {
    return res.status(404).json({ error: 'Profile is not public' });
  }
  const publicProfile = {
    id: user._id,
    name: user.name,
    headline: user.profile?.headline || '',
    bio: user.profile?.bio || '',
    resumeUrl: user.profile?.resumeUrl || '',
  };
  res.json({ profile: publicProfile });
});

module.exports = router;
