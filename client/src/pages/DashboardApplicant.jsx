import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

const STATUS_LABELS = { submitted: 'Submitted', under_review: 'Under Review', shortlisted: 'Shortlisted', rejected: 'Rejected', hired: 'Hired' };

export default function DashboardApplicant() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [submissions, setSubmissions] = useState([]);
  const [attemptsByPosition, setAttemptsByPosition] = useState({});
  const [loading, setLoading] = useState(true);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/dashboard/applicant', label: 'My Applications' },
    { path: '/jobs', label: 'Browse Jobs' },
    { path: '/dashboard/profile', label: 'Profile' },
  ];

  useEffect(() => {
    if (user?.role !== 'Applicant') return;
    api.api('/applications/me').then((appRes) => {
      setSubmissions(appRes.submissions || []);
      const byPos = {};
      (appRes.submissions || []).forEach((s) => {
        if (s.positionId?._id) byPos[s.positionId._id] = {};
      });
      setAttemptsByPosition(byPos);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'Applicant' || submissions.length === 0) return;
    submissions.forEach((s) => {
      const posId = s.positionId?._id;
      if (!posId || attemptsByPosition[posId]?.attempt) return;
      api.api(`/attempts/me?positionId=${posId}`).then((r) => {
        setAttemptsByPosition((prev) => ({ ...prev, [posId]: { ...prev[posId], attempt: r.attempt } }));
      }).catch(() => {});
    });
  }, [user, submissions]);

  const getStatusColor = (status) => {
    if (status === 'hired') return theme.colors.success;
    if (status === 'rejected') return theme.colors.danger;
    if (status === 'shortlisted') return theme.colors.info;
    if (status === 'under_review') return theme.colors.warning;
    return theme.colors.textMuted;
  };

  const s = {
    title: { fontSize: '2rem', fontWeight: 600, marginBottom: theme.spacing.sm },
    subtitle: { color: theme.colors.textMuted, marginBottom: theme.spacing.xl },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: theme.spacing.lg },
    card: { background: theme.colors.bgCard, padding: theme.spacing.xl, border: `1px solid ${theme.colors.border}` },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.md, marginBottom: theme.spacing.md },
    cardTitle: { fontSize: '1.25rem', fontWeight: 600, margin: 0 },
    badge: { padding: `${theme.spacing.xs} ${theme.spacing.md}`, fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' },
    cardDate: { color: theme.colors.textMuted, fontSize: '0.875rem', marginBottom: theme.spacing.lg },
    testBtn: { display: 'inline-flex', alignItems: 'center', gap: theme.spacing.sm, padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, color: '#fff', textDecoration: 'none', fontWeight: 500, transition: 'all 0.2s' },
    testInfo: { color: theme.colors.textMuted, fontSize: '0.9rem' },
    empty: { textAlign: 'center', padding: theme.spacing.xxl },
    emptyText: { fontSize: '1.25rem', color: theme.colors.textMuted, marginBottom: theme.spacing.lg },
    emptyLink: { display: 'inline-block', padding: `${theme.spacing.md} ${theme.spacing.xl}`, background: theme.colors.primary, color: '#fff', textDecoration: 'none', fontWeight: 500 },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={navItems} />}>
      <h1 style={s.title}>My Applications</h1>
      <p style={s.subtitle}>Track your application status and complete assigned tests</p>

      {loading ? <p>Loading...</p> : (
        <>
          {submissions.length === 0 ? (
            <div style={s.empty}>
              <p style={s.emptyText}>No applications yet</p>
              <Link to="/jobs" style={s.emptyLink}>Browse Jobs</Link>
            </div>
          ) : (
            <div style={s.grid}>
              {submissions.map((sub) => {
                const posId = sub.positionId?._id;
                const attempt = attemptsByPosition[posId]?.attempt;
                const hasTest = sub.positionId?.testId;
                const canTakeTest = hasTest && (!attempt || attempt.status === 'in_progress');
                const testDone = attempt && (attempt.status === 'submitted' || attempt.status === 'evaluated');

                return (
                  <div key={sub._id} style={s.card}>
                    <div style={s.cardHeader}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>Company</p>
                        <h3 style={s.cardTitle}>{sub.positionId?.organizationId?.name || 'N/A'}</h3>
                      </div>
                      <span style={{ ...s.badge, background: `${getStatusColor(sub.status)}20`, color: getStatusColor(sub.status) }}>
                        {STATUS_LABELS[sub.status] || sub.status}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>Position</p>
                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500, marginBottom: theme.spacing.md }}>{sub.positionId?.title || 'N/A'}</p>
                    <p style={s.cardDate}>Applied on {new Date(sub.createdAt).toLocaleDateString()}</p>
                    
                    <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                      <button onClick={() => window.open(`/dashboard/submissions/${sub._id}`, '_blank')} style={{ ...s.testBtn, background: theme.colors.bgHover, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
                        View Application
                      </button>
                    </div>
                    {canTakeTest && (
                      <Link to={`/test/${posId}`} style={s.testBtn}>
                        Take Test
                      </Link>
                    )}
                    {testDone && (
                      <div style={s.testInfo}>
                        Test {attempt.status === 'evaluated' ? `completed - Score: ${attempt.totalScore ?? '-'}` : 'submitted'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
