import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function InviteAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const token = searchParams.get('token');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Missing invite token');
      return;
    }
    // Optional: could call a "preview" endpoint to show invite email. For now we don't; user enters name/password or we use logged-in user.
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setSubmitting(true);
    try {
      const body = { token };
      if (!user) {
        if (!name.trim() || !password) {
          setError('Name and password are required');
          setSubmitting(false);
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          setSubmitting(false);
          return;
        }
        body.name = name.trim();
        body.password = password;
      }
      const res = await api.api('/invites/accept', {
        method: 'POST',
        body,
        auth: !!user,
      });
      api.setToken(res.token);
      if (refreshUser) await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to accept invite');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.error}>Invalid or missing invite link.</p>
          <a href="/">Go home</a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Accept manager invite</h1>
        <p style={styles.subtitle}>You’ve been invited to join an organization as a manager.</p>
        {user ? (
          <p style={styles.muted}>
            You’re signed in as <strong>{user.email}</strong>. Accepting will add you as a manager (pending approval).
          </p>
        ) : (
          <p style={styles.muted}>Enter your name and choose a password to create an account.</p>
        )}
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          {!user && (
            <>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
              />
              <input
                type="password"
                placeholder="Password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                style={styles.input}
              />
            </>
          )}
          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? 'Accepting…' : 'Accept invite'}
          </button>
        </form>
        <p style={styles.footer}>
          <a href="/login" style={styles.link}>Sign in</a> if you already have an account with the invite email.
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
    color: '#f1f5f9',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: '2rem',
    background: '#1e293b',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  title: { margin: '0 0 0.25rem', fontSize: '1.5rem' },
  subtitle: { color: '#94a3b8', margin: '0 0 1rem' },
  muted: { color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  error: { color: '#f87171', fontSize: '0.9rem' },
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
  link: { color: '#60a5fa' },
};
