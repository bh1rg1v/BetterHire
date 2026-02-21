import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

const REGISTER_TYPES = [
  { value: 'applicant', label: 'Candidate (Applicant)' },
  { value: 'org', label: 'Organization (Create account + first Admin)' },
];

export default function Register() {
  const [type, setType] = useState('applicant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [slugAvailable, setSlugAvailable] = useState(null); // null | true | false
  const { register } = useAuth();
  const navigate = useNavigate();

  const derivedSlug = type === 'org' && orgName.trim()
    ? orgName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : '';

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

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (password.length < 8) {
      setErr('Password must be at least 8 characters');
      return;
    }
    if (type === 'org' && !orgName.trim()) {
      setErr('Organization name is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { type, email, password, name: name.trim() };
      if (type === 'org') payload.orgName = orgName.trim();
      await register(payload);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setErr(e.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create account</h1>
        <p style={styles.subtitle}>BetterHire</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          {err && <div style={styles.error}>{err}</div>}
          <label style={styles.label}>Register as</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={styles.input}
          >
            {REGISTER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {type === 'org' && (
            <>
              <input
                type="text"
                placeholder="Organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required={type === 'org'}
                style={styles.input}
              />
              {derivedSlug.length >= 2 && (
                <p style={styles.slugHint}>
                  Handle: <code style={styles.code}>{derivedSlug}</code>
                  {slugAvailable === true && <span style={styles.available}> — Available</span>}
                  {slugAvailable === false && <span style={styles.taken}> — Taken</span>}
                </p>
              )}
            </>
          )}
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={styles.input}
          />
          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p style={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: '2rem',
    background: '#1e293b',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  title: { margin: '0 0 0.25rem', color: '#f1f5f9', fontSize: '1.5rem' },
  subtitle: { margin: '0 0 1.5rem', color: '#94a3b8', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  label: { color: '#94a3b8', fontSize: '0.875rem' },
  error: { color: '#f87171', fontSize: '0.875rem' },
  input: {
    padding: '0.75rem 1rem',
    border: '1px solid #334155',
    borderRadius: 8,
    background: '#0f172a',
    color: '#f1f5f9',
    fontSize: '1rem',
  },
  button: {
    padding: '0.75rem',
    border: 'none',
    borderRadius: 8,
    background: '#3b82f6',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  footer: { marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.9rem' },
  slugHint: { margin: 0, fontSize: '0.875rem', color: '#94a3b8' },
  code: { background: '#0f172a', padding: '0.1rem 0.3rem', borderRadius: 4 },
  available: { color: '#86efac' },
  taken: { color: '#f87171' },
};
