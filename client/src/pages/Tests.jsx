import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function Tests() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const canEdit = user?.role === 'Admin' || user?.canPostJobs === true;

  const load = useCallback(async () => {
    try {
      const [testsRes, questionsRes] = await Promise.all([
        api.api('/organizations/me/tests'),
        api.api('/organizations/me/questions'),
      ]);
      setTests(testsRes.tests || []);
      setQuestions(questionsRes.questions || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleQuestion(id) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    if (selectedIds.length === 0) {
      setError('Select at least one question');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await api.api('/organizations/me/tests', {
        method: 'POST',
        body: {
          title: title.trim(),
          durationMinutes: Number(durationMinutes) || 0,
          questions: selectedIds.map((qid, i) => ({ questionId: qid, order: i, points: 1 })),
        },
      });
      setShowModal(false);
      setTitle('');
      setSelectedIds([]);
      load();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) return <div style={{ padding: '2rem' }}><p>Permission required.</p><Link to="/dashboard/manager">Back</Link></div>;

  return (
    <div style={{ padding: '2rem', background: '#0f172a', color: '#f1f5f9', minHeight: '100vh' }}>
      <Link to="/dashboard/manager" style={{ color: '#60a5fa' }}>← Positions</Link>
      <h1>Tests</h1>
      {error && <p style={{ color: '#f87171' }}>{error}</p>}
      <button type="button" onClick={() => setShowModal(true)} style={{ padding: '0.5rem 1rem', marginBottom: '1rem', cursor: 'pointer' }}>Create test</button>
      {loading ? <p>Loading…</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tests.map((t) => (
            <li key={t._id} style={{ marginBottom: '1rem', padding: '1rem', background: '#1e293b', borderRadius: 8 }}>
              <strong>{t.title}</strong> — {t.durationMinutes} min — {t.questions?.length || 0} questions
            </li>
          ))}
        </ul>
      )}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: 12, maxWidth: 520, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h2>Create test</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Test title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }} />
              <label>Duration (minutes): <input type="number" min={0} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} style={{ marginBottom: '0.5rem', padding: '0.5rem' }} /></label>
              <p>Select questions:</p>
              {questions.map((q) => (
                <label key={q._id} style={{ display: 'block', marginBottom: '0.25rem' }}>
                  <input type="checkbox" checked={selectedIds.includes(q._id)} onChange={() => toggleQuestion(q._id)} />
                  {' '}[{q.type}] {q.questionText?.slice(0, 60)}…
                </label>
              ))}
              <div style={{ marginTop: '0.5rem' }}>
                <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create'}</button>
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
