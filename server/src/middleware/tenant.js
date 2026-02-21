/**
 * Multi-tenant isolation: ensure resources belong to the current user's organization.
 * Use after requireOrgStaff so req.organizationId is set.
 */

function requireSameOrg(resourceOrganizationIdGetter) {
  /**
   * resourceOrganizationIdGetter(req) => ObjectId | null
   * e.g. (req) => req.params.orgId or (req) => req.job?.organizationId
   */
  return (req, res, next) => {
    const resourceOrgId = resourceOrganizationIdGetter(req);
    if (!resourceOrgId) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    const userOrgId = req.organizationId?.toString?.() || req.organizationId;
    const resourceOrgIdStr = resourceOrgId.toString?.() || resourceOrgId;
    if (userOrgId !== resourceOrgIdStr) {
      return res.status(403).json({ error: 'Access denied to this organization' });
    }
    next();
  };
}

/** Middleware that loads org from param and checks membership. */
function withOrgParam(paramName = 'orgId') {
  return [
    (req, res, next) => {
      req._tenantOrgId = req.params[paramName];
      next();
    },
    requireSameOrg((req) => req._tenantOrgId),
  ];
}

module.exports = {
  requireSameOrg,
  withOrgParam,
};
