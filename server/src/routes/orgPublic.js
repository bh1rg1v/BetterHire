const express = require('express');
const Organization = require('../models/Organization');

const router = express.Router();

router.get('/by-slug/:slug', async (req, res) => {
  const organization = await Organization.findOne({ 
    slug: req.params.slug.toLowerCase() 
  }).lean();
  
  if (!organization) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  res.json({ organization });
});

module.exports = router;