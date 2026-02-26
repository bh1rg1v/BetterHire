const express = require('express');
const Position = require('../models/Position');
const Organization = require('../models/Organization');

const router = express.Router();

/**
 * GET /api/jobs/search?q=query
 * Public. Search organizations by name.
 */
/**
 * GET /api/jobs/all
 * Public. List all published positions from all organizations.
 */
router.get('/all', async (req, res) => {
  const positions = await Position.find({ status: 'published' })
    .populate('organizationId', 'name slug')
    .select('title description createdAt updatedAt formId positionUrl organizationId')
    .sort({ updatedAt: -1 })
    .lean();
  const jobs = positions.map((p) => ({
    ...p,
    organization: p.organizationId,
    organizationId: undefined,
    hasForm: !!p.formId,
    formId: undefined,
  }));
  res.json({ jobs });
});

router.get('/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query || query.length < 1) {
    return res.json({ organizations: [], jobs: [] });
  }
  
  const [organizations, jobs] = await Promise.all([
    Organization.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { slug: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    })
      .select('name slug')
      .limit(5)
      .lean(),
    
    Position.find({
      title: { $regex: query, $options: 'i' },
      status: 'published'
    })
      .populate('organizationId', 'name slug')
      .select('title positionUrl organizationId')
      .limit(5)
      .lean()
  ]);
  
  res.json({ organizations, jobs });
});

/**
 * GET /api/jobs?org=slug
 * Public. List published positions for an organization. org = organization slug (required).
 */
router.get('/', async (req, res) => {
  const slug = (req.query.org || '').trim().toLowerCase();
  if (!slug) {
    return res.status(400).json({ error: 'Query parameter org (organization slug) is required' });
  }
  
  // Try to find by slug first, then by name if not found
  let org = await Organization.findOne({ slug }).lean();
  if (!org) {
    org = await Organization.findOne({ name: { $regex: slug, $options: 'i' } }).lean();
  }
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  const positions = await Position.find({
    organizationId: org._id,
    status: 'published',
  })
    .select('title description createdAt updatedAt formId positionUrl')
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
router.get('/url/:positionUrl', async (req, res) => {
  const position = await Position.findOne({
    positionUrl: req.params.positionUrl,
  })
    .populate('organizationId', 'name slug')
    .populate('assignedManagerId', 'name username')
    .populate('formId', 'formUrl')
    .lean();
  if (!position) {
    return res.status(404).json({ error: 'Job not found' });
  }
  const { organizationId, ...job } = position;
  res.json({
    job: { ...job, organization: organizationId },
    organization: organizationId,
  });
});

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
