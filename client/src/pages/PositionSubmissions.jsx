import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

const STATUS_OPTIONS = ['submitted', 'under_review', 'shortlisted', 'rejected', 'hired'];

export default function PositionSubmissions() {
  const { positionId } = useParams();
  const { user } = useAuth();
  const [position, setPosition] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([
      api.api(`/organizations/me/positions/${positionId}`),
      api.api(`/organizations/me/positions/${positionId}/submissions`),
    ])
      .then(([posRes, subRes]) => {
        setPosition(posRes.position);
        setSubmissions(subRes.submissions || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || (user.role !== 'Admin' && user.role !== 'Manager')) return;
    load();
  }, [positionId, user]);

  async function updateStatus(submissionId, status) {
    setError('');
    try {
      await api.api(`/organizations/me/positions/${positionId}/submissions/${submissionId}`, { method: 'PATCH', body: { status } });
      load();
    } catch (e) {
      setError(e.message || 'Update failed');
    }
  }

  if (!user || (user.role !== 'Admin' && user.role !== 'Manager')) {
    return <div><p>Access denied.</p><Link to="/dashboard">Back</Link></div>;
  }

  return (
    <div style={{ padding: '2rem', background: '#0f172a', color: '#f1f5f9', minHeight: '100vh' }}>
      <Link to="/dashboard/manager" style={{ color: '#60a5fa' }}>← Back to positions</Link>
      <h1>Submissions{position ? `: ${position.title}` : ''}</h1>
      {error && <p style={{ color: '#f87171' }}>{error}</p>}
      {loading ? <p>Loading…</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {submissions.map((s) => (
            <li key={s._id} style={{ marginBottom: '1rem', padding: '1rem', background: '#1e293b', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <strong>{s.applicantId?.name}</strong> ({s.applicantId?.email})
                <select value={s.status || 'submitted'} onChange={(e) => updateStatus(s._id, e.target.value)} style={{ padding: '0.25rem 0.5rem', background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 4 }}>
                  {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{new Date(s.createdAt).toLocaleString()}</p>
              <pre style={{ marginTop: '0.5rem', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{JSON.stringify(s.data, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
      {!loading && submissions.length === 0 && <p>No submissions yet.</p>}
    </div>
  );
}
