const mongoose = require('mongoose');

const POSITION_STATUS = ['draft', 'published', 'closed'];

const positionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: POSITION_STATUS,
      default: 'draft',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    /** Optional: manager responsible for this position. */
    assignedManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    /** Optional: application form linked to this position. */
    formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', default: null },
    /** Optional: test assigned to this position. */
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', default: null },
  },
  { timestamps: true }
);

positionSchema.index({ organizationId: 1, status: 1 });
positionSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Position', positionSchema);
module.exports.POSITION_STATUS = POSITION_STATUS;
