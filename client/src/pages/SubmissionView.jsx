import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

export default function SubmissionView() {
  const { id } = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canView = user?.role === 'Admin' || user?.canPostJobs === true || user?.role === 'Applicant';
  const isApplicant = user?.role === 'Applicant';

  const getNavItems = () => {
    if (isApplicant) {
      return [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/dashboard/applicant', label: 'My Applications' },
        { path: '/jobs', label: 'Browse Jobs' },
        { path: '/dashboard/profile', label: 'Profile' },
      ];
    }
    const items = [
      { path: '/dashboard', label: 'Dashboard' },
      ...(user?.role === 'Admin' ? [{ path: '/dashboard/admin', label: 'Organization' }] : []),
      { path: '/dashboard/manager', label: 'Positions' },
    ];
    if (canView) {
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
    if (!canView) {
      navigate('/dashboard');
      return;
    }
    const endpoint = isApplicant ? `/applications/me/${id}` : `/organizations/me/forms/submissions/${id}`;
    api.api(endpoint)
      .then((res) => setSubmission(res.submission))
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id, canView, navigate]);

  if (!canView) return null;

  const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
    title: { fontSize: '2rem', fontWeight: 600, color: theme.colors.text, margin: 0 },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20`, borderRadius: '8px' },
    card: { background: theme.colors.bgCard, padding: theme.spacing.xl, border: `1px solid ${theme.colors.border}`, borderRadius: '8px', marginBottom: theme.spacing.lg },
    section: { marginBottom: theme.spacing.lg },
    label: { fontSize: '0.875rem', fontWeight: 600, color: theme.colors.textMuted, marginBottom: theme.spacing.xs, textTransform: 'uppercase' },
    value: { fontSize: '1rem', color: theme.colors.text, marginBottom: theme.spacing.md },
    field: { marginBottom: theme.spacing.md, paddingBottom: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` },
    fieldLabel: { fontSize: '0.875rem', fontWeight: 500, color: theme.colors.textMuted, marginBottom: theme.spacing.xs },
    fieldValue: { fontSize: '1rem', color: theme.colors.text },
    btnSecondary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontSize: '1rem', fontFamily: theme.fonts.body, textDecoration: 'none', display: 'inline-block', borderRadius: '8px' },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={getNavItems()} />}>
      <div style={s.header}>
        <h1 style={s.title}>Application Details</h1>
        <button onClick={() => navigate(-1)} style={s.btnSecondary}>Back</button>
      </div>
      {error && <div style={s.error}>{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : submission ? (
        <>
          <div style={s.card}>
            <div style={s.section}>
              <div style={s.label}>Applicant</div>
              <div style={s.value}>{submission.applicantId?.name || 'N/A'}</div>
            </div>
            <div style={s.section}>
              <div style={s.label}>Email</div>
              <div style={s.value}>{submission.applicantId?.email || 'N/A'}</div>
            </div>
            <div style={s.section}>
              <div style={s.label}>Position</div>
              <div style={s.value}>{submission.positionId?.title || 'Direct Application'}</div>
            </div>
            <div style={s.section}>
              <div style={s.label}>Submitted</div>
              <div style={s.value}>{new Date(submission.createdAt).toLocaleString()}</div>
            </div>
            <div style={s.section}>
              <div style={s.label}>Status</div>
              <div style={s.value}>{submission.status}</div>
            </div>
          </div>
          <div style={s.card}>
            <h2 style={{ ...s.title, fontSize: '1.5rem', marginBottom: theme.spacing.lg }}>Application Data</h2>
            {submission.formId?.schema?.fields?.map((field) => (
              <div key={field.id} style={s.field}>
                <div style={s.fieldLabel}>{field.label}</div>
                <div style={s.fieldValue}>
                  {field.type === 'file' && submission.data?.[field.id]?.startsWith('data:') ? (
                    <a href={submission.data[field.id]} download="resume.pdf" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary, textDecoration: 'underline' }}>
                      View/Download File
                    </a>
                  ) : (
                    submission.data?.[field.id] || '-'
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={s.error}>Submission not found</div>
      )}
    </DashboardLayout>
  );
}
