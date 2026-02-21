const express = require('express');
const Position = require('../models/Position');
const Organization = require('../models/Organization');

const router = express.Router();

/**
 * GET /api/jobs?org=slug
 * Public. List published positions for an organization. org = organization slug (required).
 */
router.get('/', async (req, res) => {
  const slug = (req.query.org || '').trim().toLowerCase();
  if (!slug) {
    return res.status(400).json({ error: 'Query parameter org (organization slug) is required' });
  }
  const org = await Organization.findOne({ slug }).lean();
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  const positions = await Position.find({
    organizationId: org._id,
    status: 'published',
  })
    .select('title description createdAt updatedAt formId')
    .sort({ updatedAt: -1 })
    .lean();
  const jobs = positions.map((p) => ({
    ...p,
    hasForm: !!p.formId,
    formId: undefined,
  }));
  res.json({
    organization: { name: org.name, slug: org.slug },
    jobs,
  });
});

/**
 * GET /api/jobs/:id
 * Public. Single job (published only).
 */
router.get('/:id', async (req, res) => {
  const position = await Position.findOne({
    _id: req.params.id,
    status: 'published',
  })
    .populate('organizationId', 'name slug')
    .lean();
  if (!position) {
    return res.status(404).json({ error: 'Job not found' });
  }
  const { organizationId, ...job } = position;
  res.json({
    job: { ...job, organization: organizationId, hasForm: !!position.formId },
    organization: organizationId,
  });
});

module.exports = router;
