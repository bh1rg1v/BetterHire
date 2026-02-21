# Phase 1 — Authentication & Role System

## Implemented

### User model
- **Fields:** `email`, `passwordHash`, `name`, `role`, `organizationId`, `profile`, `timestamps`
- **Profile (optional):** `headline`, `bio`, `phone`, `resumeUrl`, `visibility` (`private` | `public`)

### Role enum
- **Admin** — organization-level admin (full control within org)
- **Manager** — org manager (jobs, forms, assessments)
- **Applicant** — candidate (apply, tests, track progress)

Org-scoped roles (Admin, Manager) require `organizationId`. Applicants have `organizationId: null`.

### Authentication (JWT)
- **Register:** `POST /api/auth/register`
  - Body: `{ type: 'org' | 'applicant', email, password, name [, orgName ] }`
  - `type: 'org'` creates Organization + first Admin (requires `orgName`)
  - `type: 'applicant'` creates Applicant
- **Login:** `POST /api/auth/login` — `{ email, password }` → `{ user, token, expiresIn }`
- **Me:** `GET /api/auth/me` — current user (Bearer token required)

Token: `Authorization: Bearer <token>`. Env: `JWT_SECRET`, `JWT_EXPIRES_IN`.

### RBAC middleware (server)
- `authenticate` — optional: attach `req.user` if valid JWT
- `requireAuth` — 401 if not authenticated
- `requireRole(['Admin', 'Manager'])` — 403 if role not in list
- `requireOrgStaff` — requires Admin/Manager and sets `req.organizationId` for tenant scope

### Tenant isolation
- **Middleware:** `requireSameOrg(resourceOrgIdGetter)` and `withOrgParam('orgId')` in `server/src/middleware/tenant.js`
- All org-scoped resources must be checked against `req.organizationId` (use in later phases for jobs, forms, etc.)

### Public profiles
- **PATCH /api/users/me** — update own profile (name, profile fields). Applicants can set `profile.visibility`.
- **GET /api/users/:id/public** — public profile for applicants only when `profile.visibility === 'public'`. Returns `name`, `headline`, `bio`, `resumeUrl`.

### Multi-tenant org model
- **Organization:** `name`, `slug` (unique), `settings` (flexible)
- **GET /api/organizations/me** — current user’s organization (Admin/Manager only)

### Client (React)
- **Auth context:** `user`, `login`, `register`, `logout`, `refreshUser`, `isAdmin`, `isManager`, `isApplicant`, `isOrgStaff`
- **ProtectedRoute:** requires auth; optional `allowedRoles`
- **Pages:** Home, Login, Register, Dashboard (role-aware), Profile (edit + visibility for applicants)
- Token stored in `localStorage`; API client sends `Authorization: Bearer`

## Security notes
- Passwords hashed with bcrypt (cost 12)
- JWT secret must be set in production (`JWT_SECRET`)
- Data isolation: always scope queries by `organizationId` for Admin/Manager resources
