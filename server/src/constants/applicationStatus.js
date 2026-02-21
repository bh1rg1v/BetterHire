/**
 * Application status transitions (Phase 7 — Hiring Workflow).
 * Only allowed transitions are valid.
 */
const APPLICATION_STATUS = ['submitted', 'under_review', 'shortlisted', 'rejected', 'hired'];

const ALLOWED_TRANSITIONS = {
  submitted: ['under_review', 'rejected'],
  under_review: ['shortlisted', 'rejected'],
  shortlisted: ['hired', 'rejected', 'under_review'],
  rejected: [], // terminal
  hired: [],   // terminal
};

function canTransition(from, to) {
  if (!APPLICATION_STATUS.includes(from) || !APPLICATION_STATUS.includes(to)) return false;
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed && allowed.includes(to);
}

module.exports = { APPLICATION_STATUS, ALLOWED_TRANSITIONS, canTransition };
