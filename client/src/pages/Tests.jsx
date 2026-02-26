import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOrg } from '../context/OrgContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

export default function Tests() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { organization } = useOrg();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const canEdit = user?.role === 'Admin' || user?.canPostJobs === true;
  const orgSlug = organization?.slug;
  const userRole = user?.role?.toLowerCase();

  const load = useCallback(async () => {
    try {
      const res = await api.api('/organizations/me/tests');
      setTests(res.tests || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function copyTestUrl(test) {
    const url = `${window.location.origin}/test/${test.testUrl}`;
    navigator.clipboard.writeText(url);
    setCopiedId(test._id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const navItems = !orgSlug ? [] : user?.role === 'Admin'
    ? [{ label: 'Dashboard', path: `/${orgSlug}/admin/dashboard` }, { label: 'Forms', path: `/${orgSlug}/admin/forms` }, { label: 'Questions', path: `/${orgSlug}/admin/questions` }, { label: 'Tests', path: `/${orgSlug}/admin/tests` }, { label: 'Analytics', path: `/${orgSlug}/admin/analytics` }, { label: 'Profile', path: '/dashboard/profile' }]
    : user?.canPostJobs
    ? [{ label: 'Dashboard', path: `/${orgSlug}/manager/dashboard` }, { label: 'Forms', path: `/${orgSlug}/manager/forms` }, { label: 'Questions', path: `/${orgSlug}/manager/questions` }, { label: 'Tests', path: `/${orgSlug}/manager/tests` }, { label: 'Analytics', path: `/${orgSlug}/manager/analytics` }, { label: 'Profile', path: '/dashboard/profile' }]
    : [{ label: 'Dashboard', path: `/${orgSlug}/manager/dashboard` }, { label: 'Profile', path: '/dashboard/profile' }];

  if (!canEdit) return <DashboardLayout sidebar={<Sidebar items={navItems} />}><div style={{ padding: '2rem' }}><p>Permission required.</p></div></DashboardLayout>;

  const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
    title: { fontSize: '2rem', fontWeight: 600, color: theme.colors.text, margin: 0 },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20`, border: `1px solid ${theme.colors.danger}` },
    btn: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500, marginBottom: theme.spacing.xl, textDecoration: 'none', display: 'inline-block' },
    list: { listStyle: 'none', padding: 0 },
    listItem: { marginBottom: theme.spacing.md, padding: theme.spacing.lg, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    btnEdit: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body, textDecoration: 'none', display: 'inline-block' },
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
      <div style={s.header}>
        <h1 style={s.title}>Tests</h1>
        <Link to={`/${orgSlug}/${userRole}/tests/create`} style={s.btn}>Create Test</Link>
      </div>
      {error && <div style={s.error}>{error}</div>}
      {loading ? <p>Loading...</p> : tests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: theme.spacing.xxl }}>
          <p style={{ fontSize: '1.25rem', color: theme.colors.textMuted, marginBottom: theme.spacing.lg }}>No tests created yet</p>
          <Link to={`/${orgSlug}/${userRole}/tests/create`} style={s.btn}>Create First Test</Link>
        </div>
      ) : (
        <ul style={s.list}>
          {tests.map((t) => (
            <li key={t._id} style={s.listItem}>
              <div>
                <strong>{t.title}</strong> - {t.durationMinutes} min - {t.questions?.length || 0} questions
              </div>
              <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                <Link to={`/test/${t.testUrl}`} target="_blank" style={s.btnEdit}>Preview</Link>
                <button type="button" onClick={() => copyTestUrl(t)} style={s.btnEdit}>
                  {copiedId === t._id ? 'Copied!' : 'Copy URL'}
                </button>
                <Link to={`/${orgSlug}/${userRole}/tests/${t._id}/edit`} style={s.btnEdit}>Edit</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}
