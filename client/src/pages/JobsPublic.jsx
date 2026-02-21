import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as api from '../api/client';

export default function JobsPublic() {
  const [searchParams] = useSearchParams();
  const orgSlug = searchParams.get('org') || '';
  const [data, setData] = useState({ organization: null, jobs: [] });
  const [loading, setLoading] = useState(!!orgSlug);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orgSlug) {
      setLoading(false);
      return;
    }
    setError('');
    setLoading(true);
    api
      .api(`/jobs?org=${encodeURIComponent(orgSlug)}`, { auth: false })
      .then((res) => {
        setData({ organization: res.organization, jobs: res.jobs || [] });
      })
      .catch((e) => setError(e.message || 'Failed to load jobs'))
      .finally(() => setLoading(false));
  }, [orgSlug]);

  if (!orgSlug) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>View jobs</h1>
          <p style={styles.subtitle}>Enter the organization handle to see open positions.</p>
          <form
            style={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              const slug = e.target.org.value?.trim()?.toLowerCase();
              if (slug) window.location.href = `/jobs?org=${encodeURIComponent(slug)}`;
            }}
          >
            <input
              name="org"
              type="text"
              placeholder="e.g. acme-corp"
              style={styles.input}
              defaultValue={orgSlug}
            />
            <button type="submit" style={styles.button}>View jobs</button>
          </form>
          <p style={styles.footer}>
            <Link to="/" style={styles.link}>Back to home</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/" style={styles.logo}>BetterHire</Link>
      </header>
      <main style={styles.main}>
        {loading && <p>Loading…</p>}
        {error && <div style={styles.error}>{error}</div>}
        {!loading && !error && data.organization && (
          <>
            <h1 style={styles.h1}>Open positions at {data.organization.name}</h1>
            <p style={styles.muted}>Handle: {data.organization.slug}</p>
            {data.jobs.length === 0 ? (
              <p style={styles.muted}>No open positions right now.</p>
            ) : (
              <ul style={styles.list}>
                {data.jobs.map((job) => (
                  <li key={job._id} style={styles.listItem}>
                    <Link to={`/job/${job._id}`} style={styles.jobLink}>
                      {job.title}
                    </Link>
                    {job.description && (
                      <p style={styles.jobDesc}>{job.description.slice(0, 160)}{job.description.length > 160 ? '…' : ''}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a', color: '#f1f5f9' },
  header: { padding: '1rem 2rem', borderBottom: '1px solid #334155' },
  logo: { fontWeight: 700, fontSize: '1.25rem', color: '#f1f5f9', textDecoration: 'none' },
  main: { padding: '2rem', maxWidth: 720, margin: '0 auto' },
  card: { maxWidth: 400, margin: '2rem auto', padding: '2rem', textAlign: 'center' },
  title: { margin: '0 0 0.5rem' },
  subtitle: { color: '#94a3b8', margin: '0 0 1rem' },
  form: { display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' },
  input: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #334155',
    borderRadius: 8,
    background: '#1e293b',
    color: '#f1f5f9',
    minWidth: 180,
  },
  button: { padding: '0.5rem 1rem', background: '#3b82f6', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' },
  footer: { marginTop: '1.5rem' }, link: { color: '#60a5fa' },
  h1: { margin: '0 0 0.5rem' },
  muted: { color: '#94a3b8', margin: '0 0 1.5rem' },
  error: { color: '#f87171', marginBottom: '1rem' },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #334155' },
  jobLink: { fontSize: '1.1rem', fontWeight: 600, color: '#60a5fa', textDecoration: 'none' },
  jobDesc: { margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.95rem' },
};
