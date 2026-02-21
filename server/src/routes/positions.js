const express = require('express');
const Position = require('../models/Position');
const Form = require('../models/Form');
const FormSubmission = require('../models/FormSubmission');
const Test = require('../models/Test');
const User = require('../models/User');
const { ROLES } = require('../constants/roles');
const { requireOrgStaff, requireCanPostJobs } = require('../middleware/auth');
const { POSITION_STATUS } = require('../models/Position');

const router = express.Router();

function generatePositionUrl() {
  return require('crypto').randomBytes(8).toString('hex');
}

async function ensureUniquePositionUrl(url) {
  let positionUrl = url;
  let exists = await Position.findOne({ positionUrl });
  while (exists) {
    positionUrl = url + '-' + Math.random().toString(36).substring(2, 6);
    exists = await Position.findOne({ positionUrl });
  }
  return positionUrl;
}

/**
 * GET /api/organizations/me/positions
 * List positions for the org. Staff can list; filter by status.
 */
router.get('/', requireOrgStaff, async (req, res) => {
  const { status } = req.query;
  const query = { organizationId: req.organizationId };
  if (status && POSITION_STATUS.includes(status)) query.status = status;
  const positions = await Position.find(query)
    .populate('createdBy', 'name email')
    .populate('assignedManagerId', 'name email')
    .populate('formId', 'name')
    .populate('testId', 'title durationMinutes')
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ positions });
});

/**
 * POST /api/organizations/me/positions
 * Create position. Requires canPostJobs (Admin or Manager with permission).
 */
router.post('/', requireCanPostJobs, async (req, res, next) => {
  try {
    const { title, description, status, assignedManagerId, formId, testId, keyResponsibilities, qualifications, preferredQualifications, requiredSkills, preferredSkills, jobType, workEnvironment, compensation, companyOverview, positionUrl, openDate, closeDate, activeDays } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    let finalUrl = positionUrl ? positionUrl.toLowerCase().replace(/[^a-z0-9-]/g, '-') : generatePositionUrl();
    finalUrl = await ensureUniquePositionUrl(finalUrl);
    
    const positionData = {
      organizationId: req.organizationId,
      title: String(title).trim(),
      positionUrl: finalUrl,
      description: String(description || '').trim(),
      keyResponsibilities: keyResponsibilities || [],
      qualifications: qualifications || [],
      preferredQualifications: preferredQualifications || [],
      requiredSkills: requiredSkills || [],
      preferredSkills: preferredSkills || [],
      jobType: jobType || 'Full Time',
      workEnvironment: workEnvironment || 'Onsite',
      compensation: compensation || [],
      companyOverview: String(companyOverview || '').trim(),
      status: status && POSITION_STATUS.includes(status) ? status : 'draft',
      createdBy: req.user._id,
      assignedManagerId: assignedManagerId || null,
      formId: formId || null,
      testId: testId || null,
      openDate: openDate || new Date(),
      activeDays: activeDays || null,
    };
    
    if (closeDate) {
      positionData.closeDate = new Date(closeDate);
    } else if (activeDays && activeDays > 0) {
      const open = new Date(positionData.openDate);
      positionData.closeDate = new Date(open.getTime() + activeDays * 24 * 60 * 60 * 1000);
    }
    
    const position = await Position.create(positionData);
    const populated = await Position.findById(position._id)
      .populate('createdBy', 'name email')
      .populate('assignedManagerId', 'name email')
      .populate('formId', 'name')
      .populate('testId', 'title durationMinutes')
      .lean();
    res.status(201).json({ position: populated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/organizations/me/positions/:id
 * Single position (org-scoped). Staff only.
 */
router.get('/url/:positionUrl', requireOrgStaff, async (req, res) => {
  const position = await Position.findOne({
    positionUrl: req.params.positionUrl,
    organizationId: req.organizationId,
  })
    .populate('createdBy', 'name email')
    .populate('assignedManagerId', 'name email')
    .populate('formId', 'name schema')
    .populate('testId', 'title durationMinutes')
    .lean();
  if (!position) return res.status(404).json({ error: 'Position not found' });
  res.json({ position });
});

router.patch('/url/:positionUrl', requireCanPostJobs, async (req, res, next) => {
  try {
    const position = await Position.findOne({
      positionUrl: req.params.positionUrl,
      organizationId: req.organizationId,
    });
    if (!position) return res.status(404).json({ error: 'Position not found' });

    const { title, description, status, assignedManagerId, formId, testId, keyResponsibilities, qualifications, preferredQualifications, requiredSkills, preferredSkills, jobType, workEnvironment, compensation, companyOverview, positionUrl, openDate, closeDate, activeDays } = req.body;
    if (title !== undefined) position.title = String(title).trim();
    if (positionUrl !== undefined) {
      let finalUrl = positionUrl.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      if (finalUrl !== position.positionUrl) {
        finalUrl = await ensureUniquePositionUrl(finalUrl);
        position.positionUrl = finalUrl;
      }
    }
    if (description !== undefined) position.description = String(description).trim();
    if (keyResponsibilities !== undefined) position.keyResponsibilities = keyResponsibilities;
    if (qualifications !== undefined) position.qualifications = qualifications;
    if (preferredQualifications !== undefined) position.preferredQualifications = preferredQualifications;
    if (requiredSkills !== undefined) position.requiredSkills = requiredSkills;
    if (preferredSkills !== undefined) position.preferredSkills = preferredSkills;
    if (jobType !== undefined) position.jobType = jobType;
    if (workEnvironment !== undefined) position.workEnvironment = workEnvironment;
    if (compensation !== undefined) position.compensation = compensation;
    if (companyOverview !== undefined) position.companyOverview = String(companyOverview).trim();
    if (openDate !== undefined) position.openDate = new Date(openDate);
    if (closeDate !== undefined) position.closeDate = closeDate ? new Date(closeDate) : null;
    if (activeDays !== undefined) {
      position.activeDays = activeDays;
      if (activeDays && position.openDate) {
        position.closeDate = new Date(position.openDate.getTime() + activeDays * 24 * 60 * 60 * 1000);
      }
    }
    if (status !== undefined) {
      if (!POSITION_STATUS.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use draft, published, or closed' });
      }
      position.status = status;
    }
    if (assignedManagerId !== undefined) {
      if (assignedManagerId === null || assignedManagerId === '') {
        position.assignedManagerId = null;
      } else {
        const manager = await User.findOne({
          _id: assignedManagerId,
          organizationId: req.organizationId,
          role: ROLES.MANAGER,
          isActive: true,
          pendingApproval: false,
        });
        if (!manager) return res.status(400).json({ error: 'Invalid manager' });
        position.assignedManagerId = manager._id;
      }
    }
    if (formId !== undefined) {
      if (formId === null || formId === '') {
        position.formId = null;
      } else {
        const form = await Form.findOne({ _id: formId, organizationId: req.organizationId });
        if (!form) return res.status(400).json({ error: 'Invalid form' });
        position.formId = form._id;
      }
    }
    if (testId !== undefined) {
      if (testId === null || testId === '') {
        position.testId = null;
      } else {
        const test = await Test.findOne({ _id: testId, organizationId: req.organizationId });
        if (!test) return res.status(400).json({ error: 'Invalid test' });
        position.testId = test._id;
      }
    }
    await position.save();
    const populated = await Position.findById(position._id)
      .populate('createdBy', 'name email')
      .populate('assignedManagerId', 'name email')
      .populate('formId', 'name')
      .populate('testId', 'title durationMinutes')
      .lean();
    res.json({ position: populated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/organizations/me/positions/:id
 * Single position (org-scoped). Staff only.
 */
router.get('/:id', requireOrgStaff, async (req, res) => {
  const position = await Position.findOne({
    _id: req.params.id,
    organizationId: req.organizationId,
  })
    .populate('createdBy', 'name email')
    .populate('assignedManagerId', 'name email')
    .populate('formId', 'name schema')
    .populate('testId', 'title durationMinutes')
    .lean();
  if (!position) return res.status(404).json({ error: 'Position not found' });
  res.json({ position });
});

/**
 * PATCH /api/organizations/me/positions/:id
 * Update position: title, description, status (draft|published|closed), assignedManagerId.
 * Requires canPostJobs.
 */
router.patch('/:id', requireCanPostJobs, async (req, res, next) => {
  try {
    const position = await Position.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!position) return res.status(404).json({ error: 'Position not found' });

    const { title, description, status, assignedManagerId, formId, testId, keyResponsibilities, qualifications, preferredQualifications, requiredSkills, preferredSkills, jobType, workEnvironment, compensation, companyOverview, positionUrl } = req.body;
    if (title !== undefined) position.title = String(title).trim();
    if (positionUrl !== undefined) {
      let finalUrl = positionUrl.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      if (finalUrl !== position.positionUrl) {
        finalUrl = await ensureUniquePositionUrl(finalUrl);
        position.positionUrl = finalUrl;
      }
    }
    if (description !== undefined) position.description = String(description).trim();
    if (keyResponsibilities !== undefined) position.keyResponsibilities = keyResponsibilities;
    if (qualifications !== undefined) position.qualifications = qualifications;
    if (preferredQualifications !== undefined) position.preferredQualifications = preferredQualifications;
    if (requiredSkills !== undefined) position.requiredSkills = requiredSkills;
    if (preferredSkills !== undefined) position.preferredSkills = preferredSkills;
    if (jobType !== undefined) position.jobType = jobType;
    if (workEnvironment !== undefined) position.workEnvironment = workEnvironment;
    if (compensation !== undefined) position.compensation = compensation;
    if (companyOverview !== undefined) position.companyOverview = String(companyOverview).trim();
    if (status !== undefined) {
      if (!POSITION_STATUS.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use draft, published, or closed' });
      }
      position.status = status;
    }
    if (assignedManagerId !== undefined) {
      if (assignedManagerId === null || assignedManagerId === '') {
        position.assignedManagerId = null;
      } else {
        const manager = await User.findOne({
          _id: assignedManagerId,
          organizationId: req.organizationId,
          role: ROLES.MANAGER,
          isActive: true,
          pendingApproval: false,
        });
        if (!manager) return res.status(400).json({ error: 'Invalid manager' });
        position.assignedManagerId = manager._id;
      }
    }
    if (formId !== undefined) {
      if (formId === null || formId === '') {
        position.formId = null;
      } else {
        const form = await Form.findOne({ _id: formId, organizationId: req.organizationId });
        if (!form) return res.status(400).json({ error: 'Invalid form' });
        position.formId = form._id;
      }
    }
    if (testId !== undefined) {
      if (testId === null || testId === '') {
        position.testId = null;
      } else {
        const test = await Test.findOne({ _id: testId, organizationId: req.organizationId });
        if (!test) return res.status(400).json({ error: 'Invalid test' });
        position.testId = test._id;
      }
    }
    await position.save();
    const populated = await Position.findById(position._id)
      .populate('createdBy', 'name email')
      .populate('assignedManagerId', 'name email')
      .populate('formId', 'name')
      .populate('testId', 'title durationMinutes')
      .lean();
    res.json({ position: populated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/organizations/me/positions/:id/submissions
 * List form submissions for this position. Org staff only.
 */
router.get('/:id/submissions', requireOrgStaff, async (req, res) => {
  const position = await Position.findOne({
    _id: req.params.id,
    organizationId: req.organizationId,
  });
  if (!position) return res.status(404).json({ error: 'Position not found' });
  const submissions = await FormSubmission.find({ positionId: position._id })
    .populate('applicantId', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ submissions });
});

/**
 * PATCH /api/organizations/me/positions/:id/submissions/:submissionId
 * Update application status. Staff only. Validates state transition; sends notification stub.
 */
router.patch('/:id/submissions/:submissionId', requireOrgStaff, async (req, res, next) => {
  try {
    const position = await Position.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!position) return res.status(404).json({ error: 'Position not found' });
    const submission = await FormSubmission.findOne({
      _id: req.params.submissionId,
      positionId: position._id,
    }).populate('applicantId', 'name email');
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    if (!canTransition(submission.status, status)) {
      return res.status(400).json({ error: `Invalid transition from ${submission.status} to ${status}` });
    }
    const previousStatus = submission.status;
    submission.status = status;
    await submission.save();
    auditLog(req, 'application_status_change', 'FormSubmission', submission._id, { previousStatus, newStatus: status });
    sendApplicationStatusChange(
      submission.applicantId?.email,
      submission.applicantId?.name,
      position.title,
      status
    ).catch(() => {});
    const populated = await FormSubmission.findById(submission._id)
      .populate('applicantId', 'name email')
      .lean();
    res.json({ submission: populated });
  } catch (err) {
    next(err);
  }
});

const TestAttempt = require('../models/TestAttempt');
const { canTransition } = require('../constants/applicationStatus');
const { sendApplicationStatusChange } = require('../services/notificationService');
const { log: auditLog } = require('../middleware/auditLog');

/**
 * GET /api/organizations/me/positions/:id/attempts
 * List test attempts for this position. Org staff only.
 */
router.get('/:id/attempts', requireOrgStaff, async (req, res) => {
  const position = await Position.findOne({
    _id: req.params.id,
    organizationId: req.organizationId,
  });
  if (!position) return res.status(404).json({ error: 'Position not found' });
  const attempts = await TestAttempt.find({ positionId: position._id })
    .populate('applicantId', 'name email')
    .populate('testId', 'title durationMinutes')
    .sort({ submittedAt: -1, createdAt: -1 })
    .lean();
  res.json({ attempts });
});

module.exports = router;
