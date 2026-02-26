import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../api/client';

export default function TestOverview() {
  const { testUrl } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [test, setTest] = useState(null);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [bestScore, setBestScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const handleStartTest = async () => {
    setStarting(true);
    try {
      // Clear any previous incomplete session
      localStorage.removeItem(`test_session_${testUrl}`);
      
      const testRes = await api.api(`/tests/url/${testUrl}?questionId=1`);
      if (testRes.test && testRes.test.questions && testRes.test.questions.length > 0) {
        const firstQuestionId = testRes.test.questions[0]._id || testRes.test.questions[0].questionId?._id;
        navigate(`/test/${testUrl}/${firstQuestionId}`);
      } else {
        setError('No questions available in this test');
      }
    } catch (e) {
      setError(e.message || 'Failed to start test');
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    const fetchTest = api.api(`/tests/url/${testUrl}`);
    fetchTest
      .then((r) => {
        setTest(r.test);
        setAttemptsCount(r.attemptsCount || 0);
        setBestScore(r.bestScore);
      })
      .catch((e) => setError(e.message || 'Test not found'))
      .finally(() => setLoading(false));
  }, [testUrl, user]);

  if (loading) return <div style={s.page(theme)}><p>Loading...</p></div>;
  if (error) return <div style={s.page(theme)}><p style={s.error}>{error}</p></div>;

  return (
    <div style={s.page(theme)}>
      <div style={s.container(theme)}>
        <h1 style={s.title(theme)}>{test.title}</h1>
        <div style={s.info(theme)}>
          <div style={s.infoRow}>
            <span><strong>Duration:</strong></span>
            <span>{test.durationMinutes} minutes</span>
          </div>
          <div style={s.infoRow}>
            <span><strong>Questions:</strong></span>
            <span>{test.questionsCount || 0}</span>
          </div>
          <div style={s.infoRow}>
            <span><strong>Max Attempts:</strong></span>
            <span>{test.maxAttempts || 1}</span>
          </div>
          <div style={s.infoRow}>
            <span><strong>Your Attempts:</strong></span>
            <span>{attemptsCount} / {test.maxAttempts || 1}</span>
          </div>
          {bestScore !== null && (
            <div style={s.infoRow}>
              <span><strong>Best Score:</strong></span>
              <span>{bestScore} points</span>
            </div>
          )}
        </div>
        <div style={s.instructions(theme)}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.125rem' }}>Instructions:</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: 1.8 }}>
            <li>Once you start the test, the timer will begin</li>
            <li>You cannot pause the test once started</li>
            <li>Do not refresh the page - it will auto-submit your test</li>
            <li>Make sure you have a stable internet connection</li>
            <li>Answer all questions to the best of your ability</li>
            <li>There is no negative marking</li>
          </ul>
          {test.instructions && test.instructions.trim() && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: '6px' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', color: theme.colors.primary }}>Test-Specific Instructions:</strong>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: 1.8 }}>
                {test.instructions.split('\n').filter(line => line.trim()).map((line, idx) => (
                  <li key={idx}>{line.trim()}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {attemptsCount < (test.maxAttempts || 1) ? (
          <button onClick={handleStartTest} disabled={starting} style={s.startBtn(theme)}>
            {starting ? 'Starting...' : 'Start Test'}
          </button>
        ) : (
          <p style={s.maxAttempts}>You have used all available attempts for this test.</p>
        )}
      </div>
    </div>
  );
}

const s = {
  page: (theme) => ({ minHeight: '100vh', background: theme.colors.bg, color: theme.colors.text, padding: '3rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  container: (theme) => ({ maxWidth: 700, width: '100%', background: theme.colors.bgCard, borderRadius: '12px', padding: '2.5rem', border: `1px solid ${theme.colors.border}`, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }),
  title: (theme) => ({ fontSize: '2.25rem', fontWeight: 700, marginBottom: '2rem', color: theme.colors.text, textAlign: 'center' }),
  info: (theme) => ({ background: theme.colors.bg, padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: `1px solid ${theme.colors.border}` }),
  infoRow: { marginBottom: '0.875rem', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' },
  instructions: (theme) => ({ background: theme.colors.bg, padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: `1px solid ${theme.colors.border}` }),
  startBtn: (theme) => ({ width: '100%', padding: '1rem 2rem', background: theme.colors.primary, color: theme.colors.primary === '#FFFFFF' ? '#000000' : '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.125rem', fontWeight: 600, transition: 'opacity 0.2s', ':hover': { opacity: 0.9 } }),
  maxAttempts: { color: '#999', fontSize: '1rem', marginTop: '1rem', textAlign: 'center' },
  error: { color: '#ef4444', fontSize: '1rem', textAlign: 'center' }
};