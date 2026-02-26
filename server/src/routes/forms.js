const express = require('express');
const crypto = require('crypto');
const Form = require('../models/Form');
const FormSubmission = require('../models/FormSubmission');
const Position = require('../models/Position');
const { requireOrgStaff, requireCanPostJobs } = require('../middleware/auth');
const { FORM_FIELD_TYPES } = require('../models/Form');

const router = express.Router();

/**
 * GET /api/organizations/me/forms
 * List forms for the org. Staff only.
 */
router.get('/', requireOrgStaff, async (req, res) => {
  const forms = await Form.find({ organizationId: req.organizationId })
    .populate('createdBy', 'name email')
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ forms });
});

/**
 * POST /api/organizations/me/forms
 * Create form. canPostJobs required.
 */
router.post('/', requireCanPostJobs, async (req, res, next) => {
  try {
    const { name, formUrl, schema } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Form name is required' });
    }
    const normalizedSchema = normalizeSchema(schema);
    const finalFormUrl = formUrl && String(formUrl).trim() 
      ? await ensureUniqueFormUrl(generateFormUrl(String(formUrl).trim()))
      : await ensureUniqueFormUrl(crypto.randomBytes(8).toString('hex'));
    const form = await Form.create({
      organizationId: req.organizationId,
      name: String(name).trim(),
      formUrl: finalFormUrl,
      schema: normalizedSchema,
      createdBy: req.user._id,
    });
    const populated = await Form.findById(form._id).populate('createdBy', 'name email').lean();
    res.status(201).json({ form: populated });
  } catch (err) {
    next(err);
  }
});

function generateFormUrl(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function ensureUniqueFormUrl(base, excludeId) {
  let url = base;
  let exists = await Form.findOne({ formUrl: url, _id: { $ne: excludeId } });
  while (exists) {
    url = base + '-' + crypto.randomBytes(4).toString('hex');
    exists = await Form.findOne({ formUrl: url, _id: { $ne: excludeId } });
  }
  return url;
}

/**
 * GET /api/organizations/me/forms/:id
 * Single form. Staff only.
 */
router.get('/:id', requireOrgStaff, async (req, res) => {
  const form = await Form.findOne({
    _id: req.params.id,
    organizationId: req.organizationId,
  })
    .populate('createdBy', 'name email')
    .lean();
  if (!form) return res.status(404).json({ error: 'Form not found' });
  res.json({ form });
});

/**
 * GET /api/organizations/me/forms/url/:formUrl
 * Single form by URL. Staff only.
 */
router.get('/url/:formUrl', requireOrgStaff, async (req, res) => {
  const form = await Form.findOne({
    formUrl: req.params.formUrl,
    organizationId: req.organizationId,
  })
    .populate('createdBy', 'name email')
    .lean();
  if (!form) return res.status(404).json({ error: 'Form not found' });
  res.json({ form });
});

/**
 * GET /api/organizations/me/forms/url/:formUrl/submissions
 * Get submissions for a form by URL. Staff only.
 */
router.get('/url/:formUrl/submissions', requireOrgStaff, async (req, res) => {
  const form = await Form.findOne({
    formUrl: req.params.formUrl,
    organizationId: req.organizationId,
  }).lean();
  if (!form) return res.status(404).json({ error: 'Form not found' });
  
  const submissions = await FormSubmission.find({ formId: form._id })
    .populate('applicantId', 'name email')
    .populate('positionId', 'title')
    .sort({ createdAt: -1 })
    .lean();

  // For submissions without direct position, find position through form
  const position = await Position.findOne({ formId: form._id }).lean();
  const enhancedSubmissions = submissions.map(sub => ({
    ...sub,
    positionFromForm: !sub.positionId && position ? { title: position.title } : null
  }));

  res.json({ submissions: enhancedSubmissions });
});

/**
 * PATCH /api/organizations/me/forms/url/:formUrl
 * Update form by URL. canPostJobs required.
 */
router.patch('/url/:formUrl', requireCanPostJobs, async (req, res, next) => {
  try {
    const form = await Form.findOne({
      formUrl: req.params.formUrl,
      organizationId: req.organizationId,
    });
    if (!form) return res.status(404).json({ error: 'Form not found' });
    if (req.body.name !== undefined) form.name = String(req.body.name).trim();
    if (req.body.formUrl !== undefined && String(req.body.formUrl).trim()) {
      const newUrl = await ensureUniqueFormUrl(generateFormUrl(String(req.body.formUrl).trim()), form._id);
      form.formUrl = newUrl;
    }
    if (req.body.schema !== undefined) form.schema = normalizeSchema(req.body.schema);
    await form.save();
    const populated = await Form.findById(form._id).populate('createdBy', 'name email').lean();
    res.json({ form: populated });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/organizations/me/forms/:id
 * Update form name and/or schema. canPostJobs required.
 */
router.patch('/:id', requireCanPostJobs, async (req, res, next) => {
  try {
    const form = await Form.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!form) return res.status(404).json({ error: 'Form not found' });
    if (req.body.name !== undefined) form.name = String(req.body.name).trim();
    if (req.body.formUrl !== undefined && String(req.body.formUrl).trim()) {
      const newUrl = await ensureUniqueFormUrl(generateFormUrl(String(req.body.formUrl).trim()), form._id);
      form.formUrl = newUrl;
    }
    if (req.body.schema !== undefined) form.schema = normalizeSchema(req.body.schema);
    await form.save();
    const populated = await Form.findById(form._id).populate('createdBy', 'name email').lean();
    res.json({ form: populated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/organizations/me/submissions/:id
 * Get single submission. Staff only.
 */
router.get('/submissions/:id', requireOrgStaff, async (req, res) => {
  const submission = await FormSubmission.findById(req.params.id)
    .populate('applicantId', 'name email')
    .populate('positionId', 'title')
    .populate('formId', 'name schema')
    .lean();
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  
  const form = await Form.findById(submission.formId._id || submission.formId);
  if (!form || String(form.organizationId) !== String(req.organizationId)) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  res.json({ submission });
});

/**
 * PATCH /api/organizations/me/forms/submissions/:id/status
 * Update submission status. Staff only.
 */
router.patch('/submissions/:id/status', requireOrgStaff, async (req, res) => {
  const { status } = req.body;
  const submission = await FormSubmission.findById(req.params.id);
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  
  const form = await Form.findById(submission.formId);
  if (!form || String(form.organizationId) !== String(req.organizationId)) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  submission.status = status;
  await submission.save();
  res.json({ submission });
});

/**
 * PATCH /api/organizations/me/forms/submissions/:id/test-link
 * Update submission test link. Staff only.
 */
router.patch('/submissions/:id/test-link', requireOrgStaff, async (req, res) => {
  const { testLink, testStartDate, testEndDate } = req.body;
  const submission = await FormSubmission.findById(req.params.id);
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  
  const form = await Form.findById(submission.formId);
  if (!form || String(form.organizationId) !== String(req.organizationId)) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  submission.testLink = testLink;
  submission.testStartDate = testStartDate;
  submission.testEndDate = testEndDate;
  await submission.save();
  res.json({ submission });
});

/**
 * DELETE /api/organizations/me/forms/:id
 * canPostJobs required.
 */
router.delete('/:id', requireCanPostJobs, async (req, res, next) => {
  try {
    const form = await Form.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    if (!form) return res.status(404).json({ error: 'Form not found' });
    await Form.deleteOne({ _id: form._id });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

function normalizeSchema(schema) {
  const s = schema && typeof schema === 'object' ? schema : { fields: [] };
  const fields = Array.isArray(s.fields) ? s.fields : [];
  return {
    fields: fields.map((f, i) => {
      const fieldType = FORM_FIELD_TYPES.includes(f.type) ? f.type : 'text';
      return {
        id: f.id || `f${i + 1}`,
        type: fieldType,
        label: String(f.label || '').trim() || `Field ${i + 1}`,
        required: !!f.required,
        placeholder: f.placeholder != null ? String(f.placeholder) : '',
        options: (f.type === 'select' || f.type === 'radio') && Array.isArray(f.options) ? f.options.map((o) => String(o)) : undefined,
      };
    }),
  };
}

module.exports = router;
