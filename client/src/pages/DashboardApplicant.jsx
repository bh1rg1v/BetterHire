import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

const STATUS_LABELS = { submitted: 'Submitted', under_review: 'Under review', shortlisted: 'Shortlisted', rejected: 'Rejected', hired: 'Hired' };

export default function DashboardApplicant() {
  const { user, logout } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [attemptsByPosition, setAttemptsByPosition] = useState({});
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={s.page}>
      <header style={s.header}>
        <Link to="/dashboard" style={s.logo}>BetterHire</Link>
        <nav style={s.nav}>
          <Link to="/profile" style={s.navLink}>Profile</Link>
          <Link to="/jobs" style={s.navLink}>Browse jobs</Link>
          <button type="button" onClick={logout} style={s.logoutBtn}>Sign out</button>
        </nav>
      </header>
      <main style={s.main}>
        <h1>My applications</h1>
        <p style={s.muted}>Track status and take assigned tests.</p>
        {loading ? <p>Loading…</p> : (
          <ul style={s.list}>
            {submissions.map((s) => {
              const posId = s.positionId?._id;
              const attempt = attemptsByPosition[posId]?.attempt;
              const hasTest = s.positionId?.testId;
              const canTakeTest = hasTest && (!attempt || attempt.status === 'in_progress');
              const testDone = attempt && (attempt.status === 'submitted' || attempt.status === 'evaluated');
              return (
                <li key={s._id} style={s.card}>
                  <div style={s.cardHeader}>
                    <strong>{s.positionId?.title}</strong>
                    <span style={s.badge(s.status)}>{STATUS_LABELS[s.status] || s.status}</span>
                  </div>
                  <p style={s.muted}>Applied {new Date(s.createdAt).toLocaleDateString()}</p>
                  <div style={s.actions}>
                    {canTakeTest && <Link to={`/test/${posId}`} style={s.btn}>Take test</Link>}
                    {testDone && <span style={s.muted}>Test {attempt.status === 'evaluated' ? `completed · Score: ${attempt.totalScore != null ? attempt.totalScore : '—'}` : 'submitted'}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!loading && submissions.length === 0 && (
          <p>You haven't applied yet. <Link to="/jobs" style={s.link}>Browse jobs</Link> to apply.</p>
        )}
      </main>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  logo: { color: '#f1f5f9', fontWeight: 700, textDecoration: 'none' },
  nav: { display: 'flex', gap: '1rem', alignItems: 'center' },
  navLink: { color: '#94a3b8', textDecoration: 'none' },
  logoutBtn: { padding: '0.5rem 1rem', cursor: 'pointer', background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: 6 },
  main: {},
  muted: { color: '#94a3b8', fontSize: '0.9rem', margin: '0.25rem 0' },
  list: { listStyle: 'none', padding: 0 },
  card: { marginBottom: '1rem', padding: '1rem', background: '#1e293b', borderRadius: 8 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' },
  badge: (status) => ({ fontSize: '0.85rem', padding: '0.2rem 0.5rem', borderRadius: 4, background: status === 'hired' ? '#166534' : status === 'rejected' ? '#991b1b' : '#334155', color: '#e2e8f0' }),
  actions: { marginTop: '0.5rem' },
  btn: { display: 'inline-block', padding: '0.4rem 0.75rem', background: '#3b82f6', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: '0.9rem' },
  link: { color: '#60a5fa' },
};
