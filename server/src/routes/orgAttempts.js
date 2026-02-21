const express = require('express');
const TestAttempt = require('../models/TestAttempt');
const Test = require('../models/Test');
const Position = require('../models/Position');
const { requireOrgStaff } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/organizations/me/attempts
 * List test attempts for the org. Query: ?positionId=... optional.
 */
router.get('/', requireOrgStaff, async (req, res) => {
  const { positionId } = req.query;
  const positionIds = await Position.find({ organizationId: req.organizationId }).select('_id').lean();
  const ids = positionIds.map((p) => p._id);
  const query = { positionId: { $in: ids } };
  if (positionId) query.positionId = positionId;
  const attempts = await TestAttempt.find(query)
    .populate('applicantId', 'name email')
    .populate('positionId', 'title')
    .populate('testId', 'title durationMinutes')
    .sort({ submittedAt: -1, createdAt: -1 })
    .lean();
  res.json({ attempts });
});

/**
 * PATCH /api/organizations/me/attempts/:attemptId
 * Staff: submit manual scores for descriptive questions. Body: { manualScores: [{ questionId, score, feedback? }] }
 */
router.patch('/:attemptId', requireOrgStaff, async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    const position = await Position.findOne({ _id: attempt.positionId, organizationId: req.organizationId });
    if (!position) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.status !== 'submitted') return res.status(400).json({ error: 'Attempt must be submitted to evaluate' });
    const { manualScores } = req.body;
    if (!Array.isArray(manualScores)) return res.status(400).json({ error: 'manualScores array is required' });
    const test = await Test.findById(attempt.testId).populate('questions.questionId');
    if (!test) return res.status(400).json({ error: 'Test not found' });
    const descriptiveIds = test.questions
      .filter((q) => q.questionId?.type === 'descriptive')
      .map((q) => q.questionId._id.toString());
    const newManual = manualScores
      .filter((m) => descriptiveIds.includes(m.questionId?.toString?.() || m.questionId))
      .map((m) => ({
        questionId: m.questionId,
        score: Number(m.score),
        feedback: m.feedback != null ? String(m.feedback) : '',
        evaluatedBy: req.user._id,
        evaluatedAt: new Date(),
      }));
    attempt.manualScores = newManual;
    const manualTotal = newManual.reduce((s, m) => s + m.score, 0);
    attempt.totalScore = (attempt.autoScore != null ? attempt.autoScore : 0) + manualTotal;
    attempt.status = 'evaluated';
    attempt.evaluatedAt = new Date();
    await attempt.save();
    const populated = await TestAttempt.findById(attempt._id)
      .populate('applicantId', 'name email')
      .populate('positionId', 'title')
      .lean();
    res.json({ attempt: populated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
