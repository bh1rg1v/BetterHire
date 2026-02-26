const express = require('express');
const crypto = require('crypto');
const Test = require('../models/Test');
const Question = require('../models/Question');
const { requireOrgStaff, requireCanPostJobs, authenticate } = require('../middleware/auth');

const router = express.Router();

function generateTestUrl() {
  return crypto.randomBytes(8).toString('hex');
}

async function ensureUniqueTestUrl(testUrl) {
  if (!testUrl) return generateTestUrl();
  const normalized = testUrl.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const exists = await Test.exists({ testUrl: normalized });
  if (exists) throw new Error('Test URL already taken');
  return normalized;
}

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
    const { title, description, instructions, durationMinutes, questions, testUrl, maxAttempts } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
    const finalTestUrl = await ensureUniqueTestUrl(testUrl);
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
      instructions: String(instructions || '').trim(),
      testUrl: finalTestUrl,
      durationMinutes: typeof durationMinutes === 'number' && durationMinutes >= 0 ? durationMinutes : 0,
      maxAttempts: typeof maxAttempts === 'number' && maxAttempts >= 1 ? maxAttempts : 1,
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
 * GET /api/organizations/me/tests/:id/attempts
 * Get all attempts for a test. Staff only.
 */
router.get('/:id/attempts', requireOrgStaff, async (req, res) => {
  const TestAttempt = require('../models/TestAttempt');
  const test = await Test.findOne({
    _id: req.params.id,
    organizationId: req.organizationId,
  });
  if (!test) return res.status(404).json({ error: 'Test not found' });
  
  const attempts = await TestAttempt.find({ testId: test._id })
    .populate('applicantId', 'name email')
    .sort({ submittedAt: -1 })
    .lean();
  
  // Calculate max score and time taken for each attempt
  const attemptsWithDetails = attempts.map(attempt => {
    let maxScore = 0;
    test.questions.forEach(q => {
      maxScore += q.points || 1;
    });
    
    let timeTakenMinutes = null;
    if (attempt.submittedAt && attempt.startedAt) {
      timeTakenMinutes = Math.round((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 60000);
    }
    
    return {
      ...attempt,
      maxScore,
      timeTakenMinutes,
      needsManualEvaluation: attempt.status === 'submitted' && attempt.totalScore === null
    };
  });
  
  res.json({ attempts: attemptsWithDetails });
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
    const { title, description, instructions, durationMinutes, questions, testUrl, maxAttempts, allowedEmails } = req.body;
    if (title !== undefined) test.title = String(title).trim();
    if (description !== undefined) test.description = String(description).trim();
    if (instructions !== undefined) test.instructions = String(instructions).trim();
    if (typeof durationMinutes === 'number' && durationMinutes >= 0) test.durationMinutes = durationMinutes;
    if (typeof maxAttempts === 'number' && maxAttempts >= 1) test.maxAttempts = maxAttempts;
    if (Array.isArray(allowedEmails)) test.allowedEmails = allowedEmails.map(e => String(e).trim().toLowerCase()).filter(e => e);
    if (testUrl !== undefined && testUrl !== test.testUrl) {
      test.testUrl = await ensureUniqueTestUrl(testUrl);
    }
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

/**
 * GET /api/tests/url/:testUrl
 * Restricted route - shortlisted applicants with valid test links or org staff can access
 */
router.get('/url/:testUrl', authenticate, async (req, res) => {
  const FormSubmission = require('../models/FormSubmission');
  const TestAttempt = require('../models/TestAttempt');
  const { ROLES } = require('../constants/roles');
  
  const test = await Test.findOne({ testUrl: req.params.testUrl })
    .populate('questions.questionId')
    .lean();
  console.log('Looking for test with URL:', req.params.testUrl);
  console.log('Found test:', test ? 'YES' : 'NO');
  if (!test) return res.status(404).json({ error: 'Test not found' });
  
  const isStaff = req.user && [ROLES.ADMIN, ROLES.MANAGER].includes(req.user.role) && req.user.organizationId && (req.user.organizationId._id?.toString() || req.user.organizationId.toString()) === test.organizationId.toString();
  
  // Check email access for applicants
  if (!isStaff && req.user && req.user.role === ROLES.APPLICANT) {
    if (test.allowedEmails && test.allowedEmails.length > 0) {
      const userEmail = req.user.email.toLowerCase().trim();
      const allowedEmails = test.allowedEmails.map(e => e.toLowerCase().trim());
      console.log('Checking email access:');
      console.log('User email:', userEmail);
      console.log('Allowed emails:', allowedEmails);
      console.log('Is included:', allowedEmails.includes(userEmail));
      if (!allowedEmails.includes(userEmail)) {
        return res.status(403).json({ error: 'You do not have access to this test. Please contact the organization.' });
      }
    }
  }
  
  // If no specific question ID, return test overview with attempts count
  if (!req.query.questionId && !req.params.questionId) {
    let attemptsCount = 0;
    let maxAttempts = test.maxAttempts || 1;
    let bestScore = null;
    
    if (req.user && req.user.role === ROLES.APPLICANT) {
      attemptsCount = await TestAttempt.countDocuments({ testId: test._id, applicantId: req.user._id });
      
      // Check if there's a submission with custom maxAttempts
      const submission = await FormSubmission.findOne({
        applicantId: req.user._id,
        testLink: { $regex: req.params.testUrl, $options: 'i' }
      }).lean();
      
      if (submission && submission.maxAttempts) {
        maxAttempts = submission.maxAttempts;
      }
      
      // Get best score from previous attempts
      const attempts = await TestAttempt.find({ 
        testId: test._id, 
        applicantId: req.user._id,
        totalScore: { $ne: null }
      }).sort({ totalScore: -1 }).limit(1).lean();
      
      if (attempts.length > 0) {
        bestScore = attempts[0].totalScore;
      }
    }
    
    return res.json({ 
      test: { 
        _id: test._id, 
        title: test.title,
        instructions: test.instructions,
        durationMinutes: test.durationMinutes, 
        maxAttempts: maxAttempts,
        questionsCount: test.questions.length 
      },
      attemptsCount,
      bestScore
    });
  }
  
  if (!isStaff) {
    if (!req.user || req.user.role !== ROLES.APPLICANT) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    // Simplified: Allow any applicant to access test questions for now
  }
  
  const questions = test.questions.map(q => {
    const question = q.questionId;
    if (question.type === 'mcq') {
      return {
        _id: question._id,
        type: question.type,
        questionText: question.questionText,
        options: question.options.map(o => ({ text: o.text })),
        maxScore: q.points,
      };
    }
    return {
      _id: question._id,
      type: question.type,
      questionText: question.questionText,
      maxScore: q.points,
      answerType: question.answerType,
    };
  });
  console.log('Sending successful response with', questions.length, 'questions');
  res.json({ test: { _id: test._id, title: test.title, durationMinutes: test.durationMinutes, questions } });
});

/**
 * POST /api/tests/url/:testUrl/submit
 * Submit test via testUrl. Body: { answers: { questionId: value } }
 */
router.post('/url/:testUrl/submit', authenticate, async (req, res, next) => {
  try {
    const TestAttempt = require('../models/TestAttempt');
    const FormSubmission = require('../models/FormSubmission');
    const { ROLES } = require('../constants/roles');
    const { computeScores } = require('./attempts');
    
    if (!req.user || req.user.role !== ROLES.APPLICANT) {
      return res.status(403).json({ error: 'Only applicants can submit tests' });
    }
    
    const test = await Test.findOne({ testUrl: req.params.testUrl }).populate('questions.questionId');
    if (!test) return res.status(404).json({ error: 'Test not found' });
    
    // Check max attempts
    const attemptsCount = await TestAttempt.countDocuments({ testId: test._id, applicantId: req.user._id });
    let maxAttempts = test.maxAttempts || 1;
    
    // Check for submission-specific maxAttempts
    const submission = await FormSubmission.findOne({
      applicantId: req.user._id,
      testLink: { $regex: req.params.testUrl, $options: 'i' }
    }).lean();
    
    if (submission && submission.maxAttempts) {
      maxAttempts = submission.maxAttempts;
    }
    
    if (attemptsCount >= maxAttempts) {
      return res.status(403).json({ error: 'Maximum attempts reached' });
    }
    
    let answers = req.body.answers;
    
    // Handle sendBeacon text payload
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        answers = parsed.answers;
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    if (!answers || typeof answers !== 'object') {
      answers = {}; // Allow empty submission on refresh
    }
    
    const answerArray = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
    
    const attempt = await TestAttempt.create({
      testId: test._id,
      applicantId: req.user._id,
      answers: answerArray,
      submittedAt: new Date(),
      status: 'submitted',
    });
    
    const { autoScore, manualRequired } = computeScores(attempt, test);
    attempt.autoScore = autoScore;
    
    if (!manualRequired) {
      attempt.totalScore = autoScore;
      attempt.status = 'evaluated';
      attempt.evaluatedAt = new Date();
    }
    
    await attempt.save();
    
    res.json({
      success: true,
      totalScore: attempt.totalScore,
      autoScore: attempt.autoScore,
      status: attempt.status,
      manualRequired,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
