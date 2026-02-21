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
    positionUrl: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '', trim: true },
    keyResponsibilities: [{ type: String, trim: true }],
    qualifications: [{ type: String, trim: true }],
    preferredQualifications: [{ type: String, trim: true }],
    requiredSkills: [{ type: String, trim: true }],
    preferredSkills: [{ type: String, trim: true }],
    jobType: { type: String, enum: ['Full Time', 'Part Time', 'Internship', 'Contract'], default: 'Full Time' },
    workEnvironment: { type: String, enum: ['Onsite', 'Remote', 'Hybrid'], default: 'Onsite' },
    compensation: [{ type: String, trim: true }],
    companyOverview: { type: String, default: '', trim: true },
    openDate: { type: Date, default: Date.now },
    closeDate: { type: Date, default: null },
    activeDays: { type: Number, default: null },
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
positionSchema.index({ positionUrl: 1 });

module.exports = mongoose.model('Position', positionSchema);
module.exports.POSITION_STATUS = POSITION_STATUS;
