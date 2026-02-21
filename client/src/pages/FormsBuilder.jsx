import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

const FIELD_TYPES = ['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio'];

export default function FormsBuilder() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);

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
    try {
      const res = await api.api('/organizations/me/forms');
      setForms(res.forms || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditingId(null);
    setName('');
    setFields([{ id: 'f1', type: 'text', label: 'Field 1', required: false, placeholder: '', options: [] }]);
    setShowModal(true);
  }

  function openEdit(form) {
    setEditingId(form._id);
    setName(form.name);
    setFields((form.schema?.fields || []).length ? form.schema.fields : [{ id: 'f1', type: 'text', label: 'Field 1', required: false }]);
    setShowModal(true);
  }

  function addField() {
    setFields((f) => [...f, { id: `f${Date.now()}`, type: 'text', label: `Field ${f.length + 1}`, required: false, options: [] }]);
  }

  function updateField(index, key, value) {
    setFields((f) => f.map((field, i) => (i === index ? { ...field, [key]: value } : field)));
  }

  function removeField(index) {
    setFields((f) => f.filter((_, i) => i !== index));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const schema = { fields };
      if (editingId) {
        await api.api(`/organizations/me/forms/${editingId}`, { method: 'PATCH', body: { name: name.trim(), schema } });
      } else {
        await api.api('/organizations/me/forms', { method: 'POST', body: { name: name.trim(), schema } });
      }
      setShowModal(false);
      load();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) return null;

  const s = {
    title: { fontSize: '2rem', fontWeight: 600, marginBottom: theme.spacing.xl },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20` },
    btn: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500, marginBottom: theme.spacing.lg },
    list: { listStyle: 'none', padding: 0 },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, marginBottom: theme.spacing.sm },
    btnSmall: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontSize: '0.875rem', fontFamily: theme.fonts.body },
    btnDanger: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.danger, border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontFamily: theme.fonts.body },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modal: { background: theme.colors.bgCard, padding: theme.spacing.xl, maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto', border: `1px solid ${theme.colors.border}` },
    modalTitle: { fontSize: '1.5rem', fontWeight: 600, marginBottom: theme.spacing.lg },
    input: { display: 'block', width: '100%', marginBottom: theme.spacing.sm, padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    select: { padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    fieldRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md, padding: theme.spacing.md, background: theme.colors.bg },
    actions: { marginTop: theme.spacing.lg, display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' },
    btnSecondary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={getNavItems()} />}>
      <h1 style={s.title}>Form Builder</h1>
      {error && <div style={s.error}>{error}</div>}
      <button type="button" onClick={openCreate} style={s.btn}>Create Form</button>
      {loading ? <p>Loading...</p> : (
        <ul style={s.list}>
          {forms.map((f) => (
            <li key={f._id} style={s.listItem}>
              <span>{f.name}</span>
              <button type="button" onClick={() => openEdit(f)} style={s.btnSmall}>Edit</button>
            </li>
          ))}
        </ul>
      )}
      {showModal && (
        <div style={s.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editingId ? 'Edit Form' : 'Create Form'}</h2>
            <form onSubmit={handleSave}>
              <input type="text" placeholder="Form name" value={name} onChange={(e) => setName(e.target.value)} required style={s.input} />
              {fields.map((field, i) => (
                <div key={field.id} style={s.fieldRow}>
                  <select value={field.type} onChange={(e) => updateField(i, 'type', e.target.value)} style={s.select}>
                    {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="text" placeholder="Label" value={field.label} onChange={(e) => updateField(i, 'label', e.target.value)} style={s.input} />
                  <label><input type="checkbox" checked={field.required} onChange={(e) => updateField(i, 'required', e.target.checked)} /> Required</label>
                  {(field.type === 'select' || field.type === 'radio') && (
                    <input type="text" placeholder="Options (comma-separated)" value={Array.isArray(field.options) ? field.options.join(', ') : ''} onChange={(e) => updateField(i, 'options', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} style={s.input} />
                  )}
                  <button type="button" onClick={() => removeField(i)} style={s.btnDanger}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={addField} style={s.btn}>Add Field</button>
              <div style={s.actions}>
                <button type="button" onClick={() => setShowModal(false)} style={s.btnSecondary}>Cancel</button>
                <button type="submit" disabled={saving} style={s.btn}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
