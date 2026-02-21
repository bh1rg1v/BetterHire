# Phase 3 — Job Position Management

## Implemented

### Position model
- **OrganizationId**, **title**, **description**, **status** (draft | published | closed), **createdBy** (User), **assignedManagerId** (User, optional).
- Default status: draft.

### Create / Edit position
- **POST /api/organizations/me/positions** — Create. Body: `title` (required), `description`, `status`, `assignedManagerId`. Requires **canPostJobs** (Admin or Manager with permission).
- **GET /api/organizations/me/positions** — List for org. Query: `?status=draft|published|closed`. Requires org staff (Admin or Manager).
- **GET /api/organizations/me/positions/:id** — Single position. Org staff only.
- **PATCH /api/organizations/me/positions/:id** — Update title, description, status, assignedManagerId. Requires canPostJobs.

### Draft / Publish / Close
- Status is updated via PATCH with `status: 'draft' | 'published' | 'closed'`. Only **published** positions appear on the public job listing.

### Attach manager
- **assignedManagerId** on the position. Set via PATCH; value must be an active, approved Manager in the same org. Managers list is available to org staff at **GET /api/organizations/me/managers** (changed from Admin-only so Managers can use it for the assign dropdown).

### Public job listing
- **GET /api/jobs?org=slug** — Public. Returns `{ organization: { name, slug }, jobs: [...] }`. Only **published** positions.
- **GET /api/jobs/:id** — Public. Single job (published only). Returns `{ job, organization }`.

### Middleware
- **requireCanPostJobs** — Admin, or Manager with `canPostJobs: true`. Sets `req.organizationId`. Used for create/update positions.

### Dashboard
- **Manager dashboard** at `/dashboard/manager` (Admin or Manager):
  - Lists all positions for the org (filter by status).
  - **Create position** (if canPostJobs): title, description, status, assigned manager.
  - **Edit** (if canPostJobs): same fields.
  - **Draft / Publish / Close** buttons per row (if canPostJobs).
  - **Assigned manager** column and dropdown in form.
  - Link to public listing: `/jobs?org={slug}`.

### Client routes
- **/jobs** — Public. If `?org=slug` present, shows list of published jobs for that org; otherwise form to enter org handle.
- **/job/:id** — Public. Single job detail (published only).
- **/dashboard/manager** — Manager dashboard (ProtectedRoute, Admin or Manager). Managers without canPostJobs see list only and a message to contact Admin.

### Home
- **View jobs** link added to home page (public).

## Files touched
- **Server:** `models/Position.js`, `middleware/auth.js` (requireCanPostJobs), `routes/positions.js`, `routes/jobs.js`, `routes/organizations.js` (GET managers → requireOrgStaff), `index.js` (mount positions, jobs).
- **Client:** `pages/DashboardManager.jsx`, `pages/JobsPublic.jsx`, `pages/JobPublic.jsx`, `pages/Home.jsx`, `pages/Dashboard.jsx`, `App.jsx`.
