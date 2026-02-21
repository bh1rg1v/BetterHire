const express = require('express');
const Question = require('../models/Question');
const { requireOrgStaff, requireCanPostJobs } = require('../middleware/auth');
const { QUESTION_TYPES } = require('../models/Question');

const router = express.Router();

/**
 * GET /api/organizations/me/questions
 * List questions for the org. Staff only.
 */
router.get('/', requireOrgStaff, async (req, res) => {
  const { type } = req.query;
  const query = { organizationId: req.organizationId };
  if (type && QUESTION_TYPES.includes(type)) query.type = type;
  const questions = await Question.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ questions });
});

/**
 * POST /api/organizations/me/questions
 * Create question. canPostJobs required.
 */
router.post('/', requireCanPostJobs, async (req, res, next) => {
  try {
    const { type, questionText, options, maxScore } = req.body;
    if (!QUESTION_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid type. Use mcq or descriptive' });
    if (!questionText || !String(questionText).trim()) return res.status(400).json({ error: 'questionText is required' });
    let question;
    if (type === 'mcq') {
      if (!Array.isArray(options) || options.length < 2) return res.status(400).json({ error: 'MCQ must have at least 2 options' });
      const opts = options.map((o) => ({ text: String(o.text || ''), isCorrect: !!o.isCorrect }));
      const correctCount = opts.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) return res.status(400).json({ error: 'Exactly one option must be marked correct' });
      question = await Question.create({
        organizationId: req.organizationId,
        type: 'mcq',
        questionText: questionText.trim(),
        options: opts,
        maxScore: typeof maxScore === 'number' ? maxScore : 1,
        createdBy: req.user._id,
      });
    } else {
      question = await Question.create({
        organizationId: req.organizationId,
        type: 'descriptive',
        questionText: questionText.trim(),
        maxScore: typeof maxScore === 'number' ? maxScore : 1,
        createdBy: req.user._id,
      });
    }
    const populated = await Question.findById(question._id).populate('createdBy', 'name email').lean();
    res.status(201).json({ question: populated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/organizations/me/questions/:id
 */
router.get('/:id', requireOrgStaff, async (req, res) => {
  const question = await Question.findOne({
    _id: req.params.id,
    organizationId: req.organizationId,
  })
    .populate('createdBy', 'name email')
    .lean();
  if (!question) return res.status(404).json({ error: 'Question not found' });
  res.json({ question });
});

/**
 * PATCH /api/organizations/me/questions/:id
 */
router.patch('/:id', requireCanPostJobs, async (req, res, next) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!question) return res.status(404).json({ error: 'Question not found' });
    const { questionText, options, maxScore } = req.body;
    if (questionText !== undefined) question.questionText = String(questionText).trim();
    if (maxScore !== undefined) question.maxScore = Number(maxScore);
    if (question.type === 'mcq' && Array.isArray(options)) {
      const opts = options.map((o) => ({ text: String(o.text || ''), isCorrect: !!o.isCorrect }));
      if (opts.length >= 2 && opts.filter((o) => o.isCorrect).length === 1) question.options = opts;
    }
    await question.save();
    const populated = await Question.findById(question._id).populate('createdBy', 'name email').lean();
    res.json({ question: populated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/organizations/me/questions/:id
 */
router.delete('/:id', requireCanPostJobs, async (req, res, next) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!question) return res.status(404).json({ error: 'Question not found' });
    await Question.deleteOne({ _id: question._id });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
