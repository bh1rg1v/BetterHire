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
      .api(`/jobs/url/${id}`, { auth: false })
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
          <div style={styles.container}>
            <aside style={styles.sidebar}>
              {org && (
                <div style={styles.profileCard}>
                  <h3 style={styles.profileTitle}>Company</h3>
                  <Link to={`/jobs?org=${encodeURIComponent(org.slug)}`} style={styles.profileLink}>
                    <div style={styles.avatar}>{org.name.charAt(0).toUpperCase()}</div>
                    <div style={styles.profileName}>{org.name}</div>
                  </Link>
                </div>
              )}
              {job.assignedManagerId && (
                <div style={styles.profileCard}>
                  <h3 style={styles.profileTitle}>Hiring Manager</h3>
                  <Link to={`/users/${job.assignedManagerId.username || job.assignedManagerId._id}`} style={styles.profileLink}>
                    <div style={styles.avatar}>{job.assignedManagerId.name?.charAt(0).toUpperCase() || 'M'}</div>
                    <div style={styles.profileName}>{job.assignedManagerId.name || 'Manager'}</div>
                  </Link>
                </div>
              )}
            </aside>
            <div style={styles.content}>
            {org && <p style={styles.orgName}>{org.name}</p>}
            <h1 style={styles.title}>{job.title}</h1>
            <div style={styles.meta}>
              Posted {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : ''}
            </div>
            {job.description && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Description</h3>
                <pre style={styles.description}>{job.description}</pre>
              </div>
            )}
            {job.companyOverview && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Company Overview</h3>
                <pre style={styles.description}>{job.companyOverview}</pre>
              </div>
            )}
            {job.keyResponsibilities && job.keyResponsibilities.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Key Responsibilities</h3>
                <ul style={styles.list}>
                  {job.keyResponsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
            {job.qualifications && job.qualifications.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Qualifications</h3>
                <ul style={styles.list}>
                  {job.qualifications.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}
            {job.preferredQualifications && job.preferredQualifications.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Preferred Qualifications</h3>
                <ul style={styles.list}>
                  {job.preferredQualifications.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Required Skills</h3>
                <ul style={styles.list}>
                  {job.requiredSkills.map((skill, i) => <li key={i}>{skill}</li>)}
                </ul>
              </div>
            )}
            {job.preferredSkills && job.preferredSkills.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Preferred Skills</h3>
                <ul style={styles.list}>
                  {job.preferredSkills.map((skill, i) => <li key={i}>{skill}</li>)}
                </ul>
              </div>
            )}
            {job.jobType && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Job Type</h3>
                <p style={styles.text}>{job.jobType}</p>
              </div>
            )}
            {job.workEnvironment && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Work Environment</h3>
                <p style={styles.text}>{job.workEnvironment}</p>
              </div>
            )}
            {job.compensation && job.compensation.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Compensation</h3>
                <ul style={styles.list}>
                  {job.compensation.map((comp, i) => <li key={i}>{comp}</li>)}
                </ul>
              </div>
            )}
            <p style={styles.applyNote}>
              {job.formId ? (
                <Link to={`/apply/form/${job.formId.formUrl}`} style={styles.applyBtn}>Apply Now</Link>
              ) : (
                <span style={styles.muted}>Not Accepting Applications</span>
              )}
            </p>
            </div>
          </div>
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
  main: { padding: '2rem', maxWidth: 1200, margin: '0 auto' },
  container: { display: 'flex', gap: '2rem', alignItems: 'flex-start' },
  sidebar: { width: 250, flexShrink: 0 },
  content: { flex: 1, maxWidth: 720 },
  profileCard: { background: '#1e293b', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' },
  profileTitle: { fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' },
  profileLink: { display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: '#f1f5f9' },
  avatar: { width: 80, height: 80, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600, marginBottom: '0.75rem' },
  profileName: { fontSize: '1rem', fontWeight: 500, textAlign: 'center' },
  orgName: { color: '#94a3b8', margin: '0 0 0.25rem' },
  title: { margin: '0 0 0.5rem', fontSize: '1.75rem' },
  meta: { color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' },
  section: { marginBottom: '1.5rem' },
  sectionTitle: { fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#94a3b8', textTransform: 'uppercase' },
  list: { listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: 1.6 },
  text: { margin: 0, lineHeight: 1.6 },
  description: { whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, lineHeight: 1.6 },
  muted: { color: '#94a3b8' },
  error: { color: '#f87171' },
  applyNote: { color: '#64748b', fontSize: '0.9rem' },
  applyBtn: { color: '#60a5fa', fontWeight: 600 },
};
