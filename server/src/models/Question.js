const mongoose = require('mongoose');

const QUESTION_TYPES = ['mcq', 'fillblank', 'descriptive'];

const questionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    questionText: { type: String, required: true, trim: true },
    /** For MCQ: [{ text, isCorrect }]. Exactly one should have isCorrect: true. */
    options: {
      type: [
        {
          text: { type: String, required: true },
          isCorrect: { type: Boolean, default: false },
        },
      ],
      default: undefined,
    },
    /** For fillblank: answer and answerType (integer or string) */
    answer: { type: String, trim: true, default: '' },
    answerType: { type: String, enum: ['integer', 'string'], default: 'string' },
    /** Tags for categorization and filtering */
    tags: [{ type: String, trim: true }],
    /** Max score for this question (used in tests). Default 1 for MCQ, configurable for descriptive. */
    maxScore: { type: Number, default: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

questionSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Question', questionSchema);
module.exports.QUESTION_TYPES = QUESTION_TYPES;
