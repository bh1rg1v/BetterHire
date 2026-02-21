# BetterHire - Modular Hiring & Assessment Platform

A **multi-tenant hiring management platform** where organizations can create accounts, manage HR/managers, post job openings, attach custom application forms and screening tests, and manage the full hiring lifecycle from a centralized system.

## Stack

- **M**ongoDB - data store
- **E**xpress - API server (Node.js)
- **R**eact - frontend (public + dashboards)
- **N**ode.js - runtime

*(If you prefer Angular instead of React - MEAN stack - we can switch the frontend.)*

## Product Overview

### Per organization

- **Public hiring dashboard** - candidates view active jobs and apply
- **Admin dashboard** - manage managers and permissions
- **Manager dashboard** - create job roles, forms, and assessments

### Candidates (applicants)

- Create profiles
- Apply to jobs
- Complete assigned tests
- Track application progress

## Project structure

```
BetterHire/
├── client/          # React frontend (public site + dashboards)
├── server/          # Node.js + Express API
├── README.md
└── (phase-specific docs as we go)
```

## Development

1. **Install:** From repo root run `npm run install:all` (or `npm install` in `server/` and `client/`).
2. **Env:** Copy `server/.env.example` to `server/.env` and set `MONGO_URI`, `JWT_SECRET`.
3. **MongoDB:** Ensure MongoDB is running (e.g. local or Atlas).
4. **Run API:** `npm run server` (from root) or `cd server && npm run dev` - port 5000.
5. **Run client:** `npm run client` (from root) or `cd client && npm run dev` - port 3000.
6. Open http://localhost:3000 - register as Applicant or Organization, then sign in.

## Phases

- **Phase 1 - Authentication & Role System** See [docs/PHASE1-AUTH.md](docs/PHASE1-AUTH.md).
- **Phase 2 - Organization Management** See [docs/PHASE2-ORG-MANAGEMENT.md](docs/PHASE2-ORG-MANAGEMENT.md) (org creation, unique handle, invite/approve managers, activate/deactivate, Can post jobs, Org Admin dashboard).
- **Phase 3 - Job Position Management** See [docs/PHASE3-JOB-POSITIONS.md](docs/PHASE3-JOB-POSITIONS.md) (create/edit position, draft/publish/close, assign manager, public job listing, Manager dashboard).
- **Phase 4 - Form Builder** See [docs/PHASE4-FORMS.md](docs/PHASE4-FORMS.md) (dynamic form schema JSON, field types, required validation, form submission storage, link form to position, Form builder UI, Apply flow).
- **Phase 5 - Test Builder & Evaluation** See [docs/PHASE5-TESTS.md](docs/PHASE5-TESTS.md) (question bank, create test, assign test to position, timer, auto-evaluation MCQ, manual evaluation descriptive, attempt APIs and staff evaluation).
- **Phases 6-9** See [docs/PHASE6-9-SUMMARY.md](docs/PHASE6-9-SUMMARY.md): Applicant dashboard & Take Test (6), Application status & workflow & notifications (7), Analytics & funnel & export CSV (8), Rate limiting & audit logs (9).
- Further phases will be added as we go.
