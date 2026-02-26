import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOrg } from '../context/OrgContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

export default function TestCreate() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { organization } = useOrg();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [tagFilter, setTagFilter] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [newQuestion, setNewQuestion] = useState({ 
    type: 'mcq', 
    questionText: '', 
    options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }], 
    answer: '', 
    answerType: 'string', 
    maxScore: 1,
    tags: []
  });

  const canEdit = user?.role === 'Admin' || user?.canPostJobs === true;

  const load = useCallback(async () => {
    try {
      const url = tagFilter ? `/organizations/me/questions?tags=${encodeURIComponent(tagFilter)}` : '/organizations/me/questions';
      const res = await api.api(url);
      setQuestions(res.questions || []);
    } catch (e) {
      setError(e.message || 'Failed to load questions');
    }
  }, [tagFilter]);

  useEffect(() => { load(); }, [load]);

  const role = user?.role === 'Admin' ? 'admin' : 'manager';
  const navItems = user?.role === 'Admin'
    ? [{ label: 'Dashboard', path: `/${organization?.slug}/${role}/dashboard` }, { label: 'Organization', path: `/${organization?.slug}/admin/dashboard` }, { label: 'Forms', path: `/${organization?.slug}/${role}/forms` }, { label: 'Tests', path: `/${organization?.slug}/${role}/tests` }, { label: 'Questions', path: `/${organization?.slug}/${role}/questions` }, { label: 'Analytics', path: `/${organization?.slug}/${role}/analytics` }, { label: 'Profile', path: '/dashboard/profile' }]
    : user?.canPostJobs
    ? [{ label: 'Dashboard', path: `/${organization?.slug}/${role}/dashboard` }, { label: 'Forms', path: `/${organization?.slug}/${role}/forms` }, { label: 'Tests', path: `/${organization?.slug}/${role}/tests` }, { label: 'Questions', path: `/${organization?.slug}/${role}/questions` }, { label: 'Analytics', path: `/${organization?.slug}/${role}/analytics` }, { label: 'Profile', path: '/dashboard/profile' }]
    : [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Profile', path: '/dashboard/profile' }];

  function toggleQuestion(id) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function openEditQuestion(q) {
    setEditingQuestionId(q._id);
    if (q.type === 'mcq') {
      setNewQuestion({ type: 'mcq', questionText: q.questionText, options: q.options || [{ text: '', isCorrect: false }, { text: '', isCorrect: false }], answer: '', answerType: 'string', maxScore: q.maxScore || 1, tags: q.tags || [] });
    } else if (q.type === 'fillblank') {
      setNewQuestion({ type: 'fillblank', questionText: q.questionText, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }], answer: q.answer || '', answerType: q.answerType || 'string', maxScore: q.maxScore || 1, tags: q.tags || [] });
    }
    setTagInput((q.tags || []).join(', '));
    setShowQuestionForm(true);
  }

  async function handleCreateQuestion(e) {
    e.preventDefault();
    if (!newQuestion.questionText.trim()) return;
    setError('');
    try {
      const body = { type: newQuestion.type, questionText: newQuestion.questionText.trim(), maxScore: newQuestion.maxScore, tags: newQuestion.tags };
      if (newQuestion.type === 'mcq') {
        body.options = newQuestion.options.filter(o => o.text.trim());
        if (body.options.length < 2) { setError('MCQ needs at least 2 options'); return; }
        if (body.options.filter(o => o.isCorrect).length !== 1) { setError('Select exactly one correct option'); return; }
      } else if (newQuestion.type === 'fillblank') {
        if (!newQuestion.answer.trim()) { setError('Answer is required'); return; }
        body.answer = newQuestion.answer.trim();
        body.answerType = newQuestion.answerType;
      }
      if (editingQuestionId) {
        const res = await api.api(`/organizations/me/questions/${editingQuestionId}`, { method: 'PATCH', body });
        setQuestions(questions.map(q => q._id === editingQuestionId ? res.question : q));
        setEditingQuestionId(null);
      } else {
        const res = await api.api('/organizations/me/questions', { method: 'POST', body });
        setQuestions([res.question, ...questions]);
        setSelectedIds([...selectedIds, res.question._id]);
      }
      setNewQuestion({ type: 'mcq', questionText: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }], answer: '', answerType: 'string', maxScore: 1, tags: [] });
      setTagInput('');
      setShowQuestionForm(false);
    } catch (e) {
      setError(e.message || 'Failed to save question');
    }
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
          testUrl: testUrl.trim() || undefined,
          instructions: instructions.trim() || undefined,
          durationMinutes: Number(durationMinutes) || 0,
          maxAttempts: Number(maxAttempts) || 1,
          questions: selectedIds.map((qid, i) => ({ questionId: qid, order: i, points: 1 })),
        },
      });
      navigate(`/${organization?.slug}/${role}/tests`);
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) return <DashboardLayout sidebar={<Sidebar items={navItems} />}><div style={{ padding: '2rem' }}><p>Permission required.</p></div></DashboardLayout>;

  const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
    title: { fontSize: '2rem', fontWeight: 600, color: theme.colors.text, margin: 0 },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20`, border: `1px solid ${theme.colors.danger}` },
    section: { background: theme.colors.bgCard, padding: theme.spacing.xl, border: `1px solid ${theme.colors.border}`, marginBottom: theme.spacing.lg },
    label: { display: 'block', marginBottom: theme.spacing.sm, color: theme.colors.text, fontWeight: 500 },
    input: { width: '100%', padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, marginBottom: theme.spacing.md },
    inputNumber: { padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    btn: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500 },
    btnSecondary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body },
    checkboxLabel: { display: 'block', marginBottom: theme.spacing.sm, color: theme.colors.text, fontFamily: theme.fonts.body },
    questionItem: { marginBottom: theme.spacing.sm, padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}` },
    questionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs },
    questionActions: { display: 'flex', gap: theme.spacing.xs },
    btnSmall: { padding: `${theme.spacing.xs} ${theme.spacing.sm}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body, fontSize: '0.875rem' },
    questionDetails: { marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm, borderTop: `1px solid ${theme.colors.border}` },
    questionForm: { padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, marginBottom: theme.spacing.md },
    actions: { display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end', marginTop: theme.spacing.lg },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={navItems} />}>
      <div style={s.header}>
        <h1 style={s.title}>Create Test</h1>
        <button type="button" onClick={() => navigate(`/${organization?.slug}/${role}/tests`)} style={s.btnSecondary}>Back to Tests</button>
      </div>
      {error && <div style={s.error}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={s.section}>
          <label style={s.label}>Test Title *</label>
          <input type="text" placeholder="Enter test title" value={title} onChange={(e) => setTitle(e.target.value)} required style={s.input} />
          
          <label style={s.label}>Test URL (optional)</label>
          <input type="text" placeholder="custom-url (leave empty for auto-generated)" value={testUrl} onChange={(e) => setTestUrl(e.target.value)} style={s.input} />
          
          <label style={s.label}>Instructions (optional)</label>
          <textarea placeholder="Enter test-specific instructions for applicants" value={instructions} onChange={(e) => setInstructions(e.target.value)} style={{ ...s.input, minHeight: '100px', resize: 'vertical' }} />
          
          <label style={s.label}>Duration (minutes)</label>
          <input type="number" min={0} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} style={s.inputNumber} />
          
          <label style={s.label}>Max Attempts</label>
          <input type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} style={s.inputNumber} />
        </div>

        <div style={s.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
            <h3 style={{ margin: 0, color: theme.colors.text }}>Questions</h3>
            <button type="button" onClick={() => setShowQuestionForm(!showQuestionForm)} style={s.btnSecondary}>
              {showQuestionForm ? 'Cancel' : '+ Add New Question'}
            </button>
          </div>
          <div style={{ marginBottom: theme.spacing.md }}>
            <input 
              type="text" 
              placeholder="Filter by tags (comma-separated)" 
              value={tagFilter} 
              onChange={(e) => setTagFilter(e.target.value)} 
              style={{ padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, width: '300px' }} 
            />
          </div>

          {showQuestionForm && (
            <div style={s.questionForm}>
              <select value={newQuestion.type} onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })} style={{ ...s.input, marginBottom: theme.spacing.sm }}>
                <option value="mcq">MCQ</option>
                <option value="fillblank">Fill in the Blank</option>
              </select>
              <input type="text" placeholder="Question text" value={newQuestion.questionText} onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })} style={s.input} />
              <input 
                type="text" 
                placeholder="Tags (comma-separated)" 
                value={tagInput} 
                onChange={(e) => setTagInput(e.target.value)} 
                onBlur={() => setNewQuestion({ ...newQuestion, tags: tagInput.split(',').map(t => t.trim()).filter(t => t) })} 
                style={s.input} 
              />
              {newQuestion.tags.length > 0 && (
                <div style={{ marginBottom: theme.spacing.sm }}>
                  {newQuestion.tags.map((tag, i) => (
                    <span key={i} style={{ display: 'inline-block', padding: `${theme.spacing.xs} ${theme.spacing.sm}`, background: theme.colors.primary, color: '#fff', marginRight: theme.spacing.xs, marginBottom: theme.spacing.xs, fontSize: '0.875rem' }}>
                      {tag} <button type="button" onClick={() => setNewQuestion({ ...newQuestion, tags: newQuestion.tags.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: theme.spacing.xs }}>×</button>
                    </span>
                  ))}
                </div>
              )}
              
              {newQuestion.type === 'mcq' && (
                <div>
                  {newQuestion.options.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                      <input type="text" placeholder={`Option ${i + 1}`} value={opt.text} onChange={(e) => {
                        const opts = [...newQuestion.options];
                        opts[i].text = e.target.value;
                        setNewQuestion({ ...newQuestion, options: opts });
                      }} style={{ flex: 1, padding: theme.spacing.sm, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, color: theme.colors.text }}>
                        <input type="radio" checked={opt.isCorrect} onChange={() => {
                          const opts = newQuestion.options.map((o, idx) => ({ ...o, isCorrect: idx === i }));
                          setNewQuestion({ ...newQuestion, options: opts });
                        }} />
                        Correct
                      </label>
                    </div>
                  ))}
                  <button type="button" onClick={() => setNewQuestion({ ...newQuestion, options: [...newQuestion.options, { text: '', isCorrect: false }] })} style={{ ...s.btnSecondary, padding: theme.spacing.sm, fontSize: '0.875rem', marginBottom: theme.spacing.sm }}>+ Add Option</button>
                </div>
              )}
              
              {newQuestion.type === 'fillblank' && (
                <div>
                  <input type="text" placeholder="Answer" value={newQuestion.answer} onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })} style={s.input} />
                  <select value={newQuestion.answerType} onChange={(e) => setNewQuestion({ ...newQuestion, answerType: e.target.value })} style={s.input}>
                    <option value="string">String</option>
                    <option value="integer">Integer</option>
                  </select>
                </div>
              )}
              
              <button type="button" onClick={handleCreateQuestion} style={{ ...s.btn, width: '100%' }}>{editingQuestionId ? 'Update Question' : 'Add Question'}</button>
            </div>
          )}

          <div style={{ marginTop: theme.spacing.lg }}>
            {questions.length === 0 ? (
              <p style={{ color: theme.colors.textMuted }}>No questions available. Create one above.</p>
            ) : (
              questions.map((q) => (
                <div key={q._id} style={s.questionItem}>
                  <div style={s.questionHeader}>
                    <label style={{ color: theme.colors.text, flex: 1, cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedIds.includes(q._id)} onChange={() => toggleQuestion(q._id)} />
                      {' '}<strong>[{q.type.toUpperCase()}]</strong> {expandedQuestionId === q._id ? q.questionText : (q.questionText?.length > 60 ? `${q.questionText.slice(0, 60)}...` : q.questionText)}
                    </label>
                    <div style={s.questionActions}>
                      <button type="button" onClick={() => setExpandedQuestionId(expandedQuestionId === q._id ? null : q._id)} style={s.btnSmall}>
                        {expandedQuestionId === q._id ? 'Hide' : 'View'}
                      </button>
                      <button type="button" onClick={() => openEditQuestion(q)} style={s.btnSmall}>Edit</button>
                    </div>
                  </div>
                  {expandedQuestionId === q._id && (
                    <div style={s.questionDetails}>
                      <div style={{ marginBottom: theme.spacing.sm }}>
                        <strong style={{ color: theme.colors.text, display: 'block', marginBottom: theme.spacing.xs }}>Question:</strong>
                        <p style={{ color: theme.colors.text, margin: 0 }}>{q.questionText}</p>
                      </div>
                      {q.type === 'mcq' && q.options && (
                        <div style={{ marginBottom: theme.spacing.sm }}>
                          <strong style={{ color: theme.colors.text, display: 'block', marginBottom: theme.spacing.xs }}>Options:</strong>
                          <ul style={{ margin: 0, paddingLeft: theme.spacing.lg }}>
                            {q.options.map((opt, i) => (
                              <li key={i} style={{ color: theme.colors.text, marginBottom: theme.spacing.xs }}>
                                {opt.text} {opt.isCorrect && <span style={{ color: theme.colors.success, fontWeight: 500 }}>(Correct)</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {q.type === 'fillblank' && (
                        <div style={{ marginBottom: theme.spacing.sm }}>
                          <strong style={{ color: theme.colors.text, display: 'block', marginBottom: theme.spacing.xs }}>Answer:</strong>
                          <p style={{ color: theme.colors.text, margin: 0 }}>{q.answer} <span style={{ color: theme.colors.textMuted }}>({q.answerType})</span></p>
                        </div>
                      )}
                      <div>
                        <strong style={{ color: theme.colors.text, display: 'inline', marginRight: theme.spacing.xs }}>Max Score:</strong>
                        <span style={{ color: theme.colors.text }}>{q.maxScore}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div style={s.actions}>
          <button type="button" onClick={() => navigate(`/${organization?.slug}/${role}/tests`)} style={s.btnSecondary}>Cancel</button>
          <button type="submit" disabled={saving} style={s.btn}>{saving ? 'Creating...' : 'Create Test'}</button>
        </div>
      </form>
    </DashboardLayout>
  );
}
