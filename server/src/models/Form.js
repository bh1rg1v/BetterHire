const mongoose = require('mongoose');

/**
 * Form structure stored as JSON schema.
 * schema.fields: [{ id, type, label, required, placeholder?, options? }]
 * Field types: text, email, number, textarea, select, checkbox, radio
 */
const FORM_FIELD_TYPES = ['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio'];

const formSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    /** JSON schema: { fields: [ { id, type, label, required, placeholder?, options? } ] } */
    schema: {
      type: mongoose.Schema.Types.Mixed,
      default: { fields: [] },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

formSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Form', formSchema);
module.exports.FORM_FIELD_TYPES = FORM_FIELD_TYPES;
