const mongoose = require('mongoose');

const managerInviteSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

managerInviteSchema.index({ organizationId: 1, status: 1 });
managerInviteSchema.index({ token: 1 });
managerInviteSchema.index({ email: 1, organizationId: 1 });

module.exports = mongoose.model('ManagerInvite', managerInviteSchema);
