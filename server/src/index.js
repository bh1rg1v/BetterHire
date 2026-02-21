/**
 * BetterHire API — Entry point
 * Multi-tenant hiring & assessment platform
 */

const express = require('express');
const config = require('./config');
const { connect: connectDb } = require('./db/connect');
const { authenticate } = require('./middleware/auth');
const { apiLimiter, authLimiter } = require('./middleware/rateLimit');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const organizationRoutes = require('./routes/organizations');
const inviteRoutes = require('./routes/invites');
const positionRoutes = require('./routes/positions');
const formRoutes = require('./routes/forms');
const questionRoutes = require('./routes/questions');
const testRoutes = require('./routes/tests');
const attemptRoutes = require('./routes/attempts');
const orgAttemptsRoutes = require('./routes/orgAttempts');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const analyticsRoutes = require('./routes/analytics');

const app = express();

app.use(express.json());

// Phase 9: rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check (no DB required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'betterhire-api' });
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// User routes — authenticate optional for public profile, required for /me and PATCH /me
app.use('/api/users', authenticate, userRoutes);
app.use('/api/organizations', authenticate, organizationRoutes);
app.use('/api/organizations/me/positions', authenticate, positionRoutes);
app.use('/api/organizations/me/forms', authenticate, formRoutes);
app.use('/api/organizations/me/questions', authenticate, questionRoutes);
app.use('/api/organizations/me/tests', authenticate, testRoutes);
app.use('/api/organizations/me/attempts', authenticate, orgAttemptsRoutes);
app.use('/api/attempts', authenticate, attemptRoutes);
app.use('/api/invites', authenticate, inviteRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', authenticate, applicationRoutes);
app.use('/api/organizations/me/analytics', authenticate, analyticsRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

async function start() {
  await connectDb();
  console.log('MongoDB connected');
  app.listen(config.port, () => {
    console.log(`BetterHire API running on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
