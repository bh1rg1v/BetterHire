import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export function DashboardLayout({ children, sidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      background: theme.colors.bg,
      fontFamily: theme.fonts.body,
    },
    main: {
      flex: 1,
      marginLeft: theme.sidebar.width,
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${theme.spacing.md} ${theme.spacing.xl}`,
      borderBottom: `1px solid ${theme.colors.border}`,
      background: theme.colors.bgCard,
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    userName: {
      color: theme.colors.text,
      fontWeight: 500,
    },
    role: {
      color: theme.colors.textMuted,
      fontSize: '0.9rem',
    },
    org: {
      color: theme.colors.textDim,
      fontSize: '0.9rem',
    },
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    themeBtn: {
      padding: theme.spacing.sm,
      background: 'transparent',
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.text,
      cursor: 'pointer',
      fontFamily: theme.fonts.body,
      fontSize: '0.9rem',
      transition: 'all 0.2s',
    },
    logoutBtn: {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      background: 'transparent',
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.textMuted,
      cursor: 'pointer',
      fontFamily: theme.fonts.body,
      fontSize: '0.9rem',
      transition: 'all 0.2s',
    },
    content: {
      flex: 1,
      padding: theme.spacing.xl,
      color: theme.colors.text,
    },
  };

  return (
    <div style={styles.container}>
      {sidebar}
      <div style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <span style={styles.userName}>{user?.name}</span>
            <span style={styles.role}>{user?.role}</span>
            {user?.organizationId?.name && (
              <span style={styles.org}>- {user.organizationId.name}</span>
            )}
          </div>
          <div style={styles.actions}>
            <button onClick={toggleTheme} style={styles.themeBtn} title="Toggle theme">
              {theme.mode === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button onClick={logout} style={styles.logoutBtn}>
              Sign out
            </button>
          </div>
        </header>
        <main style={styles.content}>{children}</main>
      </div>
    </div>
  );
}
