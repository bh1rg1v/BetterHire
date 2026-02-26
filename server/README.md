# BetterHire Server

Express API for the BetterHire multi-tenant hiring platform.

## Tech

- Node.js 18+
- Express 4
- MongoDB with Mongoose
- JWT authentication
- bcryptjs for password hashing

## Structure

```
src/
├── models/        # Mongoose schemas
├── routes/        # API endpoints
├── middleware/    # Auth, validation, error handling
├── services/      # Business logic
├── db/            # Database connection
├── scripts/       # Utility scripts
├── constants/     # App constants
├── config.js      # Configuration loader
└── index.js       # Server entry point
```

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure environment variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/betterhire
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=7d
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start MongoDB (local or use MongoDB Atlas)

5. Run the server:
   ```bash
   npm run dev    # Development with auto-reload
   npm start      # Production
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/me` - Get user's organization
- `PATCH /api/organizations/me` - Update organization
- `POST /api/organizations/me/invite` - Invite manager
- `GET /api/organizations/me/invites` - List invites
- `POST /api/organizations/invites/:id/accept` - Accept invite

### Forms
- `GET /api/organizations/me/forms` - List forms
- `POST /api/organizations/me/forms` - Create form
- `GET /api/organizations/me/forms/:id` - Get form
- `PATCH /api/organizations/me/forms/:id` - Update form
- `DELETE /api/organizations/me/forms/:id` - Delete form

### Tests
- `GET /api/organizations/me/tests` - List tests
- `POST /api/organizations/me/tests` - Create test
- `GET /api/organizations/me/tests/:id` - Get test
- `PATCH /api/organizations/me/tests/:id` - Update test
- `GET /api/tests/url/:testUrl` - Get test by URL (public)
- `POST /api/tests/url/:testUrl/submit` - Submit test attempt

### Questions
- `GET /api/organizations/me/questions` - List questions
- `POST /api/organizations/me/questions` - Create question
- `PATCH /api/organizations/me/questions/:id` - Update question
- `DELETE /api/organizations/me/questions/:id` - Delete question

### Form Submissions
- `GET /api/organizations/me/submissions` - List submissions
- `GET /api/organizations/me/submissions/:id` - Get submission
- `PATCH /api/organizations/me/submissions/:id/test-link` - Assign test

### Analytics
- `GET /api/organizations/me/analytics` - Get analytics data

## Models

- **User** - Applicants, Managers, Admins
- **Organization** - Company accounts
- **Invite** - Manager invitations
- **Form** - Custom application forms
- **FormSubmission** - Applicant submissions
- **Test** - Assessment tests
- **Question** - Question bank (MCQ, fill-in-blank, descriptive)
- **TestAttempt** - Test submissions and scores

## Authentication

Uses JWT tokens. Include in requests:
```
Authorization: Bearer <token>
```

Roles: `Applicant`, `Manager`, `Admin`, `SuperAdmin`

## Utilities

- `clearDb.js` - Clear all database collections
- `deleteInvites.js` - Remove pending invites
- `src/scripts/importQuestions.js` - Bulk import questions from CSV

## Notes

- Managers need `canPostJobs: true` to create forms/tests
- Tests support email-based access control
- Auto-scoring for MCQ, manual review for descriptive questions
- Max attempts enforced per test/submission
