import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function JobPublic() {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .api(`/jobs/${id}`, { auth: false })
      .then((res) => {
        setJob(res.job);
        setOrg(res.organization);
      })
      .catch((e) => setError(e.message || 'Job not found'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/" style={styles.logo}>BetterHire</Link>
        {org && (
          <Link to={`/jobs?org=${encodeURIComponent(org.slug)}`} style={styles.backLink}>
            ← All jobs at {org.name}
          </Link>
        )}
      </header>
      <main style={styles.main}>
        {loading && <p>Loading…</p>}
        {error && <div style={styles.error}>{error}</div>}
        {!loading && !error && job && (
          <>
            {org && <p style={styles.orgName}>{org.name}</p>}
            <h1 style={styles.title}>{job.title}</h1>
            <div style={styles.meta}>
              Posted {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : ''}
            </div>
            <div style={styles.body}>
              {job.description ? (
                <pre style={styles.description}>{job.description}</pre>
              ) : (
                <p style={styles.muted}>No description provided.</p>
              )}
            </div>
            <p style={styles.applyNote}>Apply for this position from the organization’s application flow (Phase 4+).</p>
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a', color: '#f1f5f9' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    borderBottom: '1px solid #334155',
  },
  logo: { fontWeight: 700, fontSize: '1.25rem', color: '#f1f5f9', textDecoration: 'none' },
  backLink: { color: '#94a3b8', fontSize: '0.9rem', textDecoration: 'none' },
  main: { padding: '2rem', maxWidth: 720, margin: '0 auto' },
  orgName: { color: '#94a3b8', margin: '0 0 0.25rem' },
  title: { margin: '0 0 0.5rem', fontSize: '1.75rem' },
  meta: { color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' },
  body: { marginBottom: '1.5rem' },
  description: { whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, lineHeight: 1.6 },
  muted: { color: '#94a3b8' },
  error: { color: '#f87171' },
  applyNote: { color: '#64748b', fontSize: '0.9rem' },
  applyBtn: { color: '#60a5fa', fontWeight: 600 },
};
