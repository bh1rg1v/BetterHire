import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function Analytics() {
  const { user } = useAuth();
  const [funnel, setFunnel] = useState({});
  const [testMetrics, setTestMetrics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (!user || (user.role !== 'Admin' && user.role !== 'Manager')) {
    return <div><p>Access denied.</p><Link to="/dashboard/manager">Back</Link></div>;
  }

  return (
    <div style={{ padding: '2rem', background: '#0f172a', color: '#f1f5f9', minHeight: '100vh' }}>
      <Link to="/dashboard/manager" style={{ color: '#60a5fa' }}>← Positions</Link>
      <h1>Analytics</h1>
      {error && <p style={{ color: '#f87171' }}>{error}</p>}
      <button type="button" onClick={exportCsv} style={{ padding: '0.5rem 1rem', marginBottom: '1rem', cursor: 'pointer' }}>Export applications (CSV)</button>
      {loading ? <p>Loading…</p> : (
        <>
          <section style={{ marginBottom: '1.5rem' }}>
            <h2>Application funnel</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {['submitted', 'under_review', 'shortlisted', 'rejected', 'hired'].map((st) => (
                <li key={st}>{st}: {funnel[st] ?? 0}</li>
              ))}
            </ul>
          </section>
          {testMetrics && (
            <section style={{ marginBottom: '1.5rem' }}>
              <h2>Test metrics</h2>
              <p>Total evaluated: {testMetrics.totalAttempts} — Avg score: {testMetrics.averageScore} — Pass rate: {testMetrics.passRate}%</p>
            </section>
          )}
          <section>
            <h2>Recent activity</h2>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem' }}>
              {activity.slice(0, 10).map((log) => (
                <li key={log._id} style={{ marginBottom: '0.5rem', color: '#94a3b8' }}>
                  {log.userId?.name} — {log.action} — {log.resource} {log.resourceId ? String(log.resourceId) : ''} — {new Date(log.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
