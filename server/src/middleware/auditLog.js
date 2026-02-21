const AuditLog = require('../models/AuditLog');

/**
 * Log an action. Call from routes after successful mutation.
 * req.organizationId and req.user must be set.
 */
async function log(req, action, resource, resourceId, details) {
  if (!req.organizationId || !req.user) return;
  try {
    await AuditLog.create({
      organizationId: req.organizationId,
      userId: req.user._id,
      action,
      resource,
      resourceId: resourceId || undefined,
      details: details || undefined,
    });
  } catch (err) {
    console.error('Audit log error', err);
  }
}

module.exports = { log };
