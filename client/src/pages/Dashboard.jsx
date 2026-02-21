import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const roleLabel = user?.role === 'Admin' ? 'Organization Admin' : user?.role === 'Manager' ? 'Manager' : 'Applicant';

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.logo}>BetterHire</span>
        <div style={styles.userRow}>
          <span style={styles.userName}>{user?.name}</span>
          <span style={styles.role}>{roleLabel}</span>
          {(user?.organizationId?.name) && (
            <span style={styles.org}> · {user.organizationId.name}</span>
          )}
          <button type="button" onClick={logout} style={styles.logoutBtn}>
            Sign out
          </button>
        </div>
      </header>
      <main style={styles.main}>
        <h1 style={styles.h1}>Dashboard</h1>
        <p style={styles.p}>You’re signed in as <strong>{user?.role}</strong>.</p>
        <div style={styles.links}>
          {user?.role === 'Admin' && (
            <Link to="/dashboard/admin" style={styles.link}>Organization Admin dashboard</Link>
          )}
          {(user?.role === 'Admin' || user?.role === 'Manager') && (
            <Link to="/dashboard/manager" style={styles.link}>Manager dashboard (job positions)</Link>
          )}
          {user?.role === 'Applicant' && (
            <Link to="/dashboard/applicant" style={styles.link}>My applications</Link>
          )}
          <Link to="/profile" style={styles.link}>My profile</Link>
        </div>
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
  logo: { fontWeight: 700, fontSize: '1.25rem' },
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
  main: { padding: '2rem' },
  h1: { margin: '0 0 0.5rem' },
  p: { color: '#94a3b8', margin: '0 0 1.5rem' },
  links: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  link: { color: '#60a5fa' },
};
