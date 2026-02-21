import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'closed', label: 'Closed' },
];

export default function DashboardManager() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [forms, setForms] = useState([]);
  const [tests, setTests] = useState([]);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'draft', assignedManagerId: '', formId: '', testId: '' });
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const canEdit = user?.role === 'Admin' || user?.canPostJobs === true;

  const getNavItems = () => {
    const items = [
      { path: '/dashboard', label: 'Dashboard' },
      ...(user?.role === 'Admin' ? [{ path: '/dashboard/admin', label: 'Organization' }] : []),
      { path: '/dashboard/manager', label: 'Positions' },
    ];
    if (canEdit) {
      items.push(
        { path: '/dashboard/forms', label: 'Forms' },
        { path: '/dashboard/questions', label: 'Questions' },
        { path: '/dashboard/tests', label: 'Tests' }
      );
    }
    items.push(
      { path: '/dashboard/analytics', label: 'Analytics' },
      { path: '/dashboard/profile', label: 'Profile' }
    );
    return items;
  };

  const load = useCallback(async () => {
    if (!user || (user.role !== 'Admin' && user.role !== 'Manager')) return;
    setError('');
    try {
      const [orgRes, positionsRes, managersRes, formsRes, testsRes] = await Promise.all([
        api.api('/organizations/me'),
        api.api(`/organizations/me/positions${statusFilter ? `?status=${statusFilter}` : ''}`),
        api.api('/organizations/me/managers'),
        api.api('/organizations/me/forms').catch(() => ({ forms: [] })),
        api.api('/organizations/me/tests').catch(() => ({ tests: [] })),
      ]);
      setOrg(orgRes.organization);
      setPositions(positionsRes.positions || []);
      setManagers(managersRes.managers?.filter((m) => m.isActive && !m.pendingApproval) || []);
      setForms(formsRes.forms || []);
      setTests(testsRes.tests || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm({ title: '', description: '', status: 'draft', assignedManagerId: '', formId: '', testId: '' });
    setShowModal(true);
  }

  function openEdit(p) {
    setEditingId(p._id);
    setForm({
      title: p.title,
      description: p.description || '',
      status: p.status,
      assignedManagerId: p.assignedManagerId?._id || '',
      formId: p.formId?._id || '',
      testId: p.testId?._id || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        assignedManagerId: form.assignedManagerId || undefined,
        formId: form.formId || undefined,
        testId: form.testId || undefined,
      };
      if (editingId) {
        await api.api(`/organizations/me/positions/${editingId}`, { method: 'PATCH', body });
      } else {
        await api.api('/organizations/me/positions', { method: 'POST', body });
      }
      setShowModal(false);
      load();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(positionId, status) {
    setError('');
    try {
      await api.api(`/organizations/me/positions/${positionId}`, { method: 'PATCH', body: { status } });
      load();
    } catch (e) {
      setError(e.message || 'Update failed');
    }
  }

  const getStatusColor = (status) => {
    if (status === 'published') return theme.colors.success;
    if (status === 'closed') return theme.colors.danger;
    return theme.colors.textMuted;
  };

  if (user?.role !== 'Admin' && user?.role !== 'Manager') return null;

  const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.xl },
    title: { fontSize: '2rem', fontWeight: 600, margin: 0 },
    warning: { color: theme.colors.warning, fontSize: '0.9rem', marginTop: theme.spacing.sm },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20` },
    toolbar: { display: 'flex', gap: theme.spacing.md, marginBottom: theme.spacing.lg, alignItems: 'center' },
    select: { padding: theme.spacing.md, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    link: { color: theme.colors.primary, textDecoration: 'none', fontSize: '0.9rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: theme.spacing.lg },
    card: { background: theme.colors.bgCard, padding: theme.spacing.xl, border: `1px solid ${theme.colors.border}` },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.md, marginBottom: theme.spacing.md },
    cardTitle: { fontSize: '1.25rem', fontWeight: 600, margin: 0 },
    badge: { padding: `${theme.spacing.xs} ${theme.spacing.md}`, fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' },
    cardDesc: { color: theme.colors.textMuted, fontSize: '0.9rem', marginBottom: theme.spacing.md },
    cardMeta: { display: 'flex', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
    metaItem: { fontSize: '0.875rem', color: theme.colors.textMuted, background: theme.colors.bg, padding: `${theme.spacing.xs} ${theme.spacing.sm}` },
    cardActions: { display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' },
    btnPrimary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500, fontSize: '0.95rem' },
    btnSecondary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body },
    btnSmall: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontSize: '0.875rem', fontFamily: theme.fonts.body, textDecoration: 'none', display: 'inline-block' },
    empty: { textAlign: 'center', padding: theme.spacing.xxl },
    emptyText: { fontSize: '1.25rem', color: theme.colors.textMuted, marginBottom: theme.spacing.lg },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modal: { background: theme.colors.bgCard, padding: theme.spacing.xl, maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto', border: `1px solid ${theme.colors.border}` },
    modalTitle: { fontSize: '1.5rem', fontWeight: 600, marginBottom: theme.spacing.lg },
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.lg },
    formGroup: { display: 'flex', flexDirection: 'column', gap: theme.spacing.sm },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md },
    label: { color: theme.colors.textMuted, fontSize: '0.875rem', fontWeight: 500 },
    input: { padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    textarea: { padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, resize: 'vertical' },
    modalActions: { display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end', marginTop: theme.spacing.md },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={getNavItems()} />}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Job Positions</h1>
          {!canEdit && <p style={s.warning}>Contact Admin to get "Can post jobs" permission</p>}
        </div>
        {canEdit && (
          <button onClick={openCreate} style={s.btnPrimary}>
            Create Position
          </button>
        )}
      </div>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.toolbar}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={s.select}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {org && (
          <a href={`/jobs?org=${encodeURIComponent(org.slug)}`} target="_blank" rel="noopener noreferrer" style={s.link}>
            Public Listing
          </a>
        )}
      </div>

      {loading ? <p>Loading...</p> : positions.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyText}>No positions yet</p>
          {canEdit && <button onClick={openCreate} style={s.btnPrimary}>Create First Position</button>}
        </div>
      ) : (
        <div style={s.grid}>
          {positions.map((p) => (
            <div key={p._id} style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>{p.title}</h3>
                <span style={{ ...s.badge, background: `${getStatusColor(p.status)}20`, color: getStatusColor(p.status) }}>
                  {p.status}
                </span>
              </div>
              {p.description && <p style={s.cardDesc}>{p.description.slice(0, 100)}...</p>}
              <div style={s.cardMeta}>
                {p.formId && <span style={s.metaItem}>Form: {p.formId.name}</span>}
                {p.testId && <span style={s.metaItem}>Test: {p.testId.title}</span>}
                {p.assignedManagerId && <span style={s.metaItem}>Manager: {p.assignedManagerId.name}</span>}
              </div>
              <div style={s.cardActions}>
                {canEdit && (
                  <>
                    <button onClick={() => openEdit(p)} style={s.btnSmall}>Edit</button>
                    <Link to={`/dashboard/positions/${p._id}/submissions`} style={s.btnSmall}>Submissions</Link>
                    <Link to={`/dashboard/positions/${p._id}/attempts`} style={s.btnSmall}>Attempts</Link>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && canEdit && (
        <div style={s.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editingId ? 'Edit Position' : 'Create Position'}</h2>
            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.formGroup}>
                <label style={s.label}>Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  style={s.input}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  style={s.textarea}
                />
              </div>
              <div style={s.formRow}>
                <div style={s.formGroup}>
                  <label style={s.label}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    style={s.select}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Assigned Manager</label>
                  <select
                    value={form.assignedManagerId}
                    onChange={(e) => setForm((f) => ({ ...f, assignedManagerId: e.target.value }))}
                    style={s.select}
                  >
                    <option value="">- None -</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={s.formRow}>
                <div style={s.formGroup}>
                  <label style={s.label}>Application Form</label>
                  <select
                    value={form.formId}
                    onChange={(e) => setForm((f) => ({ ...f, formId: e.target.value }))}
                    style={s.select}
                  >
                    <option value="">- None -</option>
                    {forms.map((f) => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Test</label>
                  <select
                    value={form.testId}
                    onChange={(e) => setForm((f) => ({ ...f, testId: e.target.value }))}
                    style={s.select}
                  >
                    <option value="">- None -</option>
                    {tests.map((t) => (
                      <option key={t._id} value={t._id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={s.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={s.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={s.btnPrimary}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
