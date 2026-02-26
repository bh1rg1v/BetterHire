import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../api/client';

export default function TakeTest() {
  const { testUrl, questionId } = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const submittedRef = useRef(false);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    async function checkIncompleteSession() {
      if (initialCheckDone.current) return;
      initialCheckDone.current = true;
      
      const sessionKey = `test_session_${testUrl}`;
      const savedSession = localStorage.getItem(sessionKey);
      
      if (savedSession && !submittedRef.current) {
        submittedRef.current = true;
        const session = JSON.parse(savedSession);
        localStorage.removeItem(sessionKey);
        try {
          await api.api(`/tests/url/${testUrl}/submit`, {
            method: 'POST',
            body: { answers: session.answers || {} }
          });
        } catch (e) {
          console.error('Failed to submit incomplete test:', e);
        }
        navigate(`/test/${testUrl}`);
      }
    }
    checkIncompleteSession();
  }, [testUrl, navigate]);

  useEffect(() => {
    async function loadTest() {
      try {
        const res = await api.api(`/tests/url/${testUrl}?questionId=1`);
        setTest(res.test);
        if (res.test.durationMinutes) {
          setTimeLeft(res.test.durationMinutes * 60);
        }
        if (questionId && res.test.questions) {
          const idx = res.test.questions.findIndex(q => (q._id || q.questionId?._id) === questionId);
          if (idx >= 0) setCurrentQuestionIndex(idx);
        }
        
        const sessionKey = `test_session_${testUrl}`;
        const existing = localStorage.getItem(sessionKey);
        if (!existing) {
          localStorage.setItem(sessionKey, JSON.stringify({ answers: {}, startedAt: Date.now() }));
        }
      } catch (e) {
        setError(e.message || 'Test not found');
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [testUrl, questionId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'If you refresh, the test will be submitted';
      return 'If you refresh, the test will be submitted';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleAnswerChange = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    // Update session storage
    const sessionKey = `test_session_${testUrl}`;
    localStorage.setItem(sessionKey, JSON.stringify({ answers: newAnswers, startedAt: Date.now() }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      const nextQuestion = test.questions[currentQuestionIndex + 1];
      const nextQuestionId = nextQuestion._id || nextQuestion.questionId?._id;
      navigate(`/test/${testUrl}/${nextQuestionId}`);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevQuestion = test.questions[currentQuestionIndex - 1];
      const prevQuestionId = prevQuestion._id || prevQuestion.questionId?._id;
      navigate(`/test/${testUrl}/${prevQuestionId}`);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      const res = await api.api(`/tests/url/${testUrl}/submit`, {
        method: 'POST',
        body: { answers }
      });
      // Clear session on successful submit
      localStorage.removeItem(`test_session_${testUrl}`);
      setResult(res);
    } catch (e) {
      setError(e.message || 'Failed to submit test');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: theme.colors.bg,
      color: theme.colors.text,
      fontFamily: theme.fonts.body,
      padding: theme.spacing.xl,
      display: 'flex',
      gap: '2rem',
      maxWidth: '1400px',
      margin: '0 auto',
    },
    sidebar: {
      width: '200px',
      flexShrink: 0,
    },
    questionNav: {
      background: theme.colors.bgCard,
      padding: theme.spacing.lg,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: '8px',
      position: 'sticky',
      top: theme.spacing.xl,
    },
    navTitle: {
      fontSize: '0.875rem',
      fontWeight: 600,
      marginBottom: theme.spacing.md,
      color: theme.colors.textMuted,
    },
    questionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: theme.spacing.sm,
    },
    questionBtn: (isActive, isAnswered) => ({
      padding: '0.5rem',
      background: isActive ? '#ffffff' : isAnswered ? theme.colors.primary : theme.colors.bg,
      color: isActive ? '#000000' : isAnswered ? '#fff' : theme.colors.text,
      border: `1px solid ${isActive ? '#ffffff' : isAnswered ? theme.colors.primary : theme.colors.border}`,
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: 500,
      transition: 'all 0.2s',
    }),
    container: {
      flex: 1,
      minWidth: 0,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
      padding: theme.spacing.lg,
      background: theme.colors.bgCard,
      border: `1px solid ${theme.colors.border}`,
    },
    title: {
      fontSize: '2rem',
      fontWeight: 600,
      margin: 0,
    },
    timer: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: timeLeft < 300 ? theme.colors.danger : theme.colors.primary,
    },
    error: {
      color: theme.colors.danger,
      padding: theme.spacing.md,
      background: `${theme.colors.danger}20`,
      border: `1px solid ${theme.colors.danger}`,
      marginBottom: theme.spacing.lg,
    },
    question: {
      background: theme.colors.bgCard,
      padding: theme.spacing.xl,
      border: `1px solid ${theme.colors.border}`,
      marginBottom: theme.spacing.lg,
    },
    questionTitle: {
      fontSize: '1.25rem',
      fontWeight: 600,
      marginBottom: theme.spacing.md,
    },
    questionText: {
      fontSize: '1.1rem',
      marginBottom: theme.spacing.lg,
      lineHeight: 1.6,
    },
    option: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
      padding: theme.spacing.md,
      cursor: 'pointer',
      background: theme.colors.bg,
      border: `1px solid ${theme.colors.border}`,
      transition: 'all 0.2s',
    },
    optionHover: {
      background: theme.colors.bgHover,
      borderColor: theme.colors.primary,
    },
    radio: {
      width: '20px',
      height: '20px',
      marginRight: theme.spacing.md,
      cursor: 'pointer',
      accentColor: theme.colors.primary,
    },
    textarea: {
      width: '100%',
      minHeight: '120px',
      padding: theme.spacing.md,
      background: theme.colors.bg,
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.text,
      fontFamily: theme.fonts.body,
      fontSize: '1rem',
      resize: 'vertical',
    },
    button: {
      padding: `${theme.spacing.md} ${theme.spacing.xl}`,
      background: theme.colors.primary,
      color: '#fff',
      border: 'none',
      cursor: 'pointer',
      fontFamily: theme.fonts.body,
      fontWeight: 600,
      fontSize: '1rem',
      marginRight: theme.spacing.md,
    },
    buttonSecondary: {
      padding: `${theme.spacing.md} ${theme.spacing.xl}`,
      background: 'transparent',
      color: theme.colors.text,
      border: `1px solid ${theme.colors.border}`,
      cursor: 'pointer',
      fontFamily: theme.fonts.body,
      fontWeight: 600,
      fontSize: '1rem',
    },
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.xl,
      padding: theme.spacing.lg,
      background: theme.colors.bgCard,
      border: `1px solid ${theme.colors.border}`,
    },
    progress: {
      fontSize: '0.9rem',
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.md,
    },
  };

  if (result) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>Test Completed!</h1>
          </div>
          <div style={styles.question}>
            <h2 style={{ marginBottom: theme.spacing.lg }}>Your Results</h2>
            <div style={{ fontSize: '1.2rem', marginBottom: theme.spacing.md }}>
              <strong>Score:</strong> {result.totalScore !== null ? result.totalScore : result.autoScore} points
            </div>
            {result.manualRequired && (
              <div style={{ fontSize: '1rem', color: theme.colors.textMuted, marginBottom: theme.spacing.md }}>
                Some questions require manual evaluation. Your final score will be updated once reviewed.
              </div>
            )}
            <div style={{ fontSize: '1rem', color: theme.colors.textMuted, marginTop: theme.spacing.xl }}>
              You have used one attempt. Please check the test overview to see your remaining attempts.
            </div>
          </div>
          <button onClick={() => navigate(`/test/${testUrl}`)} style={styles.button}>
            Back to Test Overview
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <p>Loading test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.error}>{error}</div>
          <button onClick={() => navigate('/')} style={styles.button}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!test?.questions || test.questions.length === 0) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.question}>
            <p>No questions available for this test.</p>
          </div>
          <button onClick={() => navigate(`/test/${testUrl}`)} style={styles.button}>
            Back to Overview
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const question = currentQuestion.questionId || currentQuestion;
  const questionIdKey = question._id;

  const handleQuestionNavigation = (index) => {
    const targetQuestion = test.questions[index];
    const targetQuestionId = targetQuestion._id || targetQuestion.questionId?._id;
    navigate(`/test/${testUrl}/${targetQuestionId}`);
  };

  return (
    <div style={styles.page}>
      <div style={styles.sidebar}>
        <div style={styles.questionNav}>
          <div style={styles.navTitle}>QUESTIONS</div>
          <div style={styles.questionGrid}>
            {test.questions.map((q, idx) => {
              const qId = q._id || q.questionId?._id;
              const isAnswered = answers[qId] !== undefined && answers[qId] !== '';
              const isActive = idx === currentQuestionIndex;
              return (
                <button
                  key={idx}
                  onClick={() => handleQuestionNavigation(idx)}
                  style={styles.questionBtn(isActive, isAnswered)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{test.title}</h1>
          {timeLeft !== null && (
            <div style={styles.timer}>
              Time Left: {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.progress}>
          Question {currentQuestionIndex + 1} of {test.questions.length}
        </div>

        <div style={styles.question}>
          <h4 style={styles.questionTitle}>Question {currentQuestionIndex + 1}</h4>
          <p style={styles.questionText}>{question.questionText}</p>
          
          {question.type === 'mcq' && question.options && (
            <div>
              {question.options.map((option, optIndex) => {
                const isSelected = answers[questionIdKey] == optIndex;
                return (
                  <label 
                    key={optIndex} 
                    style={{
                      ...styles.option,
                      ...(isSelected ? styles.optionHover : {})
                    }}
                  >
                    <input
                      type="radio"
                      name={`q${questionIdKey}`}
                      value={optIndex}
                      checked={isSelected}
                      onChange={(e) => handleAnswerChange(questionIdKey, parseInt(e.target.value))}
                      style={styles.radio}
                    />
                    {option.text}
                  </label>
                );
              })}
            </div>
          )}
          
          {question.type === 'descriptive' && (
            <textarea
              placeholder="Your answer..."
              value={answers[questionIdKey] || ''}
              onChange={(e) => handleAnswerChange(questionIdKey, e.target.value)}
              style={styles.textarea}
            />
          )}
        </div>

        <div style={styles.actions}>
          <div>
            {currentQuestionIndex > 0 && (
              <button onClick={handlePrevious} style={styles.buttonSecondary}>
                Previous
              </button>
            )}
          </div>
          <div>
            {currentQuestionIndex < test.questions.length - 1 ? (
              <button onClick={handleNext} style={styles.button}>
                Next
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} style={styles.button}>
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}