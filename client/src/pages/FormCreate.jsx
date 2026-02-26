import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOrg } from '../context/OrgContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

const DEFAULT_FIELDS = [
  { id: 'firstName', type: 'text', label: 'First Name', required: true, isDefault: true },
  { id: 'lastName', type: 'text', label: 'Last Name', required: true, isDefault: true },
  { id: 'email', type: 'email', label: 'Email', required: true, isDefault: true },
  { id: 'phone', type: 'text', label: 'Phone Number', required: true, isDefault: true },
  { id: 'degree', type: 'text', label: 'Degree', required: true, isDefault: true },
  { id: 'fieldOfStudy', type: 'text', label: 'Field of Study', required: true, isDefault: true },
  { id: 'institution', type: 'text', label: 'Institution', required: true, isDefault: true },
  { id: 'graduationYear', type: 'number', label: 'Graduation Year', required: true, isDefault: true },
  { id: 'resume', type: 'text', label: 'Resume (Public Folder Link)', required: true, isDefault: true },
];

const OPTIONAL_FIELDS = [
  { id: 'linkedin', type: 'text', label: 'LinkedIn Profile', required: false, isOptional: true },
  { id: 'portfolio', type: 'text', label: 'Portfolio Website', required: false, isOptional: true },
  { id: 'coverLetter', type: 'textarea', label: 'Cover Letter', required: false, isOptional: true },
];

export default function FormCreate() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { organization } = useOrg();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [fields, setFields] = useState([...DEFAULT_FIELDS, ...OPTIONAL_FIELDS]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  const canEdit = user?.role === 'Admin' || user?.canPostJobs === true;
  const orgSlug = organization?.slug;
  const userRole = user?.role?.toLowerCase();

  const getNavItems = () => {
    if (!orgSlug) return [];
    const items = [
      { path: `/${orgSlug}/${userRole}/dashboard`, label: 'Dashboard' },
    ];
    if (canEdit) {
      items.push(
        { path: `/${orgSlug}/${userRole}/forms`, label: 'Forms' },
        { path: `/${orgSlug}/${userRole}/tests`, label: 'Tests' },
        { path: `/${orgSlug}/${userRole}/questions`, label: 'Questions' }
      );
    }
    items.push(
      { path: `/${orgSlug}/${userRole}/analytics`, label: 'Analytics' },
      { path: '/dashboard/profile', label: 'Profile' }
    );
    return items;
  };

  function addCustomField() {
    const newField = { id: `custom_${Date.now()}`, type: 'text', label: 'Custom Field', required: false, isCustom: true };
    setFields(f => [...f, newField]);
  }

  function handleDragStart(e, index) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newFields = [...fields];
    const draggedField = newFields[draggedIndex];
    newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, draggedField);
    setFields(newFields);
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  function handleReset() {
    setName('');
    setFormUrl('');
    setFields([...DEFAULT_FIELDS, ...OPTIONAL_FIELDS]);
    setError('');
  }

  function updateField(index, key, value) {
    setFields(f => f.map((field, i) => i === index ? { ...field, [key]: value } : field));
  }

  function removeField(index) {
    setFields(f => f.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const schema = { fields };
      await api.api('/organizations/me/forms', { method: 'POST', body: { name: name.trim(), formUrl: formUrl.trim() || undefined, schema } });
      navigate(`/${orgSlug}/${userRole}/forms`);
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    navigate(`/${orgSlug}/${userRole}/forms`);
    return null;
  }

  const s = {
    container: { display: 'flex', gap: theme.spacing.xl },
    left: { flex: 1, maxWidth: 700 },
    right: { flex: 1, maxWidth: 700, position: 'sticky', top: theme.spacing.xl, height: 'fit-content' },
    title: { fontSize: '2rem', fontWeight: 600, marginBottom: theme.spacing.xl },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20`, borderRadius: '8px' },
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.lg },
    input: { padding: theme.spacing.md, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, borderRadius: '6px', width: '100%' },
    fieldCard: { background: theme.colors.bgCard, padding: theme.spacing.lg, border: `1px solid ${theme.colors.border}`, borderRadius: '8px', marginBottom: theme.spacing.sm },
    fieldHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
    fieldTitle: { fontSize: '1rem', fontWeight: 500 },
    badge: { padding: `${theme.spacing.xs} ${theme.spacing.sm}`, fontSize: '0.75rem', background: theme.colors.primary, color: '#fff', borderRadius: '12px', fontWeight: 500 },
    fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md, marginBottom: theme.spacing.sm },
    label: { fontSize: '0.875rem', color: theme.colors.textMuted, marginBottom: theme.spacing.xs, display: 'block', fontWeight: 500 },
    select: { padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, borderRadius: '6px', width: '100%' },
    actions: { display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end', marginTop: theme.spacing.xl },
    btnPrimary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500, borderRadius: '8px', fontSize: '1rem' },
    btnSecondary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body, borderRadius: '8px', fontSize: '1rem' },
    btnSmall: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontSize: '0.875rem', fontFamily: theme.fonts.body, borderRadius: '6px' },
    btnDanger: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.danger, border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontFamily: theme.fonts.body, borderRadius: '6px' },
    btnAdd: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.success, border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontFamily: theme.fonts.body, marginTop: theme.spacing.sm, borderRadius: '6px', width: '100%' },
    previewCard: { background: theme.colors.bgCard, padding: theme.spacing.xl, border: `1px solid ${theme.colors.border}`, borderRadius: '8px' },
    previewTitle: { fontSize: '1.5rem', fontWeight: 600, marginBottom: theme.spacing.xs, color: theme.colors.text },
    previewHint: { fontSize: '0.875rem', color: theme.colors.textMuted, marginBottom: theme.spacing.xl },
    previewField: { marginBottom: theme.spacing.lg, cursor: 'move', padding: theme.spacing.sm, borderRadius: '6px', transition: 'background 0.2s' },
    previewFieldDragging: { opacity: 0.5 },
    previewLabel: { fontSize: '0.875rem', fontWeight: 500, marginBottom: theme.spacing.xs, display: 'block', color: theme.colors.text },
    previewInput: { width: '100%', padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, borderRadius: '6px' },
    previewTextarea: { width: '100%', padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, minHeight: '100px', borderRadius: '6px', resize: 'vertical' },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={getNavItems()} />}>
      <div style={s.container}>
        <div style={s.left}>
          <h1 style={s.title}>Create Application Form</h1>
          {error && <div style={s.error}>{error}</div>}
          <form onSubmit={handleSubmit} style={s.form}>
        <div>
          <label style={s.label}>Form Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={s.input} placeholder="e.g., Software Engineer Application" />
        </div>
        <div>
          <label style={s.label}>Application Form URL</label>
          <input type="text" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} style={s.input} placeholder="e.g., software-engineer-form (leave empty for auto-generation)" />
        </div>
        {fields.map((field, index) => (
          <div key={field.id} style={s.fieldCard}>
              <div style={s.fieldHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <span style={s.fieldTitle}>{field.label}</span>
                  {field.required ? (
                    <span style={s.badge}>Essential</span>
                  ) : (
                    <span style={{...s.badge, background: theme.colors.textMuted}}>Optional</span>
                  )}
                  {field.isCustom && <span style={{...s.badge, background: theme.colors.success}}>Custom</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, cursor: 'pointer', margin: 0 }}>
                    <input type="checkbox" checked={field.required} onChange={(e) => updateField(index, 'required', e.target.checked)} style={{ cursor: 'pointer' }} />
                    <span style={{ fontSize: '0.875rem' }}>Required</span>
                  </label>
                  <button type="button" onClick={() => removeField(index)} style={s.btnDanger}>Remove</button>
                </div>
              </div>
              <div style={s.fieldRow}>
                <div>
                  <label style={s.label}>Field Type</label>
                  <select value={field.type} onChange={(e) => updateField(index, 'type', e.target.value)} style={s.select} disabled={field.isDefault}>
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="number">Number</option>
                    <option value="textarea">Textarea</option>
                    <option value="file">File</option>
                    <option value="select">Select</option>
                  </select>
                </div>
                <div>
                  <label style={s.label}>Label</label>
                  <input type="text" value={field.label} onChange={(e) => updateField(index, 'label', e.target.value)} style={s.input} />
                </div>
              </div>
              {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
                <div>
                  <label style={s.label}>Placeholder</label>
                  <input type="text" value={field.placeholder || ''} onChange={(e) => updateField(index, 'placeholder', e.target.value)} style={s.input} placeholder="e.g., Enter your value here" />
                </div>
              )}
          </div>
        ))}
        <button type="button" onClick={addCustomField} style={s.btnAdd}>+ Add Custom Field</button>
        <div style={s.actions}>
          <button type="button" onClick={() => navigate(`/${orgSlug}/${userRole}/forms`)} style={s.btnSecondary}>Cancel</button>
          <button type="button" onClick={handleReset} style={s.btnSecondary}>Reset</button>
          <button type="submit" disabled={saving} style={s.btnPrimary}>{saving ? 'Creating...' : 'Create Form'}</button>
        </div>
      </form>
        </div>
        <div style={s.right}>
          <div style={s.previewCard}>
            <h2 style={s.previewTitle}>{name || 'Form Preview'}</h2>
            <p style={s.previewHint}>Drag and drop fields to reorder</p>
            {fields.map((field, index) => (
              <div
                key={field.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{...s.previewField, ...(draggedIndex === index ? s.previewFieldDragging : {})}}
              >
                <label style={s.previewLabel}>
                  {field.label} {field.required && <span style={{ color: theme.colors.danger }}>*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea style={s.previewTextarea} placeholder={field.placeholder} disabled />
                ) : field.type === 'file' ? (
                  <input type="file" style={s.previewInput} accept={field.accept} disabled />
                ) : field.type === 'select' ? (
                  <select style={s.previewInput} disabled>
                    <option>Select...</option>
                  </select>
                ) : (
                  <input type={field.type} style={s.previewInput} placeholder={field.placeholder} disabled />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
