import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOrg } from '../context/OrgContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

export default function Analytics() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { organization } = useOrg();
  const [funnel, setFunnel] = useState({});
  const [testMetrics, setTestMetrics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const orgSlug = organization?.slug;
  const userRole = user?.role?.toLowerCase();

  useEffect(() => {
    if (!user || (user.role !== 'Admin' && user.role !== 'Manager')) return;
    Promise.all([
      api.api('/organizations/me/analytics/funnel').catch(() => ({ funnel: {} })),
      api.api('/organizations/me/analytics/test-metrics').catch(() => null),
      api.api('/organizations/me/analytics/activity?limit=20').catch(() => ({ logs: [] })),
    ]).then(([fRes, tRes, aRes]) => {
      setFunnel(fRes.funnel || {});
      setTestMetrics(tRes);
      setActivity(aRes.logs || []);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [user]);

  async function exportCsv() {
    try {
      const token = localStorage.getItem('betterhire_token');
      const res = await fetch('/api/organizations/me/analytics/export/applications', { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'applications.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || 'Export failed');
    }
  }

  const navItems = !orgSlug ? [] : user?.role === 'Admin'
    ? [{ label: 'Dashboard', path: `/${orgSlug}/admin/dashboard` }, { label: 'Forms', path: `/${orgSlug}/admin/forms` }, { label: 'Tests', path: `/${orgSlug}/admin/tests` }, { label: 'Questions', path: `/${orgSlug}/admin/questions` }, { label: 'Analytics', path: `/${orgSlug}/admin/analytics` }, { label: 'Profile', path: '/dashboard/profile' }]
    : user?.canPostJobs
    ? [{ label: 'Dashboard', path: `/${orgSlug}/manager/dashboard` }, { label: 'Forms', path: `/${orgSlug}/manager/forms` }, { label: 'Tests', path: `/${orgSlug}/manager/tests` }, { label: 'Questions', path: `/${orgSlug}/manager/questions` }, { label: 'Analytics', path: `/${orgSlug}/manager/analytics` }, { label: 'Profile', path: '/dashboard/profile' }]
    : [{ label: 'Dashboard', path: `/${orgSlug}/manager/dashboard` }, { label: 'Profile', path: '/dashboard/profile' }];

  if (!user || (user.role !== 'Admin' && user.role !== 'Manager')) {
    return <DashboardLayout sidebar={<Sidebar items={navItems} />}><div style={{ padding: '2rem' }}><p>Access denied.</p></div></DashboardLayout>;
  }

  const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
    title: { fontSize: '2rem', fontWeight: 600, color: theme.colors.text, margin: 0 },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20`, border: `1px solid ${theme.colors.danger}` },
    btn: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500, marginBottom: theme.spacing.xl },
    section: { marginBottom: theme.spacing.xl, padding: theme.spacing.lg, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}` },
    sectionTitle: { fontSize: '1.25rem', fontWeight: 600, marginBottom: theme.spacing.md, color: theme.colors.text },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.md },
    card: { padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, textAlign: 'center' },
    cardLabel: { fontSize: '0.875rem', color: theme.colors.textMuted, textTransform: 'capitalize', marginBottom: theme.spacing.xs },
    cardValue: { fontSize: '2rem', fontWeight: 700, color: theme.colors.primary },
    metricRow: { display: 'flex', gap: theme.spacing.xl, flexWrap: 'wrap' },
    metric: { flex: 1, minWidth: '150px' },
    metricLabel: { fontSize: '0.875rem', color: theme.colors.textMuted, marginBottom: theme.spacing.xs },
    metricValue: { fontSize: '1.5rem', fontWeight: 600, color: theme.colors.text },
    list: { listStyle: 'none', padding: 0 },
    logItem: { padding: theme.spacing.sm, marginBottom: theme.spacing.xs, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, fontSize: '0.875rem', color: theme.colors.textMuted, display: 'flex', justifyContent: 'space-between', gap: theme.spacing.md },
    logUser: { fontWeight: 500, color: theme.colors.text },
    logTime: { fontSize: '0.8rem', color: theme.colors.textDim },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={navItems} />}>
      <div style={s.header}>
        <h1 style={s.title}>Analytics</h1>
        <button type="button" onClick={exportCsv} style={s.btn}>Export Applications (CSV)</button>
      </div>
      {error && <div style={s.error}>{error}</div>}
      {loading ? <p>Loading...</p> : (
        <>
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Application Funnel</h2>
            <div style={s.grid}>
              {['submitted', 'under_review', 'shortlisted', 'rejected', 'hired'].map((st) => (
                <div key={st} style={s.card}>
                  <div style={s.cardLabel}>{st.replace('_', ' ')}</div>
                  <div style={s.cardValue}>{funnel[st] ?? 0}</div>
                </div>
              ))}
            </div>
          </section>
          {testMetrics && (
            <section style={s.section}>
              <h2 style={s.sectionTitle}>Test Metrics</h2>
              <div style={s.metricRow}>
                <div style={s.metric}>
                  <div style={s.metricLabel}>Total Evaluated</div>
                  <div style={s.metricValue}>{testMetrics.totalAttempts}</div>
                </div>
                <div style={s.metric}>
                  <div style={s.metricLabel}>Average Score</div>
                  <div style={s.metricValue}>{testMetrics.averageScore}</div>
                </div>
                <div style={s.metric}>
                  <div style={s.metricLabel}>Pass Rate</div>
                  <div style={s.metricValue}>{testMetrics.passRate}%</div>
                </div>
              </div>
            </section>
          )}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Recent Activity</h2>
            <ul style={s.list}>
              {activity.slice(0, 10).map((log) => (
                <li key={log._id} style={s.logItem}>
                  <div>
                    <span style={s.logUser}>{log.userId?.name}</span> {log.action} {log.resource} {log.resourceId ? String(log.resourceId) : ''}
                  </div>
                  <div style={s.logTime}>{new Date(log.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
