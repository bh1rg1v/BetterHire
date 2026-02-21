# Phase 2 — Organization Management Module

## Implemented

### Organization creation
- **Registration:** Already in Phase 1 — "Create account" with type **Organization** creates an org + first Admin. Organization **handle (slug)** is derived from org name (lowercase, hyphens, alphanumeric).
- **Unique handle validation:** `GET /api/organizations/check-slug?slug=acme` (public) returns `{ available: boolean, slug }`. Used on the Register page when creating an org (live "Available" / "Taken" under the org name field).

### Invite managers
- **POST /api/organizations/me/invites** (Admin only)  
  Body: `{ email [, name ] }`  
  Creates a pending invite with a unique token and 7-day expiry. Response includes `inviteLink` (e.g. `http://localhost:3000/invite/accept?token=...`).
- **GET /api/organizations/me/invites** (Admin only)  
  Query: `?status=pending|all`. Returns list of invites for the org.

### Accept invite
- **POST /api/invites/accept** (optional auth)  
  Body: `{ token [, name, password ] }`  
  - If **not logged in:** `name` and `password` required — creates new user as Manager with `pendingApproval: true`.  
  - If **logged in** (same email as invite): Links account to org as Manager, `pendingApproval: true`.  
  Marks invite as `accepted`. Returns `{ user, token, expiresIn }` so the client can log the user in.

### Approve / activate / deactivate manager
- **GET /api/organizations/me/managers** (Admin only)  
  List all managers for the org (id, name, email, isActive, pendingApproval, canPostJobs).
- **PATCH /api/organizations/me/managers/:userId** (Admin only)  
  Body: `{ approved?, isActive?, canPostJobs? }`  
  - **approved: true** → set `pendingApproval = false` (manager is approved).  
  - **isActive: false** → deactivate (user cannot log in; token is ignored in auth middleware).  
  - **isActive: true** → reactivate.  
  - **canPostJobs: true | false** → only Org Admin can set (used in Phase 3 for job posting).

### Key logic
- **Only Org Admin** can: invite managers, approve managers, activate/deactivate managers, assign "Can post jobs".
- **Manager model fields (User):** `isActive` (default true), `pendingApproval` (default false), `canPostJobs` (default false).
- **ManagerInvite model:** organizationId, email, invitedBy, token, expiresAt, status (pending | accepted | rejected).
- **Login:** Deactivated users receive 403 "Account is deactivated". Authenticate middleware does not attach `req.user` for inactive users.

### Dashboard
- **Org Admin dashboard** at `/dashboard/admin` (Admin only):  
  - Organization name and handle (slug).  
  - **Invite manager:** email input → create invite → show/copy invite link.  
  - **Pending invites:** list with copy-link.  
  - **Managers table:** name, email, status (Active / Pending approval / Deactivated), **Can post jobs** checkbox, actions: Approve, Deactivate, Activate.

### Client routes
- `/dashboard/admin` — Org Admin dashboard (ProtectedRoute, allowedRoles: ['Admin']).
- `/invite/accept?token=...` — Public page to accept manager invite (name + password if new user; if logged in with same email, just "Accept invite").

## Files touched
- **Server:** `models/User.js` (isActive, pendingApproval, canPostJobs), `models/ManagerInvite.js`, `middleware/auth.js` (requireOrgAdmin, reject inactive in authenticate + login), `routes/auth.js` (login reject deactivated), `routes/organizations.js` (check-slug, me/invites, me/managers), `routes/invites.js` (accept), `index.js` (mount invites).
- **Client:** `pages/DashboardAdmin.jsx`, `pages/InviteAccept.jsx`, `pages/Register.jsx` (slug validation), `App.jsx` (routes for dashboard/admin, invite/accept).
