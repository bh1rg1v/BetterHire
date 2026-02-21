const express = require('express');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const Question = require('../models/Question');
const Position = require('../models/Position');
const { ROLES } = require('../constants/roles');
const { requireAuth, requireRole, requireOrgStaff } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/attempts/start
 * Applicant starts a test for a position. Body: { positionId }
 */
router.post('/start', requireAuth, requireRole([ROLES.APPLICANT]), async (req, res, next) => {
  try {
    const { positionId } = req.body;
    if (!positionId) return res.status(400).json({ error: 'positionId is required' });
    const position = await Position.findById(positionId).populate('testId');
    if (!position) return res.status(404).json({ error: 'Position not found' });
    if (position.status !== 'published') return res.status(400).json({ error: 'Position is not open' });
    if (!position.testId) return res.status(400).json({ error: 'No test assigned to this position' });
    const test = await Test.findById(position.testId._id || position.testId).populate('questions.questionId');
    if (!test) return res.status(400).json({ error: 'Test not found' });
    const existing = await TestAttempt.findOne({
      testId: test._id,
      positionId: position._id,
      applicantId: req.user._id,
      status: { $in: ['in_progress', 'submitted', 'evaluated'] },
    });
    if (existing) return res.status(409).json({ error: 'You have already started or submitted this test', attempt: existing._id });
    const attempt = await TestAttempt.create({
      testId: test._id,
      positionId: position._id,
      applicantId: req.user._id,
      status: 'in_progress',
    });
    const testForClient = await getTestForApplicant(test);
    res.status(201).json({
      attempt: {
        _id: attempt._id,
        startedAt: attempt.startedAt,
        durationMinutes: test.durationMinutes,
        status: attempt.status,
      },
      test: testForClient,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/attempts/me?positionId=...
 * Get my attempt for a position (in_progress or submitted/evaluated).
 */
router.get('/me', requireAuth, requireRole([ROLES.APPLICANT]), async (req, res) => {
  const { positionId } = req.query;
  if (!positionId) return res.status(400).json({ error: 'positionId is required' });
  const attempt = await TestAttempt.findOne({
    positionId,
    applicantId: req.user._id,
  })
    .populate('testId')
    .sort({ createdAt: -1 })
    .lean();
  if (!attempt) return res.status(404).json({ error: 'No attempt found' });
  const test = await Test.findById(attempt.testId._id).populate('questions.questionId').lean();
  const testForClient = test ? getTestForApplicant(test) : null;
  res.json({
    attempt: {
      ...attempt,
      testId: attempt.testId?._id,
    },
    test: testForClient,
  });
});

/**
 * GET /api/attempts/:id
 * Get single attempt (applicant: own only).
 */
router.get('/:id', requireAuth, async (req, res) => {
  const attempt = await TestAttempt.findById(req.params.id)
    .populate('testId')
    .populate('positionId', 'title')
    .lean();
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
  const isApplicant = req.user._id.toString() === attempt.applicantId.toString();
  const isStaff = [ROLES.ADMIN, ROLES.MANAGER].includes(req.user.role);
  if (!isApplicant && !isStaff) return res.status(403).json({ error: 'Forbidden' });
  const test = await Test.findById(attempt.testId._id).populate('questions.questionId').lean();
  const testForClient = test ? (isApplicant ? getTestForApplicant(test) : test) : null;
  res.json({ attempt, test: testForClient });
});

/**
 * POST /api/attempts/:id/submit
 * Applicant submits attempt. Body: { answers: [{ questionId, value }] }
 */
router.post('/:id/submit', requireAuth, requireRole([ROLES.APPLICANT]), async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findById(req.params.id);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.applicantId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });
    if (attempt.status !== 'in_progress') return res.status(400).json({ error: 'Attempt already submitted' });
    const { answers } = req.body;
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers array is required' });
    const test = await Test.findById(attempt.testId).populate('questions.questionId');
    if (!test) return res.status(400).json({ error: 'Test not found' });
    const questionIds = test.questions.map((q) => q.questionId._id.toString());
    const answerMap = {};
    for (const a of answers) {
      if (questionIds.includes(a.questionId?.toString?.() || a.questionId)) {
        answerMap[a.questionId?.toString?.() || a.questionId] = a.value;
      }
    }
    attempt.answers = Object.entries(answerMap).map(([questionId, value]) => ({ questionId, value }));
    attempt.submittedAt = new Date();
    attempt.status = 'submitted';
    const { autoScore, manualRequired } = computeScores(attempt, test);
    attempt.autoScore = autoScore;
    if (!manualRequired) {
      attempt.totalScore = autoScore;
      attempt.status = 'evaluated';
      attempt.evaluatedAt = new Date();
    }
    await attempt.save();
    const populated = await TestAttempt.findById(attempt._id)
      .populate('positionId', 'title')
      .lean();
    res.json({
      attempt: populated,
      totalScore: attempt.totalScore,
      autoScore: attempt.autoScore,
      status: attempt.status,
    });
  } catch (err) {
    next(err);
  }
});

/** Compute auto score and whether manual eval needed. Used in submit. */

function getTestForApplicant(test) {
  const t = test.toObject ? test.toObject() : { ...test };
  if (t.questions) {
    t.questions = t.questions.map((q) => {
      const qn = q.questionId && (q.questionId.toObject ? q.questionId.toObject() : q.questionId);
      if (!qn) return q;
      const safe = { _id: qn._id, type: qn.type, questionText: qn.questionText, order: q.order, points: q.points };
      if (qn.type === 'mcq') safe.options = qn.options?.map((o) => ({ text: o.text })) || [];
      return { ...q, questionId: safe };
    });
  }
  return { _id: t._id, title: t.title, description: t.description, durationMinutes: t.durationMinutes, questions: t.questions };
}

function computeScores(attempt, test) {
  let autoScore = 0;
  let manualRequired = false;
  const answerByQ = {};
  attempt.answers.forEach((a) => {
    answerByQ[a.questionId?.toString?.() || a.questionId] = a.value;
  });
  for (const q of test.questions) {
    const qid = q.questionId._id.toString();
    const question = q.questionId;
    const points = q.points != null ? q.points : question.maxScore || 1;
    if (question.type === 'mcq') {
      const correctIndex = question.options?.findIndex((o) => o.isCorrect);
      const userVal = answerByQ[qid];
      const userIndex = typeof userVal === 'number' ? userVal : parseInt(userVal, 10);
      if (correctIndex >= 0 && userIndex === correctIndex) autoScore += points;
    } else {
      manualRequired = true;
    }
  }
  return { autoScore, manualRequired };
}

module.exports = router;
module.exports.getTestForApplicant = getTestForApplicant;
module.exports.computeScores = computeScores;
