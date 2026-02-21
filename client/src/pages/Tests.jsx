import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
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
    modal: { background: theme.colors.bgCard, padding: theme.spacing.xl, maxWidth: '520px', width: '90%', maxHeight: '90vh', overflow: 'auto', border: `1px solid ${theme.colors.border}` },
    modalTitle: { fontSize: '1.5rem', fontWeight: 600, marginBottom: theme.spacing.lg, color: theme.colors.text },
    input: { width: '100%', marginBottom: theme.spacing.md, padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    label: { display: 'block', marginBottom: theme.spacing.md, color: theme.colors.text, fontFamily: theme.fonts.body },
    inputNumber: { marginLeft: theme.spacing.sm, padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    checkboxLabel: { display: 'block', marginBottom: theme.spacing.xs, color: theme.colors.text, fontFamily: theme.fonts.body },
    actions: { marginTop: theme.spacing.lg, display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' },
    btnPrimary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500 },
    btnCancel: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={navItems} />}>
      <h1 style={s.title}>Tests</h1>
      {error && <div style={s.error}>{error}</div>}
      <button type="button" onClick={() => setShowModal(true)} style={s.btn}>Create Test</button>
      {loading ? <p>Loading...</p> : (
        <ul style={s.list}>
          {tests.map((t) => (
            <li key={t._id} style={s.listItem}>
              <strong>{t.title}</strong> - {t.durationMinutes} min - {t.questions?.length || 0} questions
            </li>
          ))}
        </ul>
      )}
      {showModal && (
        <div style={s.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Create Test</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Test title" value={title} onChange={(e) => setTitle(e.target.value)} required style={s.input} />
              <label style={s.label}>
                Duration (minutes):
                <input type="number" min={0} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} style={s.inputNumber} />
              </label>
              <p style={{ color: theme.colors.text, marginBottom: theme.spacing.sm }}>Select questions:</p>
              {questions.map((q) => (
                <label key={q._id} style={s.checkboxLabel}>
                  <input type="checkbox" checked={selectedIds.includes(q._id)} onChange={() => toggleQuestion(q._id)} />
                  {' '}[{q.type}] {q.questionText?.slice(0, 60)}...
                </label>
              ))}
              <div style={s.actions}>
                <button type="button" onClick={() => setShowModal(false)} style={s.btnCancel}>Cancel</button>
                <button type="submit" disabled={saving} style={s.btnPrimary}>{saving ? 'Saving...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
