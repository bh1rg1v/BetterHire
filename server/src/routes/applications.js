const express = require('express');
const Form = require('../models/Form');
const FormSubmission = require('../models/FormSubmission');
const Position = require('../models/Position');
const { ROLES } = require('../constants/roles');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/applications
 * Applicant submits application form for a position. Body: { positionId, data }
 */
router.post('/', requireAuth, requireRole([ROLES.APPLICANT]), async (req, res, next) => {
  try {
    const { positionId, data, resumeUrl } = req.body;
    if (!positionId) return res.status(400).json({ error: 'positionId is required' });
    if (!data || typeof data !== 'object') return res.status(400).json({ error: 'data is required' });

    const position = await Position.findById(positionId).populate('formId');
    if (!position) return res.status(404).json({ error: 'Position not found' });
    if (position.status !== 'published') return res.status(400).json({ error: 'Position is not open for applications' });
    if (!position.formId) return res.status(400).json({ error: 'This position has no application form' });

    const form = await Form.findById(position.formId._id || position.formId);
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

    const existing = await FormSubmission.findOne({
      positionId: position._id,
      applicantId: req.user._id,
    });
    if (existing) return res.status(409).json({ error: 'You have already applied to this position' });

    const submission = await FormSubmission.create({
      formId: form._id,
      positionId: position._id,
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
    .populate('positionId', 'title status testId')
    .populate('formId', 'name')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ submissions });
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

module.exports = router;
