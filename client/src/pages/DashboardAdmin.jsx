import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function DashboardAdmin() {
  const { user, logout } = useAuth();
  const [org, setOrg] = useState(null);
  const [managers, setManagers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);
  const [patching, setPatching] = useState(null);

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

  useEffect(() => {
    load();
  }, [load]);

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
      await api.api(`/organizations/me/managers/${managerId}`, {
        method: 'PATCH',
        body,
      });
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

  if (user?.role !== 'Admin') {
    return (
      <div style={styles.page}>
        <p style={styles.unauthorized}>Admin access required.</p>
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
          <span style={styles.role}>Admin</span>
          {org && <span style={styles.org}> · {org.name}</span>}
          <button type="button" onClick={logout} style={styles.logoutBtn}>Sign out</button>
        </div>
      </header>
      <main style={styles.main}>
        <h1 style={styles.h1}>Organization Admin</h1>
        {error && <div style={styles.error}>{error}</div>}
        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            {org && (
              <section style={styles.section}>
                <h2 style={styles.h2}>Organization</h2>
                <p><strong>Name:</strong> {org.name}</p>
                <p><strong>Handle (slug):</strong> <code style={styles.code}>{org.slug}</code></p>
              </section>
            )}

            <section style={styles.section}>
              <h2 style={styles.h2}>Invite manager</h2>
              <form onSubmit={handleInvite} style={styles.form}>
                <input
                  type="email"
                  placeholder="Manager email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={styles.input}
                />
                <button type="submit" disabled={inviteSubmitting} style={styles.btn}>
                  {inviteSubmitting ? 'Sending…' : 'Send invite'}
                </button>
              </form>
              {inviteLink && (
                <div style={styles.inviteLinkBox}>
                  <p style={styles.inviteLabel}>Invite link (share with invitee):</p>
                  <div style={styles.inviteRow}>
                    <input readOnly value={inviteLink} style={styles.input} />
                    <button type="button" onClick={() => copyInviteLink(inviteLink)} style={styles.btnSecondary}>
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section style={styles.section}>
              <h2 style={styles.h2}>Pending invites</h2>
              {invites.length === 0 ? (
                <p style={styles.muted}>No pending invites.</p>
              ) : (
                <ul style={styles.list}>
                  {invites.map((inv) => (
                    <li key={inv._id} style={styles.listItem}>
                      {inv.email}
                      <span style={styles.muted}> — expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                      <br />
                      <button
                        type="button"
                        onClick={() => copyInviteLink(`${window.location.origin}/invite/accept?token=${inv.token}`)}
                        style={styles.btnSmall}
                      >
                        Copy link
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={styles.section}>
              <h2 style={styles.h2}>Managers</h2>
              <p style={styles.muted}>Only Org Admin can approve managers and grant &quot;Can post jobs&quot;.</p>
              {managers.length === 0 ? (
                <p style={styles.muted}>No managers yet.</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Can post jobs</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((m) => (
                      <tr key={m._id}>
                        <td style={styles.td}>{m.name}</td>
                        <td style={styles.td}>{m.email}</td>
                        <td style={styles.td}>
                          {!m.isActive ? (
                            <span style={styles.badgeDanger}>Deactivated</span>
                          ) : m.pendingApproval ? (
                            <span style={styles.badgeWarn}>Pending approval</span>
                          ) : (
                            <span style={styles.badgeOk}>Active</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          {m.isActive && !m.pendingApproval && (
                            <label style={styles.checkLabel}>
                              <input
                                type="checkbox"
                                checked={!!m.canPostJobs}
                                onChange={(e) => patchManager(m._id, { canPostJobs: e.target.checked })}
                                disabled={patching === m._id}
                              />
                              {' '}Yes
                            </label>
                          )}
                        </td>
                        <td style={styles.td}>
                          {m.pendingApproval && (
                            <button
                              type="button"
                              onClick={() => patchManager(m._id, { approved: true })}
                              disabled={patching === m._id}
                              style={styles.btnSmall}
                            >
                              Approve
                            </button>
                          )}
                          {m.isActive && !m.pendingApproval && (
                            <button
                              type="button"
                              onClick={() => patchManager(m._id, { isActive: false })}
                              disabled={patching === m._id}
                              style={styles.btnDanger}
                            >
                              Deactivate
                            </button>
                          )}
                          {!m.isActive && (
                            <button
                              type="button"
                              onClick={() => patchManager(m._id, { isActive: true })}
                              disabled={patching === m._id}
                              style={styles.btnSmall}
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
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
  main: { padding: '2rem', maxWidth: 900 },
  h1: { margin: '0 0 1rem' },
  h2: { margin: '0 0 0.75rem', fontSize: '1.1rem' },
  error: { color: '#f87171', marginBottom: '1rem' },
  section: { marginBottom: '2rem' },
  form: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' },
  input: {
    padding: '0.5rem 0.75rem',
    border: '1px solid #334155',
    borderRadius: 6,
    background: '#1e293b',
    color: '#f1f5f9',
    minWidth: 200,
  },
  btn: { padding: '0.5rem 1rem', background: '#3b82f6', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' },
  btnSecondary: { padding: '0.5rem 1rem', background: '#334155', border: 'none', borderRadius: 6, color: '#e2e8f0', cursor: 'pointer' },
  btnSmall: { padding: '0.25rem 0.5rem', background: '#334155', border: 'none', borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: '0.875rem' },
  btnDanger: { padding: '0.25rem 0.5rem', background: '#dc2626', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: '0.875rem' },
  code: { background: '#1e293b', padding: '0.2rem 0.4rem', borderRadius: 4 },
  inviteLinkBox: { marginTop: '0.75rem' },
  inviteLabel: { margin: '0 0 0.25rem', fontSize: '0.9rem', color: '#94a3b8' },
  inviteRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { marginBottom: '0.5rem' },
  muted: { color: '#94a3b8', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #334155' },
  td: { padding: '0.5rem', borderBottom: '1px solid #334155' },
  checkLabel: { cursor: 'pointer' },
  badgeOk: { color: '#86efac', fontSize: '0.85rem' },
  badgeWarn: { color: '#fcd34d', fontSize: '0.85rem' },
  badgeDanger: { color: '#f87171', fontSize: '0.85rem' },
  unauthorized: { color: '#94a3b8', marginBottom: '1rem' },
};
