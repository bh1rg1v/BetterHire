const mongoose = require('mongoose');
const { ROLES } = require('../constants/roles');

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    /** Optional settings (branding, public career page URL, etc.) */
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

organizationSchema.index({ slug: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
