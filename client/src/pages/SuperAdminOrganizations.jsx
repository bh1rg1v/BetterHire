import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

export default function SuperAdminOrganizations() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await api.api('/superadmin/organizations');
      setOrganizations(res.organizations || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard/superadmin' },
    { label: 'Users', path: '/dashboard/superadmin/users' },
    { label: 'Organizations', path: '/dashboard/superadmin/organizations' },
    { label: 'Profile', path: '/dashboard/profile' }
  ];

  if (user?.role !== 'SuperAdmin') {
    return (
      <DashboardLayout sidebar={<Sidebar items={navItems} />}>
        <div style={{ padding: theme.spacing.xl }}>
          <p>Super admin access required.</p>
        </div>
      </DashboardLayout>
    );
  }

  const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
    title: { fontSize: '2rem', fontWeight: 600, color: theme.colors.text, margin: 0 },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20`, border: `1px solid ${theme.colors.danger}` },
    table: { width: '100%', borderCollapse: 'collapse', background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}` },
    th: { padding: theme.spacing.md, textAlign: 'left', borderBottom: `1px solid ${theme.colors.border}`, background: theme.colors.bgHover, fontWeight: 600, color: theme.colors.text },
    td: { padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`, color: theme.colors.text },
    badge: (color) => ({ display: 'inline-block', padding: `${theme.spacing.xs} ${theme.spacing.sm}`, background: color, color: '#fff', fontSize: '0.75rem', fontWeight: 500 }),
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={navItems} />}>
      <div style={s.header}>
        <h1 style={s.title}>All Organizations ({organizations.length})</h1>
      </div>
      {error && <div style={s.error}>{error}</div>}
      {loading ? <p>Loading…</p> : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Name</th>
              <th style={s.th}>Slug</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map(org => (
              <tr key={org._id}>
                <td style={s.td}>{org.name}</td>
                <td style={s.td}>{org.slug}</td>
                <td style={s.td}>
                  <span style={s.badge(org.isActive ? '#10b981' : '#ef4444')}>
                    {org.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={s.td}>{new Date(org.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardLayout>
  );
}
