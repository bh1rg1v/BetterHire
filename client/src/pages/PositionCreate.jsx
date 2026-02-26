import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function PositionCreate() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [forms, setForms] = useState([]);
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState({ 
    title: '', 
    positionUrl: '',
    description: '', 
    keyResponsibilities: '', 
    qualifications: '', 
    preferredQualifications: '', 
    requiredSkills: '', 
    preferredSkills: '', 
    jobType: '', 
    workEnvironment: '', 
    compensation: '', 
    companyOverview: '', 
    status: 'draft', 
    assignedManagerId: user?._id || '', 
    formId: '', 
    testId: '',
    openDate: new Date().toISOString().split('T')[0],
    closeDate: '',
    activeDays: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!canEdit) {
      navigate('/dashboard/manager');
      return;
    }
    Promise.all([
      api.api('/organizations/me/managers'),
      api.api('/organizations/me/forms').catch(() => ({ forms: [] })),
      api.api('/organizations/me/tests').catch(() => ({ tests: [] })),
    ]).then(([managersRes, formsRes, testsRes]) => {
      setManagers(managersRes.managers?.filter((m) => m.isActive && !m.pendingApproval) || []);
      setForms(formsRes.forms || []);
      setTests(testsRes.tests || []);
    });
  }, [canEdit, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        title: form.title.trim(),
        positionUrl: form.positionUrl.trim(),
        description: form.description.trim(),
        keyResponsibilities: form.keyResponsibilities.split('\n').filter(r => r.trim()),
        qualifications: form.qualifications.split('\n').filter(q => q.trim()),
        preferredQualifications: form.preferredQualifications.split('\n').filter(q => q.trim()),
        requiredSkills: form.requiredSkills.split('\n').filter(s => s.trim()),
        preferredSkills: form.preferredSkills.split('\n').filter(s => s.trim()),
        jobType: form.jobType,
        workEnvironment: form.workEnvironment,
        compensation: form.compensation.split('\n').filter(c => c.trim()),
        companyOverview: form.companyOverview.trim(),
        status: form.status,
        assignedManagerId: form.assignedManagerId || undefined,
        formId: form.formId || undefined,
        testId: form.testId || undefined,
        openDate: form.openDate,
        closeDate: form.closeDate || undefined,
        activeDays: form.activeDays ? parseInt(form.activeDays) : undefined,
      };
      await api.api('/organizations/me/positions', { method: 'POST', body });
      navigate('/dashboard/manager');
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const s = {
    container: { display: 'flex', gap: theme.spacing.xl },
    left: { flex: 1, maxWidth: 700 },
    right: { flex: 1, maxWidth: 700, position: 'sticky', top: theme.spacing.xl, height: 'fit-content' },
    title: { fontSize: '2rem', fontWeight: 600, marginBottom: theme.spacing.xl },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20` },
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.lg },
    formGroup: { display: 'flex', flexDirection: 'column', gap: theme.spacing.sm },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md },
    label: { color: theme.colors.textMuted, fontSize: '0.875rem', fontWeight: 500 },
    required: { color: theme.colors.danger },
    input: { padding: theme.spacing.md, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    textarea: { padding: theme.spacing.md, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, resize: 'vertical', overflow: 'hidden' },
    select: { padding: theme.spacing.md, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    actions: { display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end', marginTop: theme.spacing.md },
    btnPrimary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500, fontSize: '0.95rem' },
    btnSecondary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body },
    previewCard: { background: theme.colors.bgCard, padding: theme.spacing.xl, border: `1px solid ${theme.colors.border}` },
    previewTitle: { fontSize: '2rem', fontWeight: 700, marginBottom: theme.spacing.md, color: theme.colors.text },
    previewSection: { marginBottom: theme.spacing.lg },
    previewLabel: { fontSize: '0.875rem', fontWeight: 600, color: theme.colors.textMuted, marginBottom: theme.spacing.xs, textTransform: 'uppercase' },
    previewText: { color: theme.colors.text, lineHeight: 1.6 },
    previewList: { listStyle: 'disc', paddingLeft: theme.spacing.lg, color: theme.colors.text },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={getNavItems()} />}>
      <div style={s.container}>
        <div style={s.left}>
          <h1 style={s.title}>Create Position</h1>
          {error && <div style={s.error}>{error}</div>}
          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.formGroup}>
              <label style={s.label}>Job Title <span style={s.required}>*</span></label>
              <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required style={s.input} />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Job Description <span style={s.required}>*</span></label>
              <textarea 
                value={form.description} 
                onChange={(e) => {
                  setForm((f) => ({ ...f, description: e.target.value }));
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }} 
                required 
                rows={4} 
                style={s.textarea} 
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Company Overview <span style={s.required}>*</span></label>
              <textarea 
                value={form.companyOverview} 
                onChange={(e) => {
                  setForm((f) => ({ ...f, companyOverview: e.target.value }));
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }} 
                required 
                rows={3} 
                style={s.textarea} 
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Key Responsibilities <span style={s.required}>*</span></label>
              <textarea 
                value={form.keyResponsibilities} 
                onChange={(e) => {
                  setForm((f) => ({ ...f, keyResponsibilities: e.target.value }));
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }} 
                required 
                rows={5} 
                style={s.textarea} 
                placeholder="Enter key responsibilities, one per line" 
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Qualifications <span style={s.required}>*</span></label>
              <textarea 
                value={form.qualifications} 
                onChange={(e) => {
                  setForm((f) => ({ ...f, qualifications: e.target.value }));
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }} 
                required 
                rows={4} 
                style={s.textarea} 
                placeholder="Enter qualifications, one per line" 
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Preferred Qualifications</label>
              <textarea 
                value={form.preferredQualifications} 
                onChange={(e) => {
                  setForm((f) => ({ ...f, preferredQualifications: e.target.value }));
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }} 
                rows={3} 
                style={s.textarea} 
                placeholder="Enter preferred qualifications, one per line" 
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Required Skills <span style={s.required}>*</span></label>
              <textarea 
                value={form.requiredSkills} 
                onChange={(e) => {
                  setForm((f) => ({ ...f, requiredSkills: e.target.value }));
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }} 
                required 
                rows={4} 
                style={s.textarea} 
                placeholder="Enter required skills, one per line" 
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Preferred Skills</label>
              <textarea 
                value={form.preferredSkills} 
                onChange={(e) => {
                  setForm((f) => ({ ...f, preferredSkills: e.target.value }));
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }} 
                rows={3} 
                style={s.textarea} 
                placeholder="Enter preferred skills, one per line" 
              />
            </div>
            <div style={s.formRow}>
              <div style={s.formGroup}>
                <label style={s.label}>Job Type <span style={s.required}>*</span></label>
                <select value={form.jobType} onChange={(e) => setForm((f) => ({ ...f, jobType: e.target.value }))} style={s.select} required>
                  <option value="">Select</option>
                  <option>Full Time</option>
                  <option>Part Time</option>
                  <option>Internship</option>
                  <option>Contract</option>
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Work Environment <span style={s.required}>*</span></label>
                <select value={form.workEnvironment} onChange={(e) => setForm((f) => ({ ...f, workEnvironment: e.target.value }))} style={s.select} required>
                  <option value="">Select</option>
                  <option>Onsite</option>
                  <option>Remote</option>
                  <option>Hybrid</option>
                </select>
              </div>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Compensation Details <span style={s.required}>*</span></label>
              <textarea 
                value={form.compensation} 
                onChange={(e) => {
                  setForm((f) => ({ ...f, compensation: e.target.value }));
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }} 
                required 
                rows={3} 
                style={s.textarea} 
                placeholder="Enter compensation details, one per line" 
              />
            </div>
            <div style={s.formRow}>
              <div style={s.formGroup}>
                <label style={s.label}>Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={s.select}>
                  {STATUS_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Assigned Manager</label>
                <select value={form.assignedManagerId} onChange={(e) => setForm((f) => ({ ...f, assignedManagerId: e.target.value }))} style={s.select}>
                  <option value="">- None -</option>
                  {managers.map((m) => (<option key={m._id} value={m._id}>{m.name}</option>))}
                </select>
              </div>
            </div>
            <div style={s.formRow}>
              <div style={s.formGroup}>
                <label style={s.label}>Application Form</label>
                <select value={form.formId} onChange={(e) => setForm((f) => ({ ...f, formId: e.target.value }))} style={s.select}>
                  <option value="">- None -</option>
                  {forms.map((f) => (<option key={f._id} value={f._id}>{f.name}</option>))}
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Position URL <span style={s.required}>*</span></label>
                <input type="text" value={form.positionUrl} onChange={(e) => setForm((f) => ({ ...f, positionUrl: e.target.value }))} required style={s.input} placeholder="e.g., sde-2024 (leave empty for auto-generate)" />
              </div>
            </div>
            <div style={s.formRow}>
              <div style={s.formGroup}>
                <label style={s.label}>Position Open Date</label>
                <input type="date" value={form.openDate} onChange={(e) => setForm((f) => ({ ...f, openDate: e.target.value }))} style={s.input} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Active Days</label>
                <input type="number" value={form.activeDays} onChange={(e) => {
                  const days = e.target.value;
                  setForm((f) => {
                    const newForm = { ...f, activeDays: days };
                    if (days && f.openDate) {
                      const open = new Date(f.openDate);
                      const close = new Date(open.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);
                      newForm.closeDate = close.toISOString().split('T')[0];
                    }
                    return newForm;
                  });
                }} style={s.input} placeholder="e.g., 30" />
              </div>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Position Close Date</label>
              <input type="date" value={form.closeDate} onChange={(e) => setForm((f) => ({ ...f, closeDate: e.target.value }))} style={s.input} />
            </div>
            <div style={s.actions}>
              <button type="button" onClick={() => navigate('/dashboard/manager')} style={s.btnSecondary}>Cancel</button>
              <button type="submit" disabled={saving} style={s.btnPrimary}>{saving ? 'Saving...' : 'Create Position'}</button>
            </div>
          </form>
        </div>
        <div style={s.right}>
          <div style={s.previewCard}>
            <div style={{ ...s.previewLabel, marginBottom: theme.spacing.lg, fontSize: '1rem' }}>Preview of Job Posting</div>
            <h3 style={s.previewTitle}>{form.title || 'Job Title'}</h3>
            {form.description && <div style={s.previewSection}><div style={s.previewLabel}>Description</div><div style={{ ...s.previewText, whiteSpace: 'pre-wrap' }}>{form.description}</div></div>}
            {form.companyOverview && <div style={s.previewSection}><div style={s.previewLabel}>Company Overview</div><div style={{ ...s.previewText, whiteSpace: 'pre-wrap' }}>{form.companyOverview}</div></div>}
            {form.keyResponsibilities.split('\n').filter(r => r.trim()).length > 0 && <div style={s.previewSection}><div style={s.previewLabel}>Key Responsibilities</div><ul style={s.previewList}>{form.keyResponsibilities.split('\n').filter(r => r.trim()).map((r, i) => <li key={i}>{r}</li>)}</ul></div>}
            {form.qualifications.split('\n').filter(q => q.trim()).length > 0 && <div style={s.previewSection}><div style={s.previewLabel}>Qualifications</div><ul style={s.previewList}>{form.qualifications.split('\n').filter(q => q.trim()).map((q, i) => <li key={i}>{q}</li>)}</ul></div>}
            {form.preferredQualifications.split('\n').filter(q => q.trim()).length > 0 && <div style={s.previewSection}><div style={s.previewLabel}>Preferred Qualifications</div><ul style={s.previewList}>{form.preferredQualifications.split('\n').filter(q => q.trim()).map((q, i) => <li key={i}>{q}</li>)}</ul></div>}
            {form.requiredSkills.split('\n').filter(skill => skill.trim()).length > 0 && <div style={s.previewSection}><div style={s.previewLabel}>Required Skills</div><ul style={s.previewList}>{form.requiredSkills.split('\n').filter(skill => skill.trim()).map((skill, i) => <li key={i}>{skill}</li>)}</ul></div>}
            {form.preferredSkills.split('\n').filter(skill => skill.trim()).length > 0 && <div style={s.previewSection}><div style={s.previewLabel}>Preferred Skills</div><ul style={s.previewList}>{form.preferredSkills.split('\n').filter(skill => skill.trim()).map((skill, i) => <li key={i}>{skill}</li>)}</ul></div>}
            <div style={s.previewSection}><div style={s.previewLabel}>Job Type</div><div style={s.previewText}>{form.jobType}</div></div>
            <div style={s.previewSection}><div style={s.previewLabel}>Work Environment</div><div style={s.previewText}>{form.workEnvironment}</div></div>
            {form.compensation.split('\n').filter(comp => comp.trim()).length > 0 && <div style={s.previewSection}><div style={s.previewLabel}>Compensation</div><ul style={s.previewList}>{form.compensation.split('\n').filter(comp => comp.trim()).map((comp, i) => <li key={i}>{comp}</li>)}</ul></div>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
