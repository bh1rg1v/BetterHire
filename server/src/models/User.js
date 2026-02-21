const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, ALL_ROLES, isOrgRole } = require('../constants/roles');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ALL_ROLES,
    },
    /** Set for Admin and Manager; null for Applicant. */
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    /** Org staff only: false = cannot log in or access org. */
    isActive: { type: Boolean, default: true },
    /** Manager only: true until Admin approves invite. */
    pendingApproval: { type: Boolean, default: false },
    /** Manager only: can create/edit job postings. Only Admin can set. */
    canPostJobs: { type: Boolean, default: false },
    /** Public profile (for Applicants; optional for others). */
    profile: {
      headline: { type: String, trim: true, default: '' },
      bio: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      resumeUrl: { type: String, trim: true, default: '' },
      /** Only fields listed here are visible in public profile. */
      visibility: {
        type: String,
        enum: ['private', 'public'],
        default: 'private',
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ organizationId: 1, role: 1 });

userSchema.pre('save', function (next) {
  if (!this.isModified('passwordHash')) return next();
  if (this.passwordHash && this.passwordHash.length < 60) {
    return next(new Error('Password must be hashed before save'));
  }
  next();
});

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.statics.hashPassword = function (plainPassword) {
  return bcrypt.hash(plainPassword, 12);
};

/** Validate organizationId when role is org-scoped. */
userSchema.pre('validate', function (next) {
  if (isOrgRole(this.role) && !this.organizationId) {
    next(new Error('Organization is required for Admin and Manager roles'));
  } else if (!isOrgRole(this.role) && this.organizationId) {
    this.organizationId = undefined;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
