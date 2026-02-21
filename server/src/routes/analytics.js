/**
 * Phase 8 — Analytics & Reporting
 */
const express = require('express');
const FormSubmission = require('../models/FormSubmission');
const TestAttempt = require('../models/TestAttempt');
const Position = require('../models/Position');
const AuditLog = require('../models/AuditLog');
const { requireOrgStaff } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/organizations/me/analytics/funnel?positionId=...
 * Hiring funnel: counts by application status. Optional positionId.
 */
router.get('/funnel', requireOrgStaff, async (req, res) => {
  const { positionId } = req.query;
  const positionIds = await Position.find({ organizationId: req.organizationId })
    .select('_id')
    .lean();
  const ids = positionIds.map((p) => p._id);
  const match = { positionId: { $in: ids } };
  if (positionId) match.positionId = positionId;
  const funnel = await FormSubmission.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const byStatus = {};
  funnel.forEach((f) => { byStatus[f._id] = f.count; });
  res.json({ funnel: byStatus });
});

/**
 * GET /api/organizations/me/analytics/test-metrics?positionId=...&testId=...
 * Test performance: avg score, pass rate (e.g. >= 60%), count evaluated.
 */
router.get('/test-metrics', requireOrgStaff, async (req, res) => {
  const { positionId, testId } = req.query;
  const positionIds = await Position.find({ organizationId: req.organizationId }).select('_id').lean();
  const ids = positionIds.map((p) => p._id);
  const match = { positionId: { $in: ids }, status: 'evaluated' };
  if (positionId) match.positionId = positionId;
  if (testId) match.testId = testId;
  const attempts = await TestAttempt.find(match).select('totalScore').lean();
  const total = attempts.length;
  const sum = attempts.reduce((s, a) => s + (a.totalScore != null ? a.totalScore : 0), 0);
  const avg = total ? sum / total : 0;
  const passThreshold = 60;
  const passed = attempts.filter((a) => a.totalScore != null && a.totalScore >= passThreshold).length;
  res.json({
    totalAttempts: total,
    averageScore: Math.round(avg * 100) / 100,
    passRate: total ? Math.round((passed / total) * 100) : 0,
    passThreshold,
  });
});

/**
 * GET /api/organizations/me/analytics/activity
 * Manager activity logs (from AuditLog). Query: limit, skip.
 */
router.get('/activity', requireOrgStaff, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const skip = parseInt(req.query.skip, 10) || 0;
  const logs = await AuditLog.find({ organizationId: req.organizationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email')
    .lean();
  res.json({ logs });
});

/**
 * GET /api/organizations/me/analytics/export/applications
 * Export applications as CSV. Query: positionId (optional).
 */
router.get('/export/applications', requireOrgStaff, async (req, res) => {
  const { positionId } = req.query;
  const position = await Position.findOne({ organizationId: req.organizationId, ...(positionId && { _id: positionId }) });
  const positions = position ? [position] : await Position.find({ organizationId: req.organizationId }).lean();
  const ids = positions.map((p) => p._id);
  const submissions = await FormSubmission.find({ positionId: { $in: ids } })
    .populate('applicantId', 'name email')
    .populate('positionId', 'title')
    .sort({ createdAt: -1 })
    .lean();
  const header = ['Application ID', 'Position', 'Applicant', 'Email', 'Status', 'Created'];
  const rows = submissions.map((s) => [
    s._id,
    s.positionId?.title || '',
    s.applicantId?.name || '',
    s.applicantId?.email || '',
    s.status || 'submitted',
    s.createdAt ? new Date(s.createdAt).toISOString() : '',
  ]);
  const csv = [header.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
  res.send(csv);
});

module.exports = router;
