# Phase 4 — Form Builder System

## Implemented

### Dynamic form schema (JSON)
- **Form model:** `organizationId`, `name`, `schema` (Mixed), `createdBy`.
- **schema:** `{ fields: [ { id, type, label, required, placeholder?, options? } ] }`.
- Field types: **text**, **email**, **number**, **textarea**, **select**, **checkbox**, **radio**. For select/radio, `options` is an array of strings.

### Required validation
- Server validates required fields on submit; returns 400 with details if validation fails.

### Form submission storage
- **FormSubmission model:** `formId`, `positionId`, `applicantId`, `data` (Mixed — map of field id to value).
- **POST /api/applications** — Applicant only. Body: `{ positionId, data }`. Creates submission; one per applicant per position.

### Link form to position
- **Position.formId** (optional). Set via PATCH position (formId or null).
- **GET /api/applications/position/:positionId/form** — Returns form schema for apply page (position must be published and have form).

### APIs
- **Forms (org):** GET/POST /api/organizations/me/forms, GET/PATCH/DELETE /api/organizations/me/forms/:id. canPostJobs for create/update/delete.
- **Applications:** POST /api/applications, GET /api/applications/me (applicant), GET /api/applications/position/:positionId/form.
- **Submissions (staff):** GET /api/organizations/me/positions/:id/submissions.

### Client
- **Form builder** (/dashboard/forms): List forms, create/edit form with dynamic fields (add/remove, type, label, required, options for select/radio).
- **Manager dashboard:** Position create/edit includes **Form** and **Test** dropdowns; Submissions/Attempts links per position.
- **Apply** (/apply/:positionId): Applicant-only; loads form schema, renders fields, submits to POST /api/applications. Redirect to login if not Applicant.
- **Applicant dashboard** (/dashboard/applicant): Lists my applications (submissions).
- **Position submissions** (/dashboard/positions/:id/submissions): Staff list of form submissions for a position.

### Public job
- **GET /api/jobs** and **GET /api/jobs/:id** include **hasForm** so the client can show an “Apply” link. Add “Apply for this position” linking to `/apply/:id` on the job detail page when `job.hasForm` and user is Applicant.
