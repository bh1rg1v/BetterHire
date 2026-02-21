const express = require('express');
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
    const { name, schema } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Form name is required' });
    }
    const normalizedSchema = normalizeSchema(schema);
    const form = await Form.create({
      organizationId: req.organizationId,
      name: String(name).trim(),
      schema: normalizedSchema,
      createdBy: req.user._id,
    });
    const populated = await Form.findById(form._id).populate('createdBy', 'name email').lean();
    res.status(201).json({ form: populated });
  } catch (err) {
    next(err);
  }
});

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
    if (req.body.schema !== undefined) form.schema = normalizeSchema(req.body.schema);
    await form.save();
    const populated = await Form.findById(form._id).populate('createdBy', 'name email').lean();
    res.json({ form: populated });
  } catch (err) {
    next(err);
  }
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
    fields: fields.map((f, i) => ({
      id: f.id || `f${i + 1}`,
      type: FORM_FIELD_TYPES.includes(f.type) ? f.type : 'text',
      label: String(f.label || '').trim() || `Field ${i + 1}`,
      required: !!f.required,
      placeholder: f.placeholder != null ? String(f.placeholder) : '',
      options: (f.type === 'select' || f.type === 'radio') && Array.isArray(f.options) ? f.options.map((o) => String(o)) : undefined,
    })),
  };
}

module.exports = router;
