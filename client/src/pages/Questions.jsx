import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

export default function Questions() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [tagFilter, setTagFilter] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [form, setForm] = useState({ type: 'mcq', questionText: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }], answer: '', answerType: 'string', maxScore: 1, tags: [] });

  const canEdit = user?.role === 'Admin' || user?.canPostJobs === true;

  const load = useCallback(async () => {
    try {
      const url = tagFilter ? `/organizations/me/questions?tags=${encodeURIComponent(tagFilter)}` : '/organizations/me/questions';
      const res = await api.api(url);
      setQuestions(res.questions || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tagFilter]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm({ type: 'mcq', questionText: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }], answer: '', answerType: 'string', maxScore: 1, tags: [] });
    setShowModal(true);
  }

  function openEdit(q) {
    setEditingId(q._id);
    if (q.type === 'mcq') {
      setForm({ type: 'mcq', questionText: q.questionText, options: q.options || [{ text: '', isCorrect: false }, { text: '', isCorrect: false }], answer: '', answerType: 'string', maxScore: q.maxScore || 1, tags: q.tags || [] });
    } else if (q.type === 'fillblank') {
      setForm({ type: 'fillblank', questionText: q.questionText, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }], answer: q.answer || '', answerType: q.answerType || 'string', maxScore: q.maxScore || 1, tags: q.tags || [] });
    }
    setTagInput((q.tags || []).join(', '));
    setShowModal(true);
  }

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
    if (form.type === 'mcq') {
      if (form.options.filter((o) => o.text.trim()).length < 2) {
        setError('MCQ needs at least 2 options with text');
        return;
      }
      if (form.options.filter((o) => o.isCorrect).length !== 1) {
        setError('Exactly one option must be correct');
        return;
      }
    }
    if (form.type === 'fillblank' && !form.answer.trim()) {
      setError('Answer is required for fill in the blank');
      return;
    }
    setError('');
    try {
      const body = { type: form.type, questionText: form.questionText.trim(), maxScore: form.maxScore, tags: form.tags };
      if (form.type === 'mcq') {
        body.options = form.options.filter((o) => o.text.trim()).map((o) => ({ text: o.text.trim(), isCorrect: !!o.isCorrect }));
      } else if (form.type === 'fillblank') {
        body.answer = form.answer.trim();
        body.answerType = form.answerType;
      }
      if (editingId) {
        await api.api(`/organizations/me/questions/${editingId}`, { method: 'PATCH', body });
      } else {
        await api.api('/organizations/me/questions', { method: 'POST', body });
      }
      setShowModal(false);
      setForm({ type: 'mcq', questionText: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }], answer: '', answerType: 'string', maxScore: 1, tags: [] });
      setEditingId(null);
      load();
    } catch (e) {
      setError(e.message || 'Save failed');
    }
  }

  const { theme } = useTheme();

  const navItems = user?.role === 'Admin'
    ? [{ label: 'Dashboard', path: '/dashboard/admin' }, { label: 'Organization', path: '/dashboard/organization' }, { label: 'Positions', path: '/dashboard/manager' }, { label: 'Forms', path: '/dashboard/forms' }, { label: 'Questions', path: '/dashboard/questions' }, { label: 'Tests', path: '/dashboard/tests' }, { label: 'Analytics', path: '/dashboard/analytics' }, { label: 'Profile', path: '/dashboard/profile' }]
    : user?.canPostJobs
    ? [{ label: 'Dashboard', path: '/dashboard/manager' }, { label: 'Positions', path: '/dashboard/manager' }, { label: 'Forms', path: '/dashboard/forms' }, { label: 'Questions', path: '/dashboard/questions' }, { label: 'Tests', path: '/dashboard/tests' }, { label: 'Analytics', path: '/dashboard/analytics' }, { label: 'Profile', path: '/dashboard/profile' }]
    : [{ label: 'Dashboard', path: '/dashboard/manager' }, { label: 'Profile', path: '/dashboard/profile' }];

  if (!canEdit) return <DashboardLayout sidebar={<Sidebar items={navItems} />}><div style={{ padding: '2rem' }}><p>Permission required.</p></div></DashboardLayout>;

  const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
    title: { fontSize: '2rem', fontWeight: 600, color: theme.colors.text, margin: 0 },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20`, border: `1px solid ${theme.colors.danger}` },
    btn: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500, marginBottom: theme.spacing.xl },
    list: { listStyle: 'none', padding: 0 },
    listItem: { marginBottom: theme.spacing.md, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}` },
    listItemHeader: { padding: theme.spacing.lg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    listItemContent: { padding: theme.spacing.lg, borderTop: `1px solid ${theme.colors.border}`, background: theme.colors.bg },
    btnEdit: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body, marginLeft: theme.spacing.sm },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modal: { background: theme.colors.bgCard, padding: theme.spacing.xl, maxWidth: '480px', width: '90%', border: `1px solid ${theme.colors.border}` },
    modalTitle: { fontSize: '1.5rem', fontWeight: 600, marginBottom: theme.spacing.lg, color: theme.colors.text },
    select: { width: '100%', marginBottom: theme.spacing.md, padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    textarea: { width: '100%', marginBottom: theme.spacing.md, padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    input: { padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, marginRight: theme.spacing.sm },
    optionRow: { marginBottom: theme.spacing.sm, display: 'flex', alignItems: 'center', gap: theme.spacing.sm },
    btnSecondary: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body, marginBottom: theme.spacing.md },
    actions: { marginTop: theme.spacing.lg, display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' },
    btnPrimary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500 },
    btnCancel: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={navItems} />}>
      <div style={s.header}>
        <h1 style={s.title}>Question Bank</h1>
        <button type="button" onClick={openCreate} style={s.btn}>Add Question</button>
      </div>
      <div style={{ marginBottom: theme.spacing.lg }}>
        <input 
          type="text" 
          placeholder="Filter by tags (comma-separated)" 
          value={tagFilter} 
          onChange={(e) => setTagFilter(e.target.value)} 
          style={{ padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, width: '300px' }} 
        />
      </div>
      {error && <div style={s.error}>{error}</div>}
      {loading ? <p>Loading...</p> : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: theme.spacing.xxl }}>
          <p style={{ fontSize: '1.25rem', color: theme.colors.textMuted, marginBottom: theme.spacing.lg }}>No questions created yet</p>
          <button type="button" onClick={openCreate} style={s.btn}>Add First Question</button>
        </div>
      ) : (
        <ul style={s.list}>
          {questions.map((q) => (
            <li key={q._id} style={s.listItem}>
              <div style={s.listItemHeader}>
                <div>
                  <strong>[{q.type.toUpperCase()}]</strong> {expandedId === q._id ? q.questionText : (q.questionText?.length > 80 ? `${q.questionText.slice(0, 80)}...` : q.questionText)}
                </div>
                <div>
                  <button type="button" onClick={() => setExpandedId(expandedId === q._id ? null : q._id)} style={s.btnEdit}>
                    {expandedId === q._id ? 'Hide' : 'View'}
                  </button>
                  <button type="button" onClick={() => openEdit(q)} style={s.btnEdit}>Edit</button>
                </div>
              </div>
              {expandedId === q._id && (
                <div style={s.listItemContent}>
                  <div style={{ marginBottom: theme.spacing.md }}>
                    <strong style={{ color: theme.colors.text, display: 'block', marginBottom: theme.spacing.xs }}>Question:</strong>
                    <p style={{ color: theme.colors.text, margin: 0 }}>{q.questionText}</p>
                  </div>
                  {q.type === 'mcq' && q.options && (
                    <div style={{ marginBottom: theme.spacing.md }}>
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
                    <div style={{ marginBottom: theme.spacing.md }}>
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
            </li>
          ))}
        </ul>
      )}
      {showModal && (
        <div style={s.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editingId ? 'Edit Question' : 'New Question'}</h2>
            <form onSubmit={handleSubmit}>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={s.select}>
                <option value="mcq">MCQ</option>
                <option value="fillblank">Fill in the Blank</option>
              </select>
              <textarea placeholder="Question text" value={form.questionText} onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))} required rows={3} style={s.textarea} />
              <input 
                type="text" 
                placeholder="Tags (comma-separated)" 
                value={tagInput} 
                onChange={(e) => setTagInput(e.target.value)} 
                onBlur={() => setForm((f) => ({ ...f, tags: tagInput.split(',').map(t => t.trim()).filter(t => t) }))} 
                style={{ ...s.textarea, marginBottom: theme.spacing.md }} 
              />
              {form.tags.length > 0 && (
                <div style={{ marginBottom: theme.spacing.md }}>
                  {form.tags.map((tag, i) => (
                    <span key={i} style={{ display: 'inline-block', padding: `${theme.spacing.xs} ${theme.spacing.sm}`, background: theme.colors.primary, color: '#fff', marginRight: theme.spacing.xs, marginBottom: theme.spacing.xs, fontSize: '0.875rem' }}>
                      {tag} <button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: theme.spacing.xs }}>×</button>
                    </span>
                  ))}
                </div>
              )}
              {form.type === 'mcq' && (
                <>
                  {form.options.map((o, i) => (
                    <div key={i} style={s.optionRow}>
                      <input type="text" placeholder="Option" value={o.text} onChange={(e) => setOption(i, 'text', e.target.value)} style={s.input} />
                      <label style={{ color: theme.colors.text }}><input type="radio" name="correct" checked={o.isCorrect} onChange={() => setOption(i, 'isCorrect', true)} /> Correct</label>
                    </div>
                  ))}
                  <button type="button" onClick={addOption} style={s.btnSecondary}>Add Option</button>
                </>
              )}
              {form.type === 'fillblank' && (
                <>
                  <input type="text" placeholder="Answer" value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} style={{ ...s.input, width: '100%', marginBottom: theme.spacing.md }} />
                  <select value={form.answerType} onChange={(e) => setForm((f) => ({ ...f, answerType: e.target.value }))} style={s.select}>
                    <option value="string">String</option>
                    <option value="integer">Integer</option>
                  </select>
                </>
              )}
              <div style={s.actions}>
                <button type="button" onClick={() => setShowModal(false)} style={s.btnCancel}>Cancel</button>
                <button type="submit" style={s.btnPrimary}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
