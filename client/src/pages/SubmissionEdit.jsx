import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

export default function SubmissionEdit() {
  const { id } = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/dashboard/applicant', label: 'My Applications' },
    { path: '/jobs', label: 'Browse Jobs' },
    { path: '/dashboard/profile', label: 'Profile' },
  ];

  useEffect(() => {
    if (user?.role !== 'Applicant') {
      navigate('/dashboard');
      return;
    }
    api.api(`/applications/me/${id}`)
      .then((res) => {
        if (res.submission.status !== 'submitted') {
          setError('Application cannot be edited');
          setLoading(false);
          return;
        }
        setSubmission(res.submission);
        setFormData(res.submission.data || {});
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Failed to load');
        setLoading(false);
      });
  }, [id, user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.api(`/applications/${id}`, { method: 'PATCH', body: { data: formData } });
      navigate('/dashboard/applicant');
    } catch (e) {
      setError(e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  const s = {
    title: { fontSize: '2rem', fontWeight: 600, marginBottom: theme.spacing.xl },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20`, borderRadius: '8px' },
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.lg },
    field: { display: 'flex', flexDirection: 'column', gap: theme.spacing.xs },
    label: { fontSize: '0.875rem', fontWeight: 500, color: theme.colors.text },
    input: { padding: theme.spacing.md, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, borderRadius: '6px' },
    textarea: { padding: theme.spacing.md, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, minHeight: '100px', borderRadius: '6px', resize: 'vertical' },
    actions: { display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.xl },
    btnPrimary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500, borderRadius: '8px' },
    btnSecondary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body, borderRadius: '8px' },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={navItems} />}>
      <h1 style={s.title}>Edit Application</h1>
      {error && <div style={s.error}>{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : submission ? (
        <form onSubmit={handleSubmit} style={s.form}>
          {submission.formId?.schema?.fields?.map((field) => (
            <div key={field.id} style={s.field}>
              <label style={s.label}>
                {field.label} {field.required && <span style={{ color: theme.colors.danger }}>*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.id] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  required={field.required}
                  style={s.textarea}
                />
              ) : (
                <input
                  type={field.type}
                  value={formData[field.id] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  required={field.required}
                  style={s.input}
                />
              )}
            </div>
          ))}
          <div style={s.actions}>
            <button type="button" onClick={() => navigate('/dashboard/applicant')} style={s.btnSecondary}>Cancel</button>
            <button type="submit" disabled={saving} style={s.btnPrimary}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      ) : (
        <div style={s.error}>Application not found or cannot be edited</div>
      )}
    </DashboardLayout>
  );
}
