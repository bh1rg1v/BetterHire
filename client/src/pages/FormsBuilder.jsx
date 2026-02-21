import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

const FIELD_TYPES = ['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio'];

export default function FormsBuilder() {
  const { user, logout } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);

  const canEdit = user?.role === 'Admin' || user?.canPostJobs === true;

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

  if (!canEdit) {
    return (
      <div style={s.page}><p>Permission required.</p><Link to="/dashboard/manager">Back</Link></div>
    );
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <Link to="/dashboard/manager" style={s.logo}>BetterHire</Link>
        <button type="button" onClick={logout} style={s.logoutBtn}>Sign out</button>
      </header>
      <main style={s.main}>
        <h1>Form builder</h1>
        {error && <div style={s.error}>{error}</div>}
        <button type="button" onClick={openCreate} style={s.btn}>Create form</button>
        {loading ? <p>Loading…</p> : (
          <ul style={s.list}>
            {forms.map((f) => (
              <li key={f._id} style={s.listItem}>
                {f.name}
                <button type="button" onClick={() => openEdit(f)} style={s.btnSmall}>Edit</button>
              </li>
            ))}
          </ul>
        )}
      </main>
      {showModal && (
        <div style={s.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit form' : 'Create form'}</h2>
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
              <button type="button" onClick={addField} style={s.btn}>Add field</button>
              <div style={s.actions}>
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', padding: '1rem 2rem' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' },
  logo: { color: '#f1f5f9', fontWeight: 700 }, logoutBtn: { padding: '0.5rem 1rem', cursor: 'pointer' },
  main: {}, error: { color: '#f87171' }, btn: { padding: '0.5rem 1rem', marginBottom: '1rem', cursor: 'pointer' },
  btnSmall: { marginLeft: '0.5rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }, btnDanger: { marginLeft: '0.5rem', padding: '0.25rem 0.5rem', cursor: 'pointer', background: '#dc2626', color: '#fff', border: 'none' },
  list: { listStyle: 'none', padding: 0 }, listItem: { marginBottom: '0.5rem' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1e293b', padding: '1.5rem', borderRadius: 12, maxWidth: 560, width: '90%', maxHeight: '90vh', overflow: 'auto' },
  input: { display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }, select: { marginRight: '0.5rem', padding: '0.5rem' },
  fieldRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' },
  actions: { marginTop: '1rem', display: 'flex', gap: '0.5rem' },
};
