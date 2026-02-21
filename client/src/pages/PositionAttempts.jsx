import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function PositionAttempts() {
  const { positionId } = useParams();
  const { user } = useAuth();
  const [position, setPosition] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluatingId, setEvaluatingId] = useState(null);
  const [manualScores, setManualScores] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'Admin' && user.role !== 'Manager')) return;
    Promise.all([
      api.api(`/organizations/me/positions/${positionId}`),
      api.api(`/organizations/me/positions/${positionId}/attempts`),
    ])
      .then(([posRes, attRes]) => {
        setPosition(posRes.position);
        setAttempts(attRes.attempts || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [positionId, user]);

  async function submitEvaluation(attemptId) {
    setSaving(true);
    try {
      await api.api(`/organizations/me/attempts/${attemptId}`, { method: 'PATCH', body: { manualScores } });
      setEvaluatingId(null);
      const attRes = await api.api(`/organizations/me/positions/${positionId}/attempts`);
      setAttempts(attRes.attempts || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!user || (user.role !== 'Admin' && user.role !== 'Manager')) {
    return <div><p>Access denied.</p><Link to="/dashboard">Back</Link></div>;
  }

  return (
    <div style={{ padding: '2rem', background: '#0f172a', color: '#f1f5f9', minHeight: '100vh' }}>
      <Link to="/dashboard/manager" style={{ color: '#60a5fa' }}>← Back to positions</Link>
      <h1>Test attempts{position ? `: ${position.title}` : ''}</h1>
      {error && <p style={{ color: '#f87171' }}>{error}</p>}
      {loading ? <p>Loading…</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {attempts.map((a) => (
            <li key={a._id} style={{ marginBottom: '1rem', padding: '1rem', background: '#1e293b', borderRadius: 8 }}>
              <strong>{a.applicantId?.name}</strong> ({a.applicantId?.email}) — Status: {a.status} — Auto: {a.autoScore != null ? a.autoScore : '—'} — Total: {a.totalScore != null ? a.totalScore : '—'} — {new Date(a.submittedAt || a.createdAt).toLocaleString()}
              {a.status === 'submitted' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => { setEvaluatingId(a._id); setManualScores([]); }}>Evaluate (manual scores)</button>
                </div>
              )}
              {evaluatingId === a._id && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p>Enter scores for descriptive questions (manualScores: [{"{ questionId, score, feedback? }"}]). Use API or add UI as needed.</p>
                  <button type="button" onClick={() => submitEvaluation(a._id)} disabled={saving}>{saving ? 'Saving…' : 'Save evaluation'}</button>
                  <button type="button" onClick={() => setEvaluatingId(null)}>Cancel</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {!loading && attempts.length === 0 && <p>No attempts yet.</p>}
    </div>
  );
}
