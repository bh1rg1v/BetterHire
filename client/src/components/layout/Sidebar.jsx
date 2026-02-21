import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export function Sidebar({ items }) {
  const location = useLocation();
  const { theme } = useTheme();

  const styles = {
    sidebar: {
      width: theme.sidebar.width,
      background: theme.colors.bgCard,
      borderRight: `1px solid ${theme.colors.border}`,
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing.lg,
    },
    brand: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: theme.colors.primary,
      marginBottom: theme.spacing.xl,
      fontFamily: theme.fonts.body,
    },
    nav: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.xs,
    },
    link: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      color: theme.colors.textMuted,
      textDecoration: 'none',
      fontSize: '0.95rem',
      fontFamily: theme.fonts.body,
      transition: 'all 0.2s',
    },
    linkActive: {
      background: theme.colors.bgHover,
      color: theme.colors.primary,
      fontWeight: 500,
    },
    icon: {
      fontSize: '1.1rem',
    },
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>BetterHire</div>
      <nav style={styles.nav}>
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.link,
              ...(location.pathname === item.path ? styles.linkActive : {}),
            }}
          >
            {item.icon && <span style={styles.icon}>{item.icon}</span>}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
