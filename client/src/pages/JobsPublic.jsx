import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

export default function JobsPublic() {
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const { user } = useAuth();
  const orgSlug = searchParams.get('org') || '';
  const [data, setData] = useState({ organization: null, jobs: [] });
  const [loading, setLoading] = useState(!!orgSlug);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ organizations: [], jobs: [] });
  const [allJobs, setAllJobs] = useState([]);

  useEffect(() => {
    if (!orgSlug) {
      setLoading(true);
      api.api('/jobs/all', { auth: false })
        .then(res => setAllJobs(res.jobs || []))
        .catch(() => setAllJobs([]))
        .finally(() => setLoading(false));
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

  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults({ organizations: [], jobs: [] });
      return;
    }
    const timer = setTimeout(() => {
      api.api(`/jobs/search?q=${encodeURIComponent(searchQuery)}`, { auth: false })
        .then(res => setSearchResults({ organizations: res.organizations || [], jobs: res.jobs || [] }))
        .catch(() => setSearchResults({ organizations: [], jobs: [] }));
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navItems = user?.role === 'SuperAdmin'
    ? [{ label: 'Dashboard', path: '/dashboard/superadmin' }, { label: 'Users', path: '/dashboard/superadmin/users' }, { label: 'Organizations', path: '/dashboard/superadmin/organizations' }, { label: 'Profile', path: '/dashboard/profile' }]
    : user?.role === 'Admin' && user?.organizationId?.slug
    ? [{ label: 'Dashboard', path: `/${user.organizationId.slug}/admin/dashboard` }, { label: 'Forms', path: `/${user.organizationId.slug}/admin/forms` }, { label: 'Questions', path: `/${user.organizationId.slug}/admin/questions` }, { label: 'Tests', path: `/${user.organizationId.slug}/admin/tests` }, { label: 'Analytics', path: `/${user.organizationId.slug}/admin/analytics` }, { label: 'Profile', path: '/dashboard/profile' }]
    : user?.canPostJobs && user?.organizationId?.slug
    ? [{ label: 'Dashboard', path: `/${user.organizationId.slug}/manager/dashboard` }, { label: 'Forms', path: `/${user.organizationId.slug}/manager/forms` }, { label: 'Questions', path: `/${user.organizationId.slug}/manager/questions` }, { label: 'Tests', path: `/${user.organizationId.slug}/manager/tests` }, { label: 'Analytics', path: `/${user.organizationId.slug}/manager/analytics` }, { label: 'Profile', path: '/dashboard/profile' }]
    : user?.role === 'Applicant'
    ? [{ label: 'Dashboard', path: '/dashboard/applicant' }, { label: 'My Applications', path: '/dashboard/applicant' }, { label: 'Browse Jobs', path: '/jobs' }, { label: 'Profile', path: '/dashboard/profile' }]
    : user ? [{ label: 'Profile', path: '/dashboard/profile' }] : [];

  const s = {
    page: { minHeight: '100vh', background: theme.colors.bg, color: theme.colors.text },
    header: { padding: theme.spacing.lg, borderBottom: `1px solid ${theme.colors.border}`, background: theme.colors.bgCard },
    logo: { fontWeight: 700, fontSize: '1.25rem', color: theme.colors.text, textDecoration: 'none' },
    card: { maxWidth: 400, margin: `${theme.spacing.xxl} auto`, padding: theme.spacing.xxl, textAlign: 'center' },
    title: { margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 600 },
    subtitle: { color: theme.colors.textMuted, margin: '0 0 1rem' },
    form: { display: 'flex', gap: theme.spacing.sm, justifyContent: 'center', flexWrap: 'wrap' },
    input: { padding: theme.spacing.md, border: `1px solid ${theme.colors.border}`, background: theme.colors.bg, color: theme.colors.text, minWidth: 180, fontFamily: theme.fonts.body },
    button: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500 },
    footer: { marginTop: theme.spacing.xl },
    link: { color: theme.colors.primary, textDecoration: 'none' },
    h1: { margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 600 },
    muted: { color: theme.colors.textMuted, margin: `0 0 ${theme.spacing.xl}` },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.lg, background: `${theme.colors.danger}20`, border: `1px solid ${theme.colors.danger}` },
    list: { listStyle: 'none', padding: 0, margin: 0 },
    listItem: { marginBottom: theme.spacing.xl, paddingBottom: theme.spacing.xl, borderBottom: `1px solid ${theme.colors.border}` },
    jobLink: { fontSize: '1.25rem', fontWeight: 600, color: theme.colors.primary, textDecoration: 'none' },
    jobDesc: { margin: '0.5rem 0 0', color: theme.colors.textMuted, fontSize: '0.95rem', lineHeight: 1.6 },
    searchContainer: { position: 'relative', width: '100%', maxWidth: '300px' },
    searchResults: { position: 'absolute', top: '100%', left: 0, right: 0, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, maxHeight: '200px', overflowY: 'auto', zIndex: 10 },
    searchResult: { padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`, cursor: 'pointer', color: theme.colors.text },
  };

  if (!orgSlug) {
    return (
      <DashboardLayout sidebar={user ? <Sidebar items={navItems} /> : null}>
        <div style={s.card}>
          <h1 style={s.title}>Browse Jobs</h1>
          <form
            style={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              const slug = e.target.org.value?.trim()?.toLowerCase();
              if (slug) window.location.href = `/jobs?org=${encodeURIComponent(slug)}`;
            }}
          >
            <div style={s.searchContainer}>
              <input
                name="org"
                type="text"
                placeholder="Search organizations or job titles..."
                style={s.input}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {(searchResults.organizations.length > 0 || searchResults.jobs.length > 0) && (
                <div style={s.searchResults}>
                  {searchResults.organizations.map(org => (
                    <div
                      key={`org-${org.slug}`}
                      style={s.searchResult}
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults({ organizations: [], jobs: [] });
                        window.location.href = `/jobs?org=${encodeURIComponent(org.slug)}`;
                      }}
                    >
                      <strong>{org.name}</strong> <span style={{ color: theme.colors.textMuted, fontSize: '0.8rem' }}>- Organization</span>
                    </div>
                  ))}
                  {searchResults.jobs.map(job => (
                    <div
                      key={`job-${job._id}`}
                      style={s.searchResult}
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults({ organizations: [], jobs: [] });
                        window.location.href = `/job/${job.positionUrl || job._id}`;
                      }}
                    >
                      <strong>{job.title}</strong> <span style={{ color: theme.colors.textMuted, fontSize: '0.8rem' }}>at {job.organizationId.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>
        {loading && <p>Loading…</p>}
        {!loading && allJobs.length > 0 && (
          <>
            <h2 style={{ ...s.h1, fontSize: '1.5rem', marginTop: theme.spacing.xl }}>All Open Positions ({allJobs.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: theme.spacing.lg, marginTop: theme.spacing.lg }}>
              {allJobs.map((job) => (
                <div key={job._id} style={{ 
                  background: theme.colors.bgCard, 
                  padding: theme.spacing.lg, 
                  border: `1px solid ${theme.colors.border}`, 
                  height: '300px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ marginBottom: theme.spacing.sm, fontSize: '0.875rem', color: theme.colors.textMuted, fontWeight: 500 }}>
                    {job.organization.name}
                  </div>
                  <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 600, color: theme.colors.text }}>{job.title}</h3>
                  <p style={{ margin: '0 0 1rem', color: theme.colors.textMuted, fontSize: '0.875rem', lineHeight: 1.5, flex: 1, overflow: 'hidden' }}>
                    {job.description ? (job.description.slice(0, 120) + (job.description.length > 120 ? '...' : '')) : 'No description available'}
                  </p>
                  <Link 
                    to={`/job/${job.positionUrl || job._id}`} 
                    style={{ 
                      display: 'inline-block',
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`, 
                      background: theme.colors.primary, 
                      color: '#fff', 
                      textDecoration: 'none', 
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={user ? <Sidebar items={navItems} /> : null}>
      <div style={s.header}>
        <span></span>
      </div>
      {loading && <p>Loading…</p>}
      {error && <div style={s.error}>{error}</div>}
      {!loading && !error && data.organization && (
        <>
          <h1 style={s.h1}>Open Positions</h1>
          <p style={s.muted}>Found {data.jobs.length} position{data.jobs.length !== 1 ? 's' : ''}</p>
          {data.jobs.length === 0 ? (
            <p style={s.muted}>No open positions right now.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: theme.spacing.lg }}>
              {data.jobs.map((job) => (
                <div key={job._id} style={{ 
                  background: theme.colors.bgCard, 
                  padding: theme.spacing.lg, 
                  border: `1px solid ${theme.colors.border}`, 
                  height: '300px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ marginBottom: theme.spacing.sm, fontSize: '0.875rem', color: theme.colors.textMuted, fontWeight: 500 }}>
                    {data.organization.name}
                  </div>
                  <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 600, color: theme.colors.text }}>{job.title}</h3>
                  <p style={{ margin: '0 0 1rem', color: theme.colors.textMuted, fontSize: '0.875rem', lineHeight: 1.5, flex: 1, overflow: 'hidden' }}>
                    {job.description ? (job.description.slice(0, 120) + (job.description.length > 120 ? '...' : '')) : 'No description available'}
                  </p>
                  <Link 
                    to={`/job/${job.positionUrl || job._id}`} 
                    style={{ 
                      display: 'inline-block',
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`, 
                      background: theme.colors.primary, 
                      color: '#fff', 
                      textDecoration: 'none', 
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
