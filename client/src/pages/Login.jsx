import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (e) {
      setErr(e.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  const s = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
      background: theme.colors.bg,
      fontFamily: theme.fonts.body,
    },
    card: {
      width: '100%',
      maxWidth: '420px',
      padding: theme.spacing.xxl,
      background: theme.colors.bgCard,
      border: `1px solid ${theme.colors.border}`,
    },
    logo: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: theme.colors.primary,
      marginBottom: theme.spacing.xl,
      textAlign: 'center',
    },
    title: {
      margin: `0 0 ${theme.spacing.sm}`,
      color: theme.colors.text,
      fontSize: '1.75rem',
      fontWeight: 600,
      textAlign: 'center',
    },
    subtitle: {
      margin: `0 0 ${theme.spacing.xl}`,
      color: theme.colors.textMuted,
      fontSize: '0.95rem',
      textAlign: 'center',
    },
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.lg },
    formGroup: { display: 'flex', flexDirection: 'column', gap: theme.spacing.sm },
    label: { color: theme.colors.textMuted, fontSize: '0.875rem', fontWeight: 500 },
    error: {
      color: theme.colors.danger,
      fontSize: '0.875rem',
      padding: theme.spacing.md,
      background: `${theme.colors.danger}20`,
      border: `1px solid ${theme.colors.danger}`,
    },
    input: {
      padding: theme.spacing.md,
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.bg,
      color: theme.colors.text,
      fontSize: '1rem',
      fontFamily: theme.fonts.body,
    },
    button: {
      padding: theme.spacing.md,
      border: 'none',
      background: theme.colors.primary,
      color: '#fff',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: theme.fonts.body,
      transition: 'all 0.2s',
    },
    footer: {
      marginTop: theme.spacing.xl,
      color: theme.colors.textMuted,
      fontSize: '0.9rem',
      textAlign: 'center',
    },
    link: { color: theme.colors.primary, fontWeight: 500 },
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>BetterHire</div>
        <h1 style={s.title}>Sign In</h1>
        <p style={s.subtitle}>Welcome back! Please enter your credentials</p>
        <form onSubmit={handleSubmit} style={s.form}>
          {err && <div style={s.error}>{err}</div>}
          <div style={s.formGroup}>
            <label style={s.label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={s.input}
            />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={s.input}
            />
          </div>
          <button type="submit" disabled={submitting} style={s.button}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={s.footer}>
          Don't have an account? <Link to="/register" style={s.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
