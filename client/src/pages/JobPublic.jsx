import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../api/client';

export default function JobPublic() {
  const { id } = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
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

  const s = {
    page: { minHeight: '100vh', background: theme.colors.bg, color: theme.colors.text },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.lg, borderBottom: `1px solid ${theme.colors.border}`, background: theme.colors.bgCard },
    logo: { fontWeight: 700, fontSize: '1.25rem', color: theme.colors.text, textDecoration: 'none' },
    backLink: { color: theme.colors.textMuted, fontSize: '0.9rem', textDecoration: 'none' },
    main: { padding: theme.spacing.xl, maxWidth: 1200, margin: '0 auto' },
    container: { display: 'flex', gap: theme.spacing.xl, alignItems: 'flex-start' },
    sidebar: { width: 250, flexShrink: 0 },
    content: { flex: 1, maxWidth: 720 },
    profileCard: { background: theme.colors.bgCard, padding: theme.spacing.lg, border: `1px solid ${theme.colors.border}`, marginBottom: theme.spacing.lg },
    profileTitle: { fontSize: '0.875rem', fontWeight: 600, color: theme.colors.textMuted, textTransform: 'uppercase', marginBottom: theme.spacing.md },
    profileLink: { display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: theme.colors.text },
    avatar: { width: 80, height: 80, borderRadius: '50%', background: theme.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600, marginBottom: theme.spacing.sm, color: '#fff' },
    profileName: { fontSize: '1rem', fontWeight: 500, textAlign: 'center' },
    orgName: { color: theme.colors.textMuted, margin: '0 0 0.25rem', fontSize: '0.875rem' },
    title: { margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 600 },
    meta: { color: theme.colors.textMuted, fontSize: '0.9rem', marginBottom: theme.spacing.xl },
    section: { marginBottom: theme.spacing.xl },
    sectionTitle: { fontSize: '1rem', fontWeight: 600, marginBottom: theme.spacing.md, color: theme.colors.text },
    list: { listStyle: 'disc', paddingLeft: theme.spacing.xl, lineHeight: 1.7, color: theme.colors.text },
    text: { margin: 0, lineHeight: 1.7, color: theme.colors.text },
    description: { whiteSpace: 'pre-wrap', fontFamily: theme.fonts.body, margin: 0, lineHeight: 1.7, color: theme.colors.text },
    muted: { color: theme.colors.textMuted },
    error: { color: theme.colors.danger, padding: theme.spacing.lg, background: `${theme.colors.danger}20`, border: `1px solid ${theme.colors.danger}` },
    applyNote: { marginTop: theme.spacing.xxl },
    applyBtn: { display: 'inline-block', padding: `${theme.spacing.md} ${theme.spacing.xl}`, background: theme.colors.primary, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '1rem', border: 'none', cursor: 'pointer' },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <Link to="/" style={s.logo}>BetterHire</Link>
        {org && (
          <Link to={`/jobs?org=${encodeURIComponent(org.slug)}`} style={s.backLink}>
            ← All jobs at {org.name}
          </Link>
        )}
      </header>
      <main style={s.main}>
        {loading && <p>Loading…</p>}
        {error && <div style={s.error}>{error}</div>}
        {!loading && !error && job && (
          <div style={s.container}>
            <aside style={s.sidebar}>
              {org && (
                <div style={s.profileCard}>
                  <h3 style={s.profileTitle}>Company</h3>
                  <Link to={`/jobs?org=${encodeURIComponent(org.slug)}`} style={s.profileLink}>
                    <div style={s.avatar}>{org.name.charAt(0).toUpperCase()}</div>
                    <div style={s.profileName}>{org.name}</div>
                  </Link>
                </div>
              )}
              {job.assignedManagerId && (
                <div style={s.profileCard}>
                  <h3 style={s.profileTitle}>Hiring Manager</h3>
                  <Link to={`/users/${job.assignedManagerId.username || job.assignedManagerId._id}`} style={s.profileLink}>
                    <div style={s.avatar}>{job.assignedManagerId.name?.charAt(0).toUpperCase() || 'M'}</div>
                    <div style={s.profileName}>{job.assignedManagerId.name || 'Manager'}</div>
                  </Link>
                </div>
              )}
            </aside>
            <div style={s.content}>
            {org && <p style={s.orgName}>{org.name}</p>}
            <h1 style={s.title}>{job.title}</h1>
            <div style={s.meta}>
              Posted {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : ''}
            </div>
            {job.description && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Description</h3>
                <pre style={s.description}>{job.description}</pre>
              </div>
            )}
            {job.companyOverview && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Company Overview</h3>
                <pre style={s.description}>{job.companyOverview}</pre>
              </div>
            )}
            {job.keyResponsibilities && job.keyResponsibilities.length > 0 && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Key Responsibilities</h3>
                <ul style={s.list}>
                  {job.keyResponsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
            {job.qualifications && job.qualifications.length > 0 && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Qualifications</h3>
                <ul style={s.list}>
                  {job.qualifications.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}
            {job.preferredQualifications && job.preferredQualifications.length > 0 && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Preferred Qualifications</h3>
                <ul style={s.list}>
                  {job.preferredQualifications.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Required Skills</h3>
                <ul style={s.list}>
                  {job.requiredSkills.map((skill, i) => <li key={i}>{skill}</li>)}
                </ul>
              </div>
            )}
            {job.preferredSkills && job.preferredSkills.length > 0 && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Preferred Skills</h3>
                <ul style={s.list}>
                  {job.preferredSkills.map((skill, i) => <li key={i}>{skill}</li>)}
                </ul>
              </div>
            )}
            {job.jobType && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Job Type</h3>
                <p style={s.text}>{job.jobType}</p>
              </div>
            )}
            {job.workEnvironment && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Work Environment</h3>
                <p style={s.text}>{job.workEnvironment}</p>
              </div>
            )}
            {job.compensation && job.compensation.length > 0 && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Compensation</h3>
                <ul style={s.list}>
                  {job.compensation.map((comp, i) => <li key={i}>{comp}</li>)}
                </ul>
              </div>
            )}
            <div style={s.applyNote}>
              {job.formId ? (
                <Link to={`/apply/form/${job.formId.formUrl}`} style={s.applyBtn}>Apply Now</Link>
              ) : (
                <span style={s.muted}>Not Accepting Applications Currently</span>
              )}
            </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
