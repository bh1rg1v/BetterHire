import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../api/client';

const REGISTER_TYPES = [
  { value: 'applicant', label: 'Candidate (Applicant)' },
  { value: 'org', label: 'Organization (Admin)' },
];

export default function Register() {
  const [type, setType] = useState('applicant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [orgName, setOrgName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const { register } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const derivedSlug = type === 'org' && orgName.trim()
    ? orgName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : '';

  const derivedUsername = username.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

  useEffect(() => {
    if (type !== 'org' || derivedSlug.length < 2) {
      setSlugAvailable(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await api.api(`/organizations/check-slug?slug=${encodeURIComponent(derivedSlug)}`, { auth: false });
        if (!cancelled) setSlugAvailable(res.available);
      } catch {
        if (!cancelled) setSlugAvailable(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [type, derivedSlug]);

  useEffect(() => {
    if (derivedUsername.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await api.api(`/auth/check-username?username=${encodeURIComponent(derivedUsername)}`, { auth: false });
        if (!cancelled) setUsernameAvailable(res.available);
      } catch {
        if (!cancelled) setUsernameAvailable(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [derivedUsername]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (password.length < 8) {
      setErr('Password must be at least 8 characters');
      return;
    }
    if (derivedUsername.length < 3) {
      setErr('Username must be at least 3 characters');
      return;
    }
    if (type === 'org' && !orgName.trim()) {
      setErr('Organization name is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { type, email, password, name: name.trim(), username: derivedUsername };
      if (type === 'org') payload.orgName = orgName.trim();
      await register(payload);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setErr(e.message || 'Registration failed');
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
      maxWidth: '440px',
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
    select: {
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
    hint: { margin: 0, fontSize: '0.875rem', color: theme.colors.textMuted },
    code: {
      background: theme.colors.bg,
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      fontFamily: theme.fonts.mono,
    },
    available: { color: theme.colors.success, marginLeft: theme.spacing.xs },
    taken: { color: theme.colors.danger, marginLeft: theme.spacing.xs },
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>BetterHire</div>
        <h1 style={s.title}>Create Account</h1>
        <p style={s.subtitle}>Join us and start hiring smarter</p>
        <form onSubmit={handleSubmit} style={s.form}>
          {err && <div style={s.error}>{err}</div>}
          <div style={s.formGroup}>
            <label style={s.label}>Account Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={s.select}>
              {REGISTER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {type === 'org' && (
            <div style={s.formGroup}>
              <label style={s.label}>Organization Name</label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required={type === 'org'}
                style={s.input}
              />
              {derivedSlug.length >= 2 && (
                <p style={s.hint}>
                  Subdomain: <code style={s.code}>{derivedSlug}.yourdomain.com</code>
                  {slugAvailable === true && <span style={s.available}> Available</span>}
                  {slugAvailable === false && <span style={s.taken}> Taken</span>}
                </p>
              )}
            </div>
          )}
          <div style={s.formGroup}>
            <label style={s.label}>Username</label>
            <input
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={s.input}
            />
            {derivedUsername.length >= 3 && (
              <p style={s.hint}>
                <code style={s.code}>{derivedUsername}</code>
                {usernameAvailable === true && <span style={s.available}> Available</span>}
                {usernameAvailable === false && <span style={s.taken}> Taken</span>}
              </p>
            )}
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={s.input}
            />
          </div>
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
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              style={s.input}
            />
          </div>
          <button type="submit" disabled={submitting} style={s.button}>
            {submitting ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p style={s.footer}>
          Already have an account? <Link to="/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
