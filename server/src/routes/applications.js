const express = require('express');
const Form = require('../models/Form');
const FormSubmission = require('../models/FormSubmission');
const Position = require('../models/Position');
const { ROLES } = require('../constants/roles');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/applications
 * Applicant submits application form for a position. Body: { positionId, data } or { formId, data }
 */
router.post('/', requireAuth, requireRole([ROLES.APPLICANT]), async (req, res, next) => {
  try {
    const { positionId, formId, data, resumeUrl } = req.body;
    if (!positionId && !formId) return res.status(400).json({ error: 'positionId or formId is required' });
    if (!data || typeof data !== 'object') return res.status(400).json({ error: 'data is required' });

    let form, position;
    
    if (positionId) {
      position = await Position.findById(positionId).populate('formId');
      if (!position) return res.status(404).json({ error: 'Position not found' });
      if (position.status !== 'published') return res.status(400).json({ error: 'Position is not open for applications' });
      if (!position.formId) return res.status(400).json({ error: 'This position has no application form' });
      form = await Form.findById(position.formId._id || position.formId);
    } else {
      form = await Form.findById(formId);
      if (!form) return res.status(400).json({ error: 'Form not found' });
    }

    if (!form) return res.status(400).json({ error: 'Form not found' });

    const schema = form.schema || { fields: [] };
    const fields = schema.fields || [];
    const errors = [];
    const normalizedData = {};
    for (const field of fields) {
      const val = data[field.id];
      const empty = val === undefined || val === null || String(val).trim() === '';
      if (field.required && empty) {
        errors.push(`${field.label || field.id} is required`);
      }
      normalizedData[field.id] = val == null ? '' : String(val).trim();
    }
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

    if (position) {
      const existing = await FormSubmission.findOne({
        positionId: position._id,
        applicantId: req.user._id,
      });
      if (existing) return res.status(409).json({ error: 'You have already applied to this position' });
    }

    const submission = await FormSubmission.create({
      formId: form._id,
      positionId: position?._id || null,
      applicantId: req.user._id,
      data: normalizedData,
      resumeUrl: resumeUrl ? String(resumeUrl).trim() : '',
    });
    const populated = await FormSubmission.findById(submission._id)
      .populate('applicantId', 'name email')
      .lean();
    res.status(201).json({ submission: populated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/applications/me
 * List current user's applications (submissions). Applicant only.
 */
router.get('/me', requireAuth, requireRole([ROLES.APPLICANT]), async (req, res) => {
  const submissions = await FormSubmission.find({ applicantId: req.user._id })
    .populate({ path: 'positionId', select: 'title status testId', populate: { path: 'organizationId', select: 'name' } })
    .populate({ path: 'formId', select: 'name', populate: { path: 'organizationId', select: 'name' } })
    .sort({ createdAt: -1 })
    .lean();
  
  // For submissions without positionId, try to find position through form
  for (let submission of submissions) {
    if (!submission.positionId && submission.formId) {
      const Position = require('../models/Position');
      const position = await Position.findOne({ formId: submission.formId._id }).select('title').lean();
      if (position) {
        submission.positionFromForm = position;
      }
    }
  }
  
  res.json({ submissions });
});

/**
 * GET /api/applications/me/:id
 * Get single application by applicant. Applicant only.
 */
router.get('/me/:id', requireAuth, requireRole([ROLES.APPLICANT]), async (req, res) => {
  const submission = await FormSubmission.findOne({ _id: req.params.id, applicantId: req.user._id })
    .populate('applicantId', 'name email')
    .populate('positionId', 'title')
    .populate('formId', 'name schema')
    .lean();
  if (!submission) return res.status(404).json({ error: 'Application not found' });
  res.json({ submission });
});

/**
 * GET /api/applications/position/:positionId/form
 * Public-ish: get form schema for a position (for apply page). Position must be published and have form.
 */
router.get('/position/:positionId/form', requireAuth, async (req, res) => {
  const position = await Position.findById(req.params.positionId).populate('formId');
  if (!position) return res.status(404).json({ error: 'Position not found' });
  if (position.status !== 'published') return res.status(404).json({ error: 'Position not found' });
  if (!position.formId) return res.status(404).json({ error: 'No application form' });
  const form = await Form.findById(position.formId._id || position.formId).select('name schema').lean();
  if (!form) return res.status(404).json({ error: 'Form not found' });
  res.json({
    position: { _id: position._id, title: position.title },
    form: { _id: form._id, name: form.name, schema: form.schema },
  });
});

/**
 * GET /api/applications/form/:formUrl
 * Get form schema by formUrl (for standalone form application).
 */
router.get('/form/:formUrl', async (req, res) => {
  const form = await Form.findOne({ formUrl: req.params.formUrl })
    .populate('organizationId', 'name')
    .select('name schema organizationId')
    .lean();
  if (!form) return res.status(404).json({ error: 'Form not found' });
  
  const position = await Position.findOne({ formId: form._id, status: 'published' })
    .select('title')
    .lean();
  
  res.json({
    form: { _id: form._id, name: form.name, schema: form.schema },
    organization: form.organizationId,
    position: position ? { title: position.title } : null,
  });
});

/**
 * PATCH /api/applications/:id
 * Applicant updates their own application (only if status is 'submitted')
 */
router.patch('/:id', requireAuth, requireRole([ROLES.APPLICANT]), async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!data || typeof data !== 'object') return res.status(400).json({ error: 'data is required' });

    const submission = await FormSubmission.findOne({ _id: req.params.id, applicantId: req.user._id });
    if (!submission) return res.status(404).json({ error: 'Application not found' });
    if (submission.status !== 'submitted') return res.status(400).json({ error: 'Cannot edit application after review has started' });

    const form = await Form.findById(submission.formId);
    if (!form) return res.status(400).json({ error: 'Form not found' });

    const schema = form.schema || { fields: [] };
    const fields = schema.fields || [];
    const errors = [];
    const normalizedData = {};
    for (const field of fields) {
      const val = data[field.id];
      const empty = val === undefined || val === null || String(val).trim() === '';
      if (field.required && empty) {
        errors.push(`${field.label || field.id} is required`);
      }
      normalizedData[field.id] = val == null ? '' : String(val).trim();
    }
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

    submission.data = normalizedData;
    await submission.save();

    const populated = await FormSubmission.findById(submission._id)
      .populate('applicantId', 'name email')
      .populate('positionId', 'title')
      .lean();
    res.json({ submission: populated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
