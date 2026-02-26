import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOrg } from '../context/OrgContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

const FIELD_TYPES = ['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio'];

export default function FormsBuilder() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { organization } = useOrg();
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

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

  function copyUrl(formUrl) {
    const url = `${window.location.origin}/apply/form/${formUrl}`;
    navigator.clipboard.writeText(url);
    setCopiedId(formUrl);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (!canEdit) return null;

  const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
    title: { fontSize: '2rem', fontWeight: 600, color: theme.colors.text, margin: 0 },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20` },
    btn: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500, marginBottom: theme.spacing.lg },
    list: { listStyle: 'none', padding: 0 },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, marginBottom: theme.spacing.sm },
    btnSmall: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontSize: '0.875rem', fontFamily: theme.fonts.body, textDecoration: 'none', display: 'inline-block', marginLeft: theme.spacing.sm },
    btnDanger: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.danger, border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontFamily: theme.fonts.body },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={getNavItems()} />}>
      <div style={s.header}>
        <h1 style={s.title}>Form Builder</h1>
        <button type="button" onClick={() => navigate(`/${orgSlug}/${userRole}/forms/create`)} style={s.btn}>Create Form</button>
      </div>
      {error && <div style={s.error}>{error}</div>}
      {loading ? <p>Loading...</p> : forms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: theme.spacing.xxl }}>
          <p style={{ fontSize: '1.25rem', color: theme.colors.textMuted, marginBottom: theme.spacing.lg }}>No forms created yet</p>
          <button type="button" onClick={() => navigate(`/${orgSlug}/${userRole}/forms/create`)} style={s.btn}>Create First Form</button>
        </div>
      ) : (
        <ul style={s.list}>
          {forms.map((f) => (
            <li key={f._id} style={s.listItem}>
              <span>{f.name}</span>
              <div>
                <button type="button" onClick={() => copyUrl(f.formUrl)} style={s.btnSmall}>
                  {copiedId === f.formUrl ? 'URL Copied!' : 'Copy URL'}
                </button>
                <Link to={`/${orgSlug}/${userRole}/forms/${f.formUrl}/submissions`} style={s.btnSmall}>View Applicants</Link>
                <Link to={`/${orgSlug}/${userRole}/forms/${f.formUrl}/edit`} style={s.btnSmall}>Edit</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}
