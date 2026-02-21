import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

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

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Sign in</h1>
        <p style={styles.subtitle}>BetterHire</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          {err && <div style={styles.error}>{err}</div>}
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={styles.input}
          />
          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={styles.footer}>
          Don’t have an account? <Link to="/register">Register</Link>
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
    maxWidth: 380,
    padding: '2rem',
    background: '#1e293b',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  title: { margin: '0 0 0.25rem', color: '#f1f5f9', fontSize: '1.5rem' },
  subtitle: { margin: '0 0 1.5rem', color: '#94a3b8', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
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
};
