const express = require('express');
const Test = require('../models/Test');
const Question = require('../models/Question');
const { requireOrgStaff, requireCanPostJobs } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/organizations/me/tests
 * List tests. Staff only.
 */
router.get('/', requireOrgStaff, async (req, res) => {
  const tests = await Test.find({ organizationId: req.organizationId })
    .populate('createdBy', 'name email')
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ tests });
});

/**
 * POST /api/organizations/me/tests
 * Create test. canPostJobs required. Body: title, description?, durationMinutes?, questions: [{ questionId, order?, points? }]
 */
router.post('/', requireCanPostJobs, async (req, res, next) => {
  try {
    const { title, description, durationMinutes, questions } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
    const questionRefs = [];
    if (Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const question = await Question.findOne({ _id: q.questionId, organizationId: req.organizationId });
        if (!question) return res.status(400).json({ error: `Question ${q.questionId} not found` });
        questionRefs.push({
          questionId: question._id,
          order: typeof q.order === 'number' ? q.order : i,
          points: typeof q.points === 'number' ? q.points : question.maxScore || 1,
        });
      }
    }
    const test = await Test.create({
      organizationId: req.organizationId,
      title: title.trim(),
      description: String(description || '').trim(),
      durationMinutes: typeof durationMinutes === 'number' && durationMinutes >= 0 ? durationMinutes : 0,
      questions: questionRefs,
      createdBy: req.user._id,
    });
    const populated = await Test.findById(test._id)
      .populate('createdBy', 'name email')
      .populate('questions.questionId')
      .lean();
    res.status(201).json({ test: populated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/organizations/me/tests/:id
 * Single test with questions (without correct answers for security - staff only so we can send full details).
 */
router.get('/:id', requireOrgStaff, async (req, res) => {
  const test = await Test.findOne({
    _id: req.params.id,
    organizationId: req.organizationId,
  })
    .populate('createdBy', 'name email')
    .populate('questions.questionId')
    .lean();
  if (!test) return res.status(404).json({ error: 'Test not found' });
  res.json({ test });
});

/**
 * PATCH /api/organizations/me/tests/:id
 */
router.patch('/:id', requireCanPostJobs, async (req, res, next) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    const { title, description, durationMinutes, questions } = req.body;
    if (title !== undefined) test.title = String(title).trim();
    if (description !== undefined) test.description = String(description).trim();
    if (typeof durationMinutes === 'number' && durationMinutes >= 0) test.durationMinutes = durationMinutes;
    if (Array.isArray(questions)) {
      const questionRefs = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const question = await Question.findOne({ _id: q.questionId, organizationId: req.organizationId });
        if (!question) return res.status(400).json({ error: `Question ${q.questionId} not found` });
        questionRefs.push({
          questionId: question._id,
          order: typeof q.order === 'number' ? q.order : i,
          points: typeof q.points === 'number' ? q.points : question.maxScore || 1,
        });
      }
      test.questions = questionRefs;
    }
    await test.save();
    const populated = await Test.findById(test._id)
      .populate('createdBy', 'name email')
      .populate('questions.questionId')
      .lean();
    res.json({ test: populated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/organizations/me/tests/:id
 */
router.delete('/:id', requireCanPostJobs, async (req, res, next) => {
  try {
    const test = await Test.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    await Test.deleteOne({ _id: test._id });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
