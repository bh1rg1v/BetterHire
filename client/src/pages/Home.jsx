import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.centered}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.h1}>BetterHire</h1>
        <p style={styles.tagline}>Modular Hiring &amp; Assessment Platform</p>
        <div style={styles.actions}>
          <Link to="/jobs" style={styles.secondaryBtn}>View jobs</Link>
          {user ? (
            <Link to="/dashboard" style={styles.primaryBtn}>Go to dashboard</Link>
          ) : (
            <>
              <Link to="/login" style={styles.primaryBtn}>Sign in</Link>
              <Link to="/register" style={styles.secondaryBtn}>Create account</Link>
            </>
          )}
        </div>
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
    background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
    color: '#f1f5f9',
  },
  centered: { padding: '2rem' },
  hero: { textAlign: 'center', padding: '2rem' },
  h1: { margin: '0 0 0.5rem', fontSize: '2.5rem' },
  tagline: { color: '#94a3b8', margin: '0 0 2rem' },
  actions: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' },
  primaryBtn: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    background: '#3b82f6',
    color: '#fff',
    borderRadius: 8,
    fontWeight: 600,
    textDecoration: 'none',
  },
  secondaryBtn: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    border: '1px solid #475569',
    color: '#e2e8f0',
    borderRadius: 8,
    textDecoration: 'none',
  },
};
