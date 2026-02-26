const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, ALL_ROLES } = require('../constants/roles');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ALL_ROLES,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    isActive: { type: Boolean, default: true },
    pendingApproval: { type: Boolean, default: false },
    canPostJobs: { type: Boolean, default: false },
    profile: {
      headline: { type: String, trim: true, default: '' },
      bio: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      resumeUrl: { type: String, trim: true, default: '' },
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
userSchema.index({ username: 1 });
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

userSchema.pre('validate', function (next) {
  if (this.role === ROLES.ADMIN && !this.organizationId) {
    next(new Error('Organization is required for Admin role'));
  } else if (this.role === ROLES.APPLICANT && this.organizationId) {
    this.organizationId = undefined;
  } else if (this.role === ROLES.SUPER_ADMIN && this.organizationId) {
    this.organizationId = undefined;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
