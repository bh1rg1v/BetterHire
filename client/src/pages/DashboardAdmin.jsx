import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

export default function DashboardAdmin() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [org, setOrg] = useState(null);
  const [managers, setManagers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);
  const [patching, setPatching] = useState(null);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/dashboard/admin', label: 'Organization' },
    { path: '/dashboard/manager', label: 'Positions' },
    { path: '/dashboard/forms', label: 'Forms' },
    { path: '/dashboard/questions', label: 'Questions' },
    { path: '/dashboard/tests', label: 'Tests' },
    { path: '/dashboard/analytics', label: 'Analytics' },
    { path: '/dashboard/profile', label: 'Profile' },
  ];

  const load = useCallback(async () => {
    if (user?.role !== 'Admin') return;
    setError('');
    try {
      const [orgRes, managersRes, invitesRes] = await Promise.all([
        api.api('/organizations/me'),
        api.api('/organizations/me/managers'),
        api.api('/organizations/me/invites'),
      ]);
      setOrg(orgRes.organization);
      setManagers(managersRes.managers || []);
      setInvites(invitesRes.invites || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => { load(); }, [load]);

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteSubmitting(true);
    setInviteLink(null);
    setError('');
    try {
      const res = await api.api('/organizations/me/invites', {
        method: 'POST',
        body: { email: inviteEmail.trim() },
      });
      setInviteLink(res.inviteLink);
      setInviteEmail('');
      load();
    } catch (e) {
      setError(e.message || 'Invite failed');
    } finally {
      setInviteSubmitting(false);
    }
  }

  async function patchManager(managerId, body) {
    setPatching(managerId);
    setError('');
    try {
      await api.api(`/organizations/me/managers/${managerId}`, { method: 'PATCH', body });
      load();
    } catch (e) {
      setError(e.message || 'Update failed');
    } finally {
      setPatching(null);
    }
  }

  function copyInviteLink(link) {
    navigator.clipboard?.writeText(link);
  }

  if (user?.role !== 'Admin') return null;

  const s = {
    title: { fontSize: '2rem', fontWeight: 600, marginBottom: theme.spacing.xl },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20` },
    card: { background: theme.colors.bgCard, padding: theme.spacing.xl, border: `1px solid ${theme.colors.border}`, marginBottom: theme.spacing.lg },
    cardTitle: { fontSize: '1.25rem', fontWeight: 600, marginBottom: theme.spacing.lg },
    infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.lg },
    label: { color: theme.colors.textMuted, fontSize: '0.875rem', display: 'block', marginBottom: theme.spacing.xs },
    value: { color: theme.colors.text, fontWeight: 500 },
    code: { background: theme.colors.bg, padding: `${theme.spacing.xs} ${theme.spacing.sm}`, fontFamily: theme.fonts.mono, fontSize: '0.9rem' },
    form: { display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' },
    input: { flex: 1, minWidth: '200px', padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    btn: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500 },
    btnSecondary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body },
    btnSmall: { padding: `${theme.spacing.xs} ${theme.spacing.md}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontSize: '0.875rem', fontFamily: theme.fonts.body },
    btnDanger: { padding: `${theme.spacing.xs} ${theme.spacing.md}`, background: theme.colors.danger, border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontFamily: theme.fonts.body },
    inviteBox: { marginTop: theme.spacing.lg },
    inviteRow: { display: 'flex', gap: theme.spacing.md },
    list: { display: 'flex', flexDirection: 'column', gap: theme.spacing.sm },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, background: theme.colors.bg },
    table: { display: 'flex', flexDirection: 'column', gap: theme.spacing.sm },
    tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr', gap: theme.spacing.md, padding: theme.spacing.md, background: theme.colors.bg, alignItems: 'center' },
    tableCell: { display: 'flex', flexDirection: 'column', gap: theme.spacing.xs },
    managerName: { fontWeight: 500 },
    managerEmail: { fontSize: '0.875rem', color: theme.colors.textMuted },
    badgeSuccess: { display: 'inline-block', padding: `${theme.spacing.xs} ${theme.spacing.sm}`, background: `${theme.colors.success}20`, color: theme.colors.success, fontSize: '0.875rem', fontWeight: 500 },
    badgeWarn: { display: 'inline-block', padding: `${theme.spacing.xs} ${theme.spacing.sm}`, background: `${theme.colors.warning}20`, color: theme.colors.warning, fontSize: '0.875rem', fontWeight: 500 },
    badgeDanger: { display: 'inline-block', padding: `${theme.spacing.xs} ${theme.spacing.sm}`, background: `${theme.colors.danger}20`, color: theme.colors.danger, fontSize: '0.875rem', fontWeight: 500 },
    checkbox: { display: 'flex', alignItems: 'center', gap: theme.spacing.sm, cursor: 'pointer', fontSize: '0.9rem' },
    muted: { color: theme.colors.textMuted },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={navItems} />}>
      <h1 style={s.title}>Organization Management</h1>
      {error && <div style={s.error}>{error}</div>}
      
      {loading ? <p>Loading...</p> : (
        <>
          {org && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Organization Details</h2>
              <div style={s.infoGrid}>
                <div>
                  <span style={s.label}>Name:</span>
                  <span style={s.value}>{org.name}</span>
                </div>
                <div>
                  <span style={s.label}>Subdomain:</span>
                  <code style={s.code}>{org.slug}.yourdomain.com</code>
                </div>
              </div>
            </div>
          )}

          <div style={s.card}>
            <h2 style={s.cardTitle}>Invite Manager</h2>
            <form onSubmit={handleInvite} style={s.form}>
              <input
                type="email"
                placeholder="Manager email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={s.input}
              />
              <button type="submit" disabled={inviteSubmitting} style={s.btn}>
                {inviteSubmitting ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
            {inviteLink && (
              <div style={s.inviteBox}>
                <p style={s.label}>Invite link:</p>
                <div style={s.inviteRow}>
                  <input readOnly value={inviteLink} style={s.input} />
                  <button onClick={() => copyInviteLink(inviteLink)} style={s.btnSecondary}>
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {invites.length > 0 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Pending Invites</h2>
              <div style={s.list}>
                {invites.map((inv) => (
                  <div key={inv._id} style={s.listItem}>
                    <span>{inv.email}</span>
                    <button
                      onClick={() => copyInviteLink(`${window.location.origin}/invite/accept?token=${inv.token}`)}
                      style={s.btnSmall}
                    >
                      Copy Link
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={s.card}>
            <h2 style={s.cardTitle}>Managers</h2>
            {managers.length === 0 ? (
              <p style={s.muted}>No managers yet.</p>
            ) : (
              <div style={s.table}>
                {managers.map((m) => (
                  <div key={m._id} style={s.tableRow}>
                    <div style={s.tableCell}>
                      <div style={s.managerName}>{m.name}</div>
                      <div style={s.managerEmail}>{m.email}</div>
                    </div>
                    <div style={s.tableCell}>
                      {!m.isActive ? (
                        <span style={s.badgeDanger}>Deactivated</span>
                      ) : m.pendingApproval ? (
                        <span style={s.badgeWarn}>Pending</span>
                      ) : (
                        <span style={s.badgeSuccess}>Active</span>
                      )}
                    </div>
                    <div style={s.tableCell}>
                      {m.isActive && !m.pendingApproval && (
                        <label style={s.checkbox}>
                          <input
                            type="checkbox"
                            checked={!!m.canPostJobs}
                            onChange={(e) => patchManager(m._id, { canPostJobs: e.target.checked })}
                            disabled={patching === m._id}
                          />
                          Can post jobs
                        </label>
                      )}
                    </div>
                    <div style={s.tableCell}>
                      {m.pendingApproval && (
                        <button
                          onClick={() => patchManager(m._id, { approved: true })}
                          disabled={patching === m._id}
                          style={s.btnSmall}
                        >
                          Approve
                        </button>
                      )}
                      {m.isActive && !m.pendingApproval && (
                        <button
                          onClick={() => patchManager(m._id, { isActive: false })}
                          disabled={patching === m._id}
                          style={s.btnDanger}
                        >
                          Deactivate
                        </button>
                      )}
                      {!m.isActive && (
                        <button
                          onClick={() => patchManager(m._id, { isActive: true })}
                          disabled={patching === m._id}
                          style={s.btnSmall}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
