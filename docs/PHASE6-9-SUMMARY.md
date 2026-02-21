# Phases 6–9 — Summary

## Phase 6 — Applicant Module

### Implemented
- **Applicant dashboard** (`/dashboard/applicant`): Lists applications with **status** (submitted, under_review, shortlisted, rejected, hired); **Take test** link when position has a test and attempt is in progress or not started; test result (score) when evaluated.
- **Apply to job**: Unchanged; **resume URL** optional on apply (stored on FormSubmission.resumeUrl).
- **Take assigned test** (`/test/:positionId`): Start or resume attempt; **timer** from test.durationMinutes; render MCQ and descriptive questions; submit answers; redirect to dashboard.
- **Track status**: Application status on each submission; applicant sees status on dashboard; staff can change status (Phase 7).
- **Resume upload**: Profile has `resumeUrl` (URL); apply form has optional **Resume URL** field stored per application.
- **Public applicant profile**: `GET /api/users/:id/public` when profile.visibility === 'public' (unchanged).

### Backend
- **FormSubmission**: Added `status` (enum: submitted, under_review, shortlisted, rejected, hired), `resumeUrl`.
- **applications.js**: POST accepts `resumeUrl`; GET /me populates positionId with `testId`.
- **attempts**: Already support start, me, submit (no change).

---

## Phase 7 — Hiring Workflow Engine

### Implemented
- **Application status system**: FormSubmission.status; staff **PATCH /api/organizations/me/positions/:id/submissions/:submissionId** with `{ status }`.
- **State transition validation**: `constants/applicationStatus.js` — allowed transitions (e.g. submitted → under_review → shortlisted/rejected; shortlisted → hired/rejected). Invalid transitions return 400.
- **Notification system (email)**: `services/notificationService.js` — `sendApplicationStatusChange(applicantEmail, applicantName, positionTitle, newStatus)`. Stub logs to console; set SMTP/SendGrid in config to enable real email.
- **Drag-and-drop Kanban**: Optional — not implemented; submissions list has **status dropdown** per application (same effect for updating status).

### Backend
- **positions.js**: PATCH submission status with `canTransition()`; call `sendApplicationStatusChange()` after update; audit log entry.

---

## Phase 8 — Analytics & Reporting

### Implemented
- **Hiring funnel**: **GET /api/organizations/me/analytics/funnel?positionId=** — counts by application status (submitted, under_review, shortlisted, rejected, hired).
- **Conversion**: Funnel counts give conversion (e.g. shortlisted/submitted); no separate endpoint.
- **Test performance**: **GET /api/organizations/me/analytics/test-metrics?positionId=&testId=** — totalAttempts, averageScore, passRate (≥60% threshold).
- **Manager activity logs**: **GET /api/organizations/me/analytics/activity?limit=&skip=** — from AuditLog (action, resource, userId, createdAt).
- **Export CSV**: **GET /api/organizations/me/analytics/export/applications?positionId=** — CSV of applications (id, position, applicant, email, status, created). Client Analytics page has “Export applications (CSV)” with auth fetch and download.
- **Export PDF**: Not implemented (can add with e.g. pdfkit or puppeteer).

### Client
- **Analytics** (`/dashboard/analytics`): Funnel counts, test metrics, recent activity, Export CSV button.
- Manager dashboard: Link to **Analytics & export**.

---

## Phase 9 — Production Enhancements

### Implemented
- **Rate limiting**: `middleware/rateLimit.js` — **apiLimiter** (200 req/15 min default), **authLimiter** on login/register (20/15 min). Optional dependency `express-rate-limit`; if not installed, no-op. Env: `RATE_LIMIT_MAX`, `RATE_LIMIT_AUTH_MAX`.
- **Audit logs**: **AuditLog** model (organizationId, userId, action, resource, resourceId, details); **auditLog(req, action, resource, resourceId, details)** used on application status change. Activity endpoint reads from AuditLog.
- **Activity tracking**: Status changes and other mutations can call `auditLog()`; extend as needed.
- **File storage**: Resume is URL-only; no file upload server (add multer + cloud storage later if needed).
- **Performance**: Indexes on FormSubmission (positionId, status), existing indexes on other models; analytics uses aggregation and lean(). Add pagination (e.g. limit/skip on activity, submissions) where needed.
- **Multi-org scalability**: All org-scoped routes use `req.organizationId`; funnel/test-metrics/export filter by organization positions.

### Optional
- **express-rate-limit**: Run `npm install express-rate-limit` in `server/` to enable rate limiting.
- **Email**: Set `SMTP_*` or `SENDGRID_API_KEY` in env and implement in `notificationService.js` for real emails.

---

## New/updated files

| Phase | Server | Client |
|-------|--------|--------|
| 6 | FormSubmission (status, resumeUrl), applications (resumeUrl, position testId in /me) | DashboardApplicant (status, Take test), TakeTest.jsx, Apply (resumeUrl) |
| 7 | applicationStatus.js, notificationService.js, positions PATCH submission + audit + notify | PositionSubmissions (status dropdown) |
| 8 | routes/analytics.js (funnel, test-metrics, activity, export CSV) | Analytics.jsx, DashboardManager link |
| 9 | middleware/rateLimit.js, AuditLog.js, auditLog.js, index (rate limit + analytics mount), positions (auditLog) | — |
