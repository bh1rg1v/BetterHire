# BetterHire Client

React frontend for the BetterHire platform. Includes public job boards, candidate application flows, and organization dashboards.

## Tech

- React 18
- React Router v6
- Vite (build tool)

## Structure

```
src/
├── api/           # API client and request handlers
├── components/    # Reusable UI components
│   └── layout/    # Layout components (Sidebar, DashboardLayout)
├── context/       # React Context providers (Auth, Theme, Org)
├── pages/         # Page components (routes)
├── styles/        # Design system and global styles
├── constants/     # App constants and config
├── App.jsx        # Main app component with routes
└── main.jsx       # Entry point
```

## Development

```bash
npm install
npm run dev
```

Runs on http://localhost:3000

## Build

```bash
npm run build
```

Output goes to `dist/` folder.

## Environment

The client connects to the API server. Update the API base URL in `src/api/client.js` if needed.

Default: `http://localhost:5000/api`

## Key Features

**Public Pages:**
- Organization job boards (`/:orgHandle/jobs`)
- Job details and application forms
- Test taking interface

**Dashboards:**
- Admin: Organization management, team permissions
- Manager: Job postings, forms, tests, questions, analytics
- Applicant: Profile, applications, test history

**Shared:**
- Dark mode theme
- Organization context switching
- Protected routes with role-based access
