import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function Questions() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'mcq', questionText: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }], maxScore: 1 });

  const canEdit = user?.role === 'Admin' || user?.canPostJobs === true;

  const load = useCallback(async () => {
    try {
      const res = await api.api('/organizations/me/questions');
      setQuestions(res.questions || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, { text: '', isCorrect: false }] }));
  }

  function setOption(i, key, value) {
    setForm((f) => ({
      ...f,
      options: f.options.map((o, j) => (j === i ? { ...o, [key]: value } : key === 'isCorrect' ? { ...o, isCorrect: false } : o)),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.questionText.trim()) return;
    if (form.type === 'mcq' && form.options.filter((o) => o.text.trim()).length < 2) {
      setError('MCQ needs at least 2 options with text');
      return;
    }
    if (form.type === 'mcq' && form.options.filter((o) => o.isCorrect).length !== 1) {
      setError('Exactly one option must be correct');
      return;
    }
    setError('');
    try {
      await api.api('/organizations/me/questions', {
        method: 'POST',
        body: form.type === 'mcq' ? { type: 'mcq', questionText: form.questionText.trim(), options: form.options.filter((o) => o.text.trim()).map((o) => ({ text: o.text.trim(), isCorrect: !!o.isCorrect })), maxScore: form.maxScore } : { type: 'descriptive', questionText: form.questionText.trim(), maxScore: form.maxScore },
      });
      setShowModal(false);
      setForm({ type: 'mcq', questionText: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }], maxScore: 1 });
      load();
    } catch (e) {
      setError(e.message || 'Save failed');
    }
  }

  if (!canEdit) return <div style={{ padding: '2rem' }}><p>Permission required.</p><Link to="/dashboard/manager">Back</Link></div>;

  return (
    <div style={{ padding: '2rem', background: '#0f172a', color: '#f1f5f9', minHeight: '100vh' }}>
      <Link to="/dashboard/manager" style={{ color: '#60a5fa' }}>← Positions</Link>
      <h1>Question bank</h1>
      {error && <p style={{ color: '#f87171' }}>{error}</p>}
      <button type="button" onClick={() => setShowModal(true)} style={{ padding: '0.5rem 1rem', marginBottom: '1rem', cursor: 'pointer' }}>Add question</button>
      {loading ? <p>Loading…</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {questions.map((q) => (
            <li key={q._id} style={{ marginBottom: '1rem', padding: '1rem', background: '#1e293b', borderRadius: 8 }}>
              <strong>[{q.type}]</strong> {q.questionText?.slice(0, 80)}…
            </li>
          ))}
        </ul>
      )}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: 12, maxWidth: 480, width: '90%' }}>
            <h2>New question</h2>
            <form onSubmit={handleSubmit}>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={{ marginBottom: '0.5rem', padding: '0.5rem' }}>
                <option value="mcq">MCQ</option>
                <option value="descriptive">Descriptive</option>
              </select>
              <textarea placeholder="Question text" value={form.questionText} onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))} required rows={2} style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }} />
              {form.type === 'mcq' && (
                <>
                  {form.options.map((o, i) => (
                    <div key={i} style={{ marginBottom: '0.5rem' }}>
                      <input type="text" placeholder="Option" value={o.text} onChange={(e) => setOption(i, 'text', e.target.value)} style={{ marginRight: '0.5rem', padding: '0.5rem' }} />
                      <label><input type="radio" name="correct" checked={o.isCorrect} onChange={() => setOption(i, 'isCorrect', true)} /> Correct</label>
                    </div>
                  ))}
                  <button type="button" onClick={addOption} style={{ marginBottom: '0.5rem' }}>Add option</button>
                </>
              )}
              <div style={{ marginTop: '0.5rem' }}>
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
