const express = require('express');
const User = require('../models/User');
const ManagerInvite = require('../models/ManagerInvite');
const { ROLES } = require('../constants/roles');
const { signToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/invites/accept
 * Body: { token [, name, password ] } — name/password required if no existing user with invite email.
 * If authenticated and same email as invite, links account. Otherwise creates new Manager (pending approval).
 */
router.post('/accept', async (req, res, next) => {
  try {
    const { token, name, password } = req.body;
    if (!token || !token.trim()) {
      return res.status(400).json({ error: 'Invite token is required' });
    }

    const invite = await ManagerInvite.findOne({ token: token.trim(), status: 'pending' })
      .populate('organizationId')
      .populate('invitedBy', 'name');
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found or already used' });
    }
    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ error: 'Invite has expired' });
    }

    const inviteEmail = invite.email.toLowerCase();
    let user = req.user && req.user.email.toLowerCase() === inviteEmail
      ? req.user
      : await User.findOne({ email: inviteEmail });

    if (user) {
      if (user.organizationId && user.organizationId.toString() === invite.organizationId._id.toString()) {
        return res.status(400).json({ error: 'You are already a member of this organization' });
      }
      if (user.role === ROLES.ADMIN) {
        return res.status(400).json({ error: 'Admins cannot accept manager invites' });
      }
      user.role = ROLES.MANAGER;
      user.organizationId = invite.organizationId._id;
      user.pendingApproval = true;
      user.canPostJobs = false;
      user.isActive = true;
      await user.save();
    } else {
      if (!name || !password) {
        return res.status(400).json({ error: 'Name and password are required to create an account' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      const passwordHash = await User.hashPassword(password);
      user = await User.create({
        email: invite.email,
        passwordHash,
        name: name.trim(),
        role: ROLES.MANAGER,
        organizationId: invite.organizationId._id,
        pendingApproval: true,
        canPostJobs: false,
      });
    }

    invite.status = 'accepted';
    await invite.save();

    const jwtToken = signToken({ userId: user._id.toString() });
    const userObj = (await User.findById(user._id).select('-passwordHash').populate('organizationId', 'name slug')).toObject();
    res.json({
      user: userObj,
      token: jwtToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
