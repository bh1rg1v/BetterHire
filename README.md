# BetterHire

Multi-tenant hiring platform built for organizations to manage their entire recruitment process. Create job postings, build custom application forms, design screening tests, and track candidates through the hiring pipeline.

## Tech Stack

- MongoDB
- Express.js
- React
- Node.js

## Features

**For Organizations:**
- Public job board for each company
- Admin dashboard for team management
- Manager tools for creating roles and assessments

**For Candidates:**
- Profile creation
- Job applications
- Online assessments
- Application tracking

## Structure

```
BetterHire/
├── client/          # React frontend
├── server/          # Express API
└── README.md
```

## Setup

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Configure environment:
   - Copy `server/.env.example` to `server/.env`
   - Set `MONGO_URI` and `JWT_SECRET`

3. Start MongoDB (local or Atlas)

4. Run the application:
   ```bash
   npm run server  # API on port 5000
   npm run client  # Frontend on port 3000
   ```

5. Visit http://localhost:3000

## Documentation

Detailed implementation docs are in the `/docs` folder:

- Authentication & Roles
- Organization Management
- Job Positions
- Form Builder
- Test Builder & Evaluation
- Application Workflow
- Analytics & Reporting
