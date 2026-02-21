import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function TakeTest() {
  const { positionId, testUrl, questionId } = useParams();
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
  const [isPreview, setIsPreview] = useState(!!testUrl);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStatus, setQuestionStatus] = useState({});

  const durationMs = test?.durationMinutes ? test.durationMinutes * 60 * 1000 : 0;
  const startedAt = attempt?.startedAt ? new Date(attempt.startedAt).getTime() : null;

  useEffect(() => {
    if (testUrl) {
      setIsPreview(true);
      api.api(`/tests/url/${testUrl}`, { auth: false })
        .then((r) => {
          setTest(r.test);
          const initial = {};
          (r.test?.questions || []).forEach((q) => {
            initial[q._id] = '';
          });
          setAnswers(initial);
          const statusInit = {};
          (r.test?.questions || []).forEach((q) => {
            statusInit[q._id] = 'not_visited';
          });
          setQuestionStatus(statusInit);
          if (questionId && r.test?.questions) {
            const idx = r.test.questions.findIndex(q => q._id === questionId);
            if (idx >= 0) setCurrentQuestionIndex(idx);
          }
        })
        .catch((e) => setError(e.message || 'Test not found'))
        .finally(() => setLoading(false));
      return;
    }
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
  }, [positionId, testUrl, questionId, user, navigate]);

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
    setQuestionStatus((prev) => ({
      ...prev,
      [questionId]: value ? (prev[questionId] === 'marked' ? 'marked' : 'answered') : 'unanswered'
    }));
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
  if (error && !test) return <div style={s.page}><p style={s.error}>{error}</p><a href="/dashboard">Back</a></div>;
  if (!isPreview && attempt?.status !== 'in_progress') return <div style={s.page}><p>This test is already submitted or evaluated.</p><a href="/dashboard/applicant">Back to applications</a></div>;

  const questions = test?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const qn = currentQuestion?.questionId || currentQuestion;
  const qid = qn?._id;
  const timeStr = timeLeft != null ? `${Math.floor(timeLeft / 60)}:${String(Math.floor((timeLeft % 60) / 1)).padStart(2, '0')}` : '—';

  function goToNext() {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      if (testUrl) {
        navigate(`/test/${testUrl}/${questions[nextIdx]._id}`, { replace: true });
      }
    }
  }

  function goToPrev() {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      if (testUrl) {
        navigate(`/test/${testUrl}/${questions[prevIdx]._id}`, { replace: true });
      }
    }
  }

  function goToQuestion(idx) {
    setCurrentQuestionIndex(idx);
    if (testUrl) {
      navigate(`/test/${testUrl}/${questions[idx]._id}`, { replace: true });
    }
  }

  function markForReview() {
    setQuestionStatus(prev => ({ ...prev, [qid]: 'marked' }));
  }

  function saveAndNext() {
    goToNext();
  }

  function saveMarkAndNext() {
    setQuestionStatus(prev => ({ ...prev, [qid]: 'marked' }));
    goToNext();
  }

  const mcqQuestions = questions.filter(q => (q.questionId || q).type === 'mcq');
  const fillblankQuestions = questions.filter(q => (q.questionId || q).type === 'fillblank');

  function getStatusColor(status) {
    switch(status) {
      case 'answered': return '#22c55e';
      case 'marked': return '#f59e0b';
      case 'unanswered': return '#ef4444';
      case 'not_visited': return '#64748b';
      default: return '#64748b';
    }
  }

  return (
    <div style={s.page}>
      <div style={s.mainContainer}>
        <div style={s.container}>
          {isPreview && <div style={s.previewBanner}>PREVIEW MODE</div>}
          <h1>{test?.title} — Test</h1>
          {durationMs > 0 && !isPreview && <p style={s.timer}>Time left: <strong>{timeStr}</strong></p>}
          {isPreview && durationMs > 0 && <p style={s.timer}>Duration: <strong>{test.durationMinutes} minutes</strong></p>}
          <div style={s.progress}>Question {currentQuestionIndex + 1} of {questions.length}</div>
          {error && <p style={s.error}>{error}</p>}
          {qn && (
            <div style={s.question}>
              <p><strong>Q{currentQuestionIndex + 1}.</strong> {qn.questionText} {qn.maxScore ? `(${qn.maxScore} pt)` : ''}</p>
              {qn.type === 'mcq' && (qn.options || []).map((opt, i) => (
                <label key={i} style={s.option}>
                  <input type="radio" name={qid} value={i} checked={answers[qid] === i || answers[qid] === String(i)} onChange={() => setAnswer(qid, i)} disabled={isPreview} />
                  {opt.text}
                </label>
              ))}
              {qn.type === 'fillblank' && (
                <input type="text" value={answers[qid] || ''} onChange={(e) => setAnswer(qid, e.target.value)} style={s.textarea} placeholder="Your answer" disabled={isPreview} />
              )}
              {qn.type === 'descriptive' && (
                <textarea value={answers[qid] || ''} onChange={(e) => setAnswer(qid, e.target.value)} rows={4} style={s.textarea} disabled={isPreview} />
              )}
            </div>
          )}
          {!isPreview && (
            <div style={s.actions}>
              <button type="button" onClick={markForReview} style={s.actionBtn}>Mark for Review</button>
              <button type="button" onClick={saveAndNext} style={s.actionBtn}>Save & Next</button>
              <button type="button" onClick={saveMarkAndNext} style={s.actionBtn}>Save & Mark for Review</button>
            </div>
          )}
          <div style={s.navigation}>
            {currentQuestionIndex > 0 && <button type="button" onClick={goToPrev} style={s.navBtn}>← Previous</button>}
            {currentQuestionIndex < questions.length - 1 ? (
              <button type="button" onClick={goToNext} style={s.navBtn}>Next →</button>
            ) : (
              !isPreview && <button type="button" onClick={handleSubmit} disabled={submitting} style={s.btn}>{submitting ? 'Submitting…' : 'Submit test'}</button>
            )}
          </div>
        </div>
        <div style={s.sidebar}>
          <h3 style={s.sidebarTitle}>Questions</h3>
          <div style={s.legend}>
            <div style={s.legendItem}><span style={{...s.legendBox, background: '#22c55e'}}></span> Answered</div>
            <div style={s.legendItem}><span style={{...s.legendBox, background: '#f59e0b'}}></span> Marked</div>
            <div style={s.legendItem}><span style={{...s.legendBox, background: '#ef4444'}}></span> Unanswered</div>
            <div style={s.legendItem}><span style={{...s.legendBox, background: '#64748b'}}></span> Not Visited</div>
          </div>
          {mcqQuestions.length > 0 && (
            <div style={s.questionGroup}>
              <h4 style={s.groupTitle}>MCQs</h4>
              <div style={s.questionGrid}>
                {mcqQuestions.map((q, idx) => {
                  const qId = (q.questionId || q)._id;
                  const globalIdx = questions.findIndex(qu => (qu.questionId || qu)._id === qId);
                  return (
                    <button
                      key={qId}
                      onClick={() => goToQuestion(globalIdx)}
                      style={{...s.questionBtn, background: getStatusColor(questionStatus[qId] || 'not_visited'), border: globalIdx === currentQuestionIndex ? '2px solid #fff' : 'none'}}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {fillblankQuestions.length > 0 && (
            <div style={s.questionGroup}>
              <h4 style={s.groupTitle}>Blanks</h4>
              <div style={s.questionGrid}>
                {fillblankQuestions.map((q, idx) => {
                  const qId = (q.questionId || q)._id;
                  const globalIdx = questions.findIndex(qu => (qu.questionId || qu)._id === qId);
                  return (
                    <button
                      key={qId}
                      onClick={() => goToQuestion(globalIdx)}
                      style={{...s.questionBtn, background: getStatusColor(questionStatus[qId] || 'not_visited'), border: globalIdx === currentQuestionIndex ? '2px solid #fff' : 'none'}}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' },
  mainContainer: { display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto' },
  container: { flex: 1, maxWidth: 900, background: 'rgba(255, 255, 255, 0.95)', borderRadius: 16, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', color: '#1e293b' },
  sidebar: { width: 320, background: 'rgba(255, 255, 255, 0.95)', padding: '1.5rem', borderRadius: 16, height: 'fit-content', position: 'sticky', top: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', color: '#1e293b' },
  sidebarTitle: { margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700, color: '#667eea' },
  legend: { marginBottom: '1.5rem', fontSize: '0.875rem', padding: '1rem', background: '#f8fafc', borderRadius: 8 },
  legendItem: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' },
  legendBox: { width: 18, height: 18, borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  questionGroup: { marginBottom: '1.5rem' },
  groupTitle: { margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  questionGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' },
  questionBtn: { padding: '0.75rem', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  previewBanner: { background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#000', padding: '0.75rem 1.5rem', marginBottom: '1.5rem', borderRadius: 12, fontWeight: 700, textAlign: 'center', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(251,191,36,0.4)' },
  timer: { color: '#667eea', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600, padding: '1rem', background: '#f1f5f9', borderRadius: 8, textAlign: 'center' },
  progress: { color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 500 },
  error: { color: '#ef4444', background: '#fee2e2', padding: '1rem', borderRadius: 8, marginBottom: '1rem' },
  question: { marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: 12, border: '2px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  option: { display: 'block', marginBottom: '0.75rem', padding: '0.75rem', background: '#fff', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s', border: '2px solid #e2e8f0' },
  textarea: { width: '100%', padding: '1rem', marginTop: '0.75rem', background: '#fff', color: '#1e293b', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical' },
  actions: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  actionBtn: { padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' },
  navigation: { display: 'flex', gap: '1rem', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e2e8f0' },
  navBtn: { padding: '1rem 2rem', background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: '1rem', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(100,116,139,0.3)' },
  btn: { padding: '1rem 2rem', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: '1rem', fontWeight: 700, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(34,197,94,0.4)' },
};
