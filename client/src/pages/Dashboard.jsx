import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const getNavItems = () => {
    if (user?.role === 'Admin') {
      return [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/dashboard/admin', label: 'Organization' },
        { path: '/dashboard/manager', label: 'Positions' },
        { path: '/dashboard/forms', label: 'Forms' },
        { path: '/dashboard/questions', label: 'Questions' },
        { path: '/dashboard/tests', label: 'Tests' },
        { path: '/dashboard/analytics', label: 'Analytics' },
        { path: '/dashboard/profile', label: 'Profile' },
      ];
    }
    if (user?.role === 'Manager') {
      return [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/dashboard/manager', label: 'Positions' },
        ...(user?.canPostJobs ? [
          { path: '/dashboard/forms', label: 'Forms' },
          { path: '/dashboard/questions', label: 'Questions' },
          { path: '/dashboard/tests', label: 'Tests' },
        ] : []),
        { path: '/dashboard/analytics', label: 'Analytics' },
        { path: '/dashboard/profile', label: 'Profile' },
      ];
    }
    return [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/dashboard/applicant', label: 'My Applications' },
      { path: '/jobs', label: 'Browse Jobs' },
      { path: '/dashboard/profile', label: 'Profile' },
    ];
  };

  const styles = {
    title: {
      fontSize: '2rem',
      fontWeight: 600,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.xl,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: theme.spacing.lg,
      marginBottom: theme.spacing.xxl,
    },
    card: {
      background: theme.colors.bgCard,
      padding: theme.spacing.lg,
      border: `1px solid ${theme.colors.border}`,
    },
    cardIcon: {
      fontSize: '2rem',
      marginBottom: theme.spacing.md,
    },
    cardTitle: {
      fontSize: '0.875rem',
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.xs,
      fontWeight: 500,
    },
    cardValue: {
      fontSize: '1.25rem',
      color: theme.colors.text,
      fontWeight: 500,
    },
    quickLinks: {
      marginTop: theme.spacing.xxl,
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: 600,
      marginBottom: theme.spacing.lg,
    },
    linkGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: theme.spacing.md,
    },
    quickLink: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      background: theme.colors.bgCard,
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.text,
      textDecoration: 'none',
      transition: 'all 0.2s',
    },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={getNavItems()} />}>
      <h1 style={styles.title}>Dashboard</h1>
      <p style={styles.subtitle}>Welcome back, {user?.name}</p>
      
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Role</h3>
          <p style={styles.cardValue}>{user?.role}</p>
        </div>
        
        {user?.organizationId?.name && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Organization</h3>
            <p style={styles.cardValue}>{user.organizationId.name}</p>
          </div>
        )}
        
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Email</h3>
          <p style={styles.cardValue}>{user?.email}</p>
        </div>
      </div>

      <div style={styles.quickLinks}>
        <h2 style={styles.sectionTitle}>Quick Links</h2>
        <div style={styles.linkGrid}>
          {getNavItems().slice(1).map((item) => (
            <a key={item.path} href={item.path} style={styles.quickLink}>
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
