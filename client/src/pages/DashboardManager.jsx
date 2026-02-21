import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'closed', label: 'Closed' },
];

export default function DashboardManager() {
  const { user, logout } = useAuth();
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [forms, setForms] = useState([]);
  const [tests, setTests] = useState([]);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'draft', assignedManagerId: '', formId: '', testId: '' });
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const canEdit = user?.role === 'Admin' || user?.canPostJobs === true;

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

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm({ title: '', description: '', status: 'draft', assignedManagerId: '', formId: '', testId: '' });
    setShowForm(true);
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
    setShowForm(true);
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
      setShowForm(false);
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

  if (user?.role !== 'Admin' && user?.role !== 'Manager') {
    return (
      <div style={styles.page}>
        <p style={styles.unauthorized}>Manager or Admin access required.</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/dashboard" style={styles.logo}>BetterHire</Link>
        <div style={styles.userRow}>
          <span style={styles.userName}>{user?.name}</span>
          <span style={styles.role}>{user?.role}</span>
          {org && <span style={styles.org}> · {org.name}</span>}
          <button type="button" onClick={logout} style={styles.logoutBtn}>Sign out</button>
        </div>
      </header>
      <main style={styles.main}>
        <h1 style={styles.h1}>Job positions</h1>
        <p style={styles.navLinks}>
          {canEdit && <Link to="/dashboard/forms" style={styles.link}>Forms</Link>}
          {canEdit && <Link to="/dashboard/questions" style={styles.link}>Question bank</Link>}
          {canEdit && <Link to="/dashboard/tests" style={styles.link}>Tests</Link>}
          <Link to="/dashboard/analytics" style={styles.link}>Analytics</Link>
          <Link to="/dashboard/analytics" style={styles.link}>Analytics &amp; export</Link>
        </p>
        {!canEdit && (
          <p style={styles.muted}>You don’t have permission to create or edit positions. Contact your Admin to get &quot;Can post jobs&quot;.</p>
        )}
        {error && <div style={styles.error}>{error}</div>}
        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            <div style={styles.toolbar}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.select}
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {canEdit && (
                <button type="button" onClick={openCreate} style={styles.btnPrimary}>
                  Create position
                </button>
              )}
            </div>
            {positions.length === 0 ? (
              <p style={styles.muted}>No positions yet.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Form</th>
                    <th style={styles.th}>Test</th>
                    <th style={styles.th}>Assigned manager</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr key={p._id}>
                      <td style={styles.td}>{p.title}</td>
                      <td style={styles.td}>
                        <span style={p.status === 'published' ? styles.badgeOk : p.status === 'closed' ? styles.badgeDanger : styles.badgeMuted}>
                          {p.status}
                        </span>
                      </td>
                      <td style={styles.td}>{p.formId?.name || '—'}</td>
                      <td style={styles.td}>{p.testId?.title || '—'}</td>
                      <td style={styles.td}>{p.assignedManagerId ? p.assignedManagerId.name : '—'}</td>
                      <td style={styles.td}>
                        {canEdit && (
                          <>
                            <button type="button" onClick={() => openEdit(p)} style={styles.btnSmall}>Edit</button>
                            <Link to={`/dashboard/positions/${p._id}/submissions`} style={styles.btnSmall}>Submissions</Link>
                            <Link to={`/dashboard/positions/${p._id}/attempts`} style={styles.btnSmall}>Attempts</Link>
                            {p.status !== 'draft' && (
                              <button type="button" onClick={() => setStatus(p._id, 'draft')} style={styles.btnSmall}>Draft</button>
                            )}
                            {p.status !== 'published' && (
                              <button type="button" onClick={() => setStatus(p._id, 'published')} style={styles.btnSmall}>Publish</button>
                            )}
                            {p.status !== 'closed' && (
                              <button type="button" onClick={() => setStatus(p._id, 'closed')} style={styles.btnSmall}>Close</button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {org && (
              <p style={styles.publicLink}>
                Public listing: <a href={`/jobs?org=${encodeURIComponent(org.slug)}`} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  /jobs?org={org.slug}
                </a>
              </p>
            )}
          </>
        )}
      </main>

      {showForm && canEdit && (
        <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editingId ? 'Edit position' : 'Create position'}</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
                style={styles.input}
              />
              <label style={styles.label}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                style={{ ...styles.input, resize: 'vertical' }}
              />
              <label style={styles.label}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                style={styles.input}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <label style={styles.label}>Application form</label>
              <select
                value={form.formId}
                onChange={(e) => setForm((f) => ({ ...f, formId: e.target.value }))}
                style={styles.input}
              >
                <option value="">— None —</option>
                {forms.map((f) => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
              <label style={styles.label}>Test</label>
              <select
                value={form.testId}
                onChange={(e) => setForm((f) => ({ ...f, testId: e.target.value }))}
                style={styles.input}
              >
                <option value="">— None —</option>
                {tests.map((t) => (
                  <option key={t._id} value={t._id}>{t.title}</option>
                ))}
              </select>
              <label style={styles.label}>Assigned manager</label>
              <select
                value={form.assignedManagerId}
                onChange={(e) => setForm((f) => ({ ...f, assignedManagerId: e.target.value }))}
                style={styles.input}
              >
                <option value="">— None —</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                ))}
              </select>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.btnSecondary}>Cancel</button>
                <button type="submit" disabled={saving} style={styles.btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a', color: '#f1f5f9' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    borderBottom: '1px solid #334155',
  },
  logo: { fontWeight: 700, fontSize: '1.25rem', color: '#f1f5f9', textDecoration: 'none' },
  userRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  userName: { fontWeight: 500 },
  role: { color: '#94a3b8', fontSize: '0.9rem' },
  org: { color: '#64748b', fontSize: '0.9rem' },
  logoutBtn: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: '1px solid #475569',
    borderRadius: 6,
    color: '#94a3b8',
    cursor: 'pointer',
  },
  main: { padding: '2rem', maxWidth: 960 },
  h1: { margin: '0 0 1rem' },
  muted: { color: '#94a3b8', marginBottom: '1rem' },
  error: { color: '#f87171', marginBottom: '1rem' },
  toolbar: { display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' },
  select: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #334155',
    borderRadius: 6,
    background: '#1e293b',
    color: '#f1f5f9',
  },
  btnPrimary: { padding: '0.5rem 1rem', background: '#3b82f6', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' },
  btnSecondary: { padding: '0.5rem 1rem', background: '#334155', border: 'none', borderRadius: 6, color: '#e2e8f0', cursor: 'pointer' },
  btnSmall: { marginRight: '0.5rem', padding: '0.25rem 0.5rem', background: '#334155', border: 'none', borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: '0.875rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #334155' },
  td: { padding: '0.5rem', borderBottom: '1px solid #334155' },
  badgeOk: { color: '#86efac', fontSize: '0.85rem' },
  badgeMuted: { color: '#94a3b8', fontSize: '0.85rem' },
  badgeDanger: { color: '#f87171', fontSize: '0.85rem' },
  navLinks: { marginBottom: '1rem', display: 'flex', gap: '1rem' },
  publicLink: { marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.9rem' },
  link: { color: '#60a5fa' },
  unauthorized: { color: '#94a3b8', marginBottom: '1rem' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1e293b', padding: '1.5rem', borderRadius: 12, maxWidth: 480, width: '90%', maxHeight: '90vh', overflow: 'auto' },
  modalTitle: { margin: '0 0 1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  label: { color: '#94a3b8', fontSize: '0.875rem' },
  input: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #334155',
    borderRadius: 6,
    background: '#0f172a',
    color: '#f1f5f9',
    fontSize: '1rem',
  },
  modalActions: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' },
};
