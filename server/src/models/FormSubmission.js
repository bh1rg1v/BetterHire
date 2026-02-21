const mongoose = require('mongoose');

const APPLICATION_STATUS = ['submitted', 'under_review', 'shortlisted', 'rejected', 'hired'];

const formSubmissionSchema = new mongoose.Schema(
  {
    formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
    positionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', default: null },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    /** Answers keyed by field id: { [fieldId]: value } */
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: APPLICATION_STATUS, default: 'submitted' },
    /** Optional resume file URL (Phase 6). */
    resumeUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

formSubmissionSchema.index({ formId: 1, positionId: 1, applicantId: 1 });
formSubmissionSchema.index({ positionId: 1, createdAt: -1 });
formSubmissionSchema.index({ positionId: 1, status: 1 });

module.exports = mongoose.model('FormSubmission', formSubmissionSchema);
module.exports.APPLICATION_STATUS = APPLICATION_STATUS;
