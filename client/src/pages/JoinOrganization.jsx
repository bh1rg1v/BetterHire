import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../api/client';

export default function JoinOrganization() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.organizationId) {
      navigate('/dashboard');
      return;
    }
    api.api('/organizations/list', { auth: false })
      .then((res) => setOrganizations(res.organizations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  async function requestAccess(orgId) {
    setRequesting(orgId);
    setMessage('');
    try {
      await api.api('/organizations/request-access', {
        method: 'POST',
        body: { organizationId: orgId },
      });
      setMessage('Request sent successfully! Wait for admin approval.');
    } catch (e) {
      setMessage(e.message || 'Request failed');
    } finally {
      setRequesting(null);
    }
  }

  const filtered = organizations.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.slug.toLowerCase().includes(search.toLowerCase())
  );

  const s = {
    page: { minHeight: '100vh', padding: theme.spacing.xl, background: theme.colors.bg, color: theme.colors.text, fontFamily: theme.fonts.body },
    container: { maxWidth: '800px', margin: '0 auto' },
    title: { fontSize: '2rem', fontWeight: 600, marginBottom: theme.spacing.sm },
    subtitle: { color: theme.colors.textMuted, marginBottom: theme.spacing.xl },
    search: { width: '100%', padding: theme.spacing.md, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, marginBottom: theme.spacing.lg },
    message: { padding: theme.spacing.md, background: `${theme.colors.success}20`, color: theme.colors.success, marginBottom: theme.spacing.lg, border: `1px solid ${theme.colors.success}` },
    list: { listStyle: 'none', padding: 0 },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.lg, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, marginBottom: theme.spacing.md },
    orgName: { fontSize: '1.25rem', fontWeight: 600, marginBottom: theme.spacing.xs },
    orgSlug: { fontSize: '0.875rem', color: theme.colors.textMuted },
    btn: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 500 },
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.title}>Join an Organization</h1>
        <p style={s.subtitle}>Search for an organization and request hiring manager access</p>
        {message && <div style={s.message}>{message}</div>}
        <input
          type="text"
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={s.search}
        />
        {loading ? <p>Loading...</p> : (
          <ul style={s.list}>
            {filtered.map((org) => (
              <li key={org._id} style={s.listItem}>
                <div>
                  <div style={s.orgName}>{org.name}</div>
                  <div style={s.orgSlug}>{org.slug}.yourdomain.com</div>
                </div>
                <button
                  onClick={() => requestAccess(org._id)}
                  disabled={requesting === org._id}
                  style={s.btn}
                >
                  {requesting === org._id ? 'Requesting...' : 'Request Access'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
