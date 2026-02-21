import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function TakeTest() {
  const { positionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(null);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [ended, setEnded] = useState(false);

  const durationMs = test?.durationMinutes ? test.durationMinutes * 60 * 1000 : 0;
  const startedAt = attempt?.startedAt ? new Date(attempt.startedAt).getTime() : null;

  useEffect(() => {
    if (!user || user.role !== 'Applicant' || !positionId) {
      navigate('/dashboard/applicant');
      return;
    }
    api.api(`/attempts/me?positionId=${positionId}`)
      .then((r) => {
        setAttempt(r.attempt);
        setTest(r.test);
        const initial = {};
        (r.test?.questions || []).forEach((q) => {
          const qid = q.questionId?._id || q.questionId;
          if (qid) initial[qid] = r.attempt?.answers?.find((a) => (a.questionId || a.questionId?._id) === qid)?.value ?? '';
        });
        setAnswers(initial);
      })
      .catch(() => {
        api.api('/attempts/start', { method: 'POST', body: { positionId } })
          .then((r) => {
            setAttempt(r.attempt);
            setTest(r.test);
            const initial = {};
            (r.test?.questions || []).forEach((q) => {
              const qid = q.questionId?._id || q.questionId;
              if (qid) initial[qid] = '';
            });
            setAnswers(initial);
          })
          .catch((e) => setError(e.message || 'Failed to start'));
      })
      .finally(() => setLoading(false));
  }, [positionId, user, navigate]);

  useEffect(() => {
    if (!durationMs || !startedAt || attempt?.status !== 'in_progress') return;
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const left = Math.max(0, durationMs - elapsed);
      setTimeLeft(left);
      if (left <= 0) setEnded(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [durationMs, startedAt, attempt?.status]);

  const setAnswer = useCallback((questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!attempt?._id) return;
    setSubmitting(true);
    setError('');
    try {
      const answersArr = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
      await api.api(`/attempts/${attempt._id}/submit`, { method: 'POST', body: { answers: answersArr } });
      navigate('/dashboard/applicant');
    } catch (e) {
      setError(e.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={s.page}><p>Loading…</p></div>;
  if (error && !test) return <div style={s.page}><p style={s.error}>{error}</p><a href="/dashboard/applicant">Back</a></div>;
  if (attempt?.status !== 'in_progress') return <div style={s.page}><p>This test is already submitted or evaluated.</p><a href="/dashboard/applicant">Back to applications</a></div>;

  const questions = test?.questions || [];
  const timeStr = timeLeft != null ? `${Math.floor(timeLeft / 60)}:${String(Math.floor((timeLeft % 60) / 1)).padStart(2, '0')}` : '—';

  return (
    <div style={s.page}>
      <div style={s.container}>
        <h1>{test?.title} — Test</h1>
        {durationMs > 0 && <p style={s.timer}>Time left: <strong>{timeStr}</strong></p>}
        {error && <p style={s.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          {questions.map((q, idx) => {
            const qn = q.questionId || q;
            const qid = qn._id;
            return (
              <div key={qid} style={s.question}>
                <p><strong>Q{idx + 1}.</strong> {qn.questionText} {qn.points ? `(${qn.points} pt)` : ''}</p>
                {qn.type === 'mcq' && (qn.options || []).map((opt, i) => (
                  <label key={i} style={s.option}>
                    <input type="radio" name={qid} value={i} checked={answers[qid] === i || answers[qid] === String(i)} onChange={() => setAnswer(qid, i)} />
                    {opt.text}
                  </label>
                ))}
                {qn.type === 'descriptive' && (
                  <textarea value={answers[qid] || ''} onChange={(e) => setAnswer(qid, e.target.value)} rows={4} style={s.textarea} />
                )}
              </div>
            );
          })}
          <button type="submit" disabled={submitting} style={s.btn}>{submitting ? 'Submitting…' : 'Submit test'}</button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', padding: '2rem' },
  container: { maxWidth: 640, margin: '0 auto' },
  timer: { color: '#fcd34d', marginBottom: '1rem' },
  error: { color: '#f87171' },
  question: { marginBottom: '1.5rem', padding: '1rem', background: '#1e293b', borderRadius: 8 },
  option: { display: 'block', marginBottom: '0.5rem' },
  textarea: { width: '100%', padding: '0.5rem', marginTop: '0.5rem', background: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 6 },
  btn: { padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '1rem' },
};
