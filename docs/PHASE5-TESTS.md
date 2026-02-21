# Phase 5 — Test Builder & Evaluation Engine

## Implemented

### Question bank
- **Question model:** `organizationId`, `type` (mcq | descriptive), `questionText`, `options` (for MCQ: [{ text, isCorrect }]), `maxScore`, `createdBy`.
- **APIs:** GET/POST /api/organizations/me/questions, GET/PATCH/DELETE /api/organizations/me/questions/:id. canPostJobs for create/update/delete. MCQ: exactly one option must have isCorrect.

### Create test
- **Test model:** `organizationId`, `title`, `description`, `durationMinutes`, `questions: [{ questionId, order, points }]`, `createdBy`.
- **APIs:** GET/POST /api/organizations/me/tests, GET/PATCH/DELETE /api/organizations/me/tests/:id. Questions array references question bank; points override per test.

### Assign test to position
- **Position.testId** (optional). Set via PATCH position.

### Timer system
- **TestAttempt:** `startedAt`, `submittedAt`, `durationMinutes` from test. Client can enforce timer; server stores startedAt/submittedAt for evaluation.

### Auto-evaluation (MCQ)
- On **POST /api/attempts/:id/submit**, server compares each MCQ answer (value = option index 0-based) to correct option; sums points into **autoScore**. If no descriptive questions, status set to **evaluated** and **totalScore** = autoScore.

### Manual evaluation (descriptive)
- If test has descriptive questions, after submit status is **submitted**. Staff **PATCH /api/organizations/me/attempts/:attemptId** with body `{ manualScores: [{ questionId, score, feedback? }] }`. Server sums manual scores, sets totalScore = autoScore + manual total, status = **evaluated**.

### Attempt flow
- **POST /api/attempts/start** — Body: `{ positionId }`. Applicant only. Creates TestAttempt (in_progress); returns attempt + test (questions without correct answers for MCQ).
- **GET /api/attempts/me?positionId=** — My attempt for position.
- **GET /api/attempts/:id** — Single attempt (applicant own or staff).
- **POST /api/attempts/:id/submit** — Body: `{ answers: [{ questionId, value }] }`. value = option index (number) for MCQ, string for descriptive. Runs auto-eval and optionally marks evaluated.

### Staff
- **GET /api/organizations/me/attempts** — List attempts (query ?positionId= optional).
- **GET /api/organizations/me/positions/:id/attempts** — Attempts for one position.
- **PATCH /api/organizations/me/attempts/:attemptId** — Submit manual scores for descriptive; sets totalScore and status evaluated.

### Client
- **Manager dashboard:** Position edit includes **Test** dropdown; **Attempts** link per position.
- **Position attempts** (/dashboard/positions/:id/attempts): List attempts, show status/autoScore/totalScore; “Evaluate” for submitted attempts (manual scores can be sent via API; full UI for entering scores per descriptive question can be added).
- **Take test:** Use POST /api/attempts/start for position, then render questions (MCQ as options, descriptive as textarea), timer from test.durationMinutes, POST /api/attempts/:id/submit with answers. Add a dedicated **TakeTest** page (e.g. /test/:positionId) that loads attempt or starts one, shows timer and questions, and submits.

## Files
- **Server:** models/Question.js, Test.js, TestAttempt.js; routes/questions.js, tests.js, attempts.js, orgAttempts.js; positions.js (testId, GET :id/attempts).
- **Client:** DashboardManager (forms, tests, formId/testId, Submissions/Attempts links), PositionSubmissions.jsx, PositionAttempts.jsx. Add Questions.jsx, Tests.jsx, TakeTest.jsx for full UI (questions bank, test builder, take test with timer).
