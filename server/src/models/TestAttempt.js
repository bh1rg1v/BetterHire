const mongoose = require('mongoose');

const ATTEMPT_STATUS = ['in_progress', 'submitted', 'evaluated'];

const testAttemptSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', default: null },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    /** Answers: [{ questionId, value }]. value = option index (0-based) for MCQ, string for descriptive. */
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        value: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    status: { type: String, enum: ATTEMPT_STATUS, default: 'in_progress' },
    /** Auto-computed from MCQ. */
    autoScore: { type: Number, default: null },
    /** Manual scores per question (descriptive): [{ questionId, score, feedback?, evaluatedBy }] */
    manualScores: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        score: { type: Number, required: true },
        feedback: { type: String, default: '' },
        evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        evaluatedAt: { type: Date, default: Date.now },
      },
    ],
    totalScore: { type: Number, default: null },
    evaluatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

testAttemptSchema.index({ testId: 1, applicantId: 1, positionId: 1 });
testAttemptSchema.index({ positionId: 1, applicantId: 1 });
testAttemptSchema.index({ applicantId: 1, createdAt: -1 });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
module.exports.ATTEMPT_STATUS = ATTEMPT_STATUS;
