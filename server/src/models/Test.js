const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    instructions: { type: String, default: '', trim: true },
    /** Unique URL slug for the test */
    testUrl: { type: String, required: true, unique: true, trim: true, lowercase: true },
    /** Duration in minutes. 0 = no time limit. */
    durationMinutes: { type: Number, default: 0, min: 0 },
    /** Maximum attempts allowed. Default is 1. */
    maxAttempts: { type: Number, default: 1, min: 1 },
    /** List of emails allowed to access this test */
    allowedEmails: [{ type: String, trim: true, lowercase: true }],
    /** Questions in order: [{ questionId, order, points }]. points overrides question.maxScore for this test. */
    questions: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        order: { type: Number, default: 0 },
        points: { type: Number, default: 1 },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

testSchema.index({ organizationId: 1, createdAt: -1 });
testSchema.index({ testUrl: 1 });

module.exports = mongoose.model('Test', testSchema);
