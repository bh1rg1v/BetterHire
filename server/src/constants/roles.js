/**
 * Role hierarchy for RBAC.
 * Admin = organization-level admin (full control within org).
 * Manager = org manager (jobs, forms, assessments).
 * Applicant = candidate (apply, tests, track progress).
 */
const ROLES = Object.freeze({
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  APPLICANT: 'Applicant',
});

const ALL_ROLES = Object.values(ROLES);

/** Roles that belong to an organization (have organizationId). */
const ORG_ROLES = [ROLES.ADMIN, ROLES.MANAGER];

/** Roles that can access org-scoped admin/manager dashboards. */
const ORG_STAFF_ROLES = [ROLES.ADMIN, ROLES.MANAGER];

function isOrgRole(role) {
  return ORG_ROLES.includes(role);
}

function isOrgStaff(role) {
  return ORG_STAFF_ROLES.includes(role);
}

module.exports = {
  ROLES,
  ALL_ROLES,
  ORG_ROLES,
  ORG_STAFF_ROLES,
  isOrgRole,
  isOrgStaff,
};
