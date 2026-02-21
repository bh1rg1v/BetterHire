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

  const { theme } = useTheme();

  const navItems = user?.role === 'Admin'
    ? [{ label: 'Dashboard', path: '/dashboard/admin' }, { label: 'Organization', path: '/dashboard/organization' }, { label: 'Positions', path: '/dashboard/manager' }, { label: 'Forms', path: '/dashboard/forms' }, { label: 'Questions', path: '/dashboard/questions' }, { label: 'Tests', path: '/dashboard/tests' }, { label: 'Analytics', path: '/dashboard/analytics' }, { label: 'Profile', path: '/dashboard/profile' }]
    : user?.canPostJobs
    ? [{ label: 'Dashboard', path: '/dashboard/manager' }, { label: 'Positions', path: '/dashboard/manager' }, { label: 'Forms', path: '/dashboard/forms' }, { label: 'Questions', path: '/dashboard/questions' }, { label: 'Tests', path: '/dashboard/tests' }, { label: 'Analytics', path: '/dashboard/analytics' }, { label: 'Profile', path: '/dashboard/profile' }]
    : [{ label: 'Dashboard', path: '/dashboard/manager' }, { label: 'Profile', path: '/dashboard/profile' }];

  if (!canEdit) return <DashboardLayout sidebar={<Sidebar items={navItems} />}><div style={{ padding: '2rem' }}><p>Permission required.</p></div></DashboardLayout>;

  const s = {
    title: { fontSize: '2rem', fontWeight: 600, marginBottom: theme.spacing.xl, color: theme.colors.text },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20`, border: `1px solid ${theme.colors.danger}` },
    btn: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500, marginBottom: theme.spacing.xl },
    list: { listStyle: 'none', padding: 0 },
    listItem: { marginBottom: theme.spacing.md, padding: theme.spacing.lg, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}` },
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
      <h1 style={s.title}>Question Bank</h1>
      {error && <div style={s.error}>{error}</div>}
      <button type="button" onClick={() => setShowModal(true)} style={s.btn}>Add Question</button>
      {loading ? <p>Loading...</p> : (
        <ul style={s.list}>
          {questions.map((q) => (
            <li key={q._id} style={s.listItem}>
              <strong>[{q.type}]</strong> {q.questionText?.slice(0, 80)}...
            </li>
          ))}
        </ul>
      )}
      {showModal && (
        <div style={s.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>New Question</h2>
            <form onSubmit={handleSubmit}>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={s.select}>
                <option value="mcq">MCQ</option>
                <option value="descriptive">Descriptive</option>
              </select>
              <textarea placeholder="Question text" value={form.questionText} onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))} required rows={3} style={s.textarea} />
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
