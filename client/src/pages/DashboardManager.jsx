import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOrg } from '../context/OrgContext';
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
  const { organization } = useOrg();
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [forms, setForms] = useState([]);
  const [tests, setTests] = useState([]);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const orgSlug = organization?.slug;
  const userRole = user?.role?.toLowerCase();

  const canEdit = user?.role === 'Admin' || user?.canPostJobs === true;

  const getNavItems = () => {
    if (!orgSlug) return [];
    const items = [
      { path: `/${orgSlug}/${userRole}/dashboard`, label: 'Dashboard' },
    ];
    if (canEdit) {
      items.push(
        { path: `/${orgSlug}/${userRole}/forms`, label: 'Forms' },
        { path: `/${orgSlug}/${userRole}/questions`, label: 'Questions' },
        { path: `/${orgSlug}/${userRole}/tests`, label: 'Tests' }
      );
    }
    items.push(
      { path: `/${orgSlug}/${userRole}/analytics`, label: 'Analytics' },
      { path: '/dashboard/profile', label: 'Profile' }
    );
    return items;
  };

  const load = useCallback(async () => {
    if (!user || (user.role !== 'Admin' && user.role !== 'Manager')) return;
    setError('');
    try {
      const [orgRes, positionsRes] = await Promise.all([
        api.api('/organizations/me'),
        api.api(`/organizations/me/positions${statusFilter ? `?status=${statusFilter}` : ''}`),
      ]);
      setOrg(orgRes.organization);
      setPositions(positionsRes.positions || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter]);

  useEffect(() => { load(); }, [load]);

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
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: theme.spacing.lg },
    modal: { background: theme.colors.bgCard, padding: 0, maxWidth: '95vw', width: '1400px', maxHeight: '90vh', overflow: 'hidden', border: `1px solid ${theme.colors.border}`, display: 'flex' },
    modalLeft: { flex: 1, padding: theme.spacing.xl, overflowY: 'auto', borderRight: `1px solid ${theme.colors.border}` },
    modalRight: { flex: 1, padding: theme.spacing.xl, overflowY: 'auto', background: theme.colors.bg },
    modalTitle: { fontSize: '1.5rem', fontWeight: 600, marginBottom: theme.spacing.lg },
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.lg },
    formGroup: { display: 'flex', flexDirection: 'column', gap: theme.spacing.sm },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md },
    label: { color: theme.colors.textMuted, fontSize: '0.875rem', fontWeight: 500 },
    required: { color: theme.colors.danger },
    input: { padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    textarea: { padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, resize: 'vertical', overflow: 'hidden' },
    arrayInput: { display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
    arrayBtn: { padding: theme.spacing.sm, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body, fontSize: '0.875rem' },
    previewTitle: { fontSize: '2rem', fontWeight: 700, marginBottom: theme.spacing.md, color: theme.colors.text },
    previewSection: { marginBottom: theme.spacing.lg },
    previewLabel: { fontSize: '0.875rem', fontWeight: 600, color: theme.colors.textMuted, marginBottom: theme.spacing.xs, textTransform: 'uppercase' },
    previewText: { color: theme.colors.text, lineHeight: 1.6 },
    previewList: { listStyle: 'disc', paddingLeft: theme.spacing.lg, color: theme.colors.text },
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
          <button onClick={() => navigate(`/${orgSlug}/${userRole}/positions/create`)} style={s.btnPrimary}>
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
          {canEdit && <button onClick={() => navigate(`/${orgSlug}/${userRole}/positions/create`)} style={s.btnPrimary}>Create First Position</button>}
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
                    <Link to={`/${orgSlug}/${userRole}/positions/${p.positionUrl}/edit`} style={s.btnSmall}>Edit</Link>
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/job/${p.positionUrl}`);
                      setCopiedId(p._id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }} style={s.btnSmall}>{copiedId === p._id ? 'URL Copied!' : 'Copy URL'}</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
