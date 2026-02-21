import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <div style={{ ...s(theme).page }}>
        <div style={s(theme).centered}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={s(theme).page}>
      <div style={s(theme).hero}>
        <div style={s(theme).logo}>BetterHire</div>
        <h1 style={s(theme).h1}>Modern Hiring & Assessment Platform</h1>
        <p style={s(theme).tagline}>Streamline your recruitment process with custom forms, tests, and analytics</p>
        <div style={s(theme).actions}>
          {user ? (
            <Link to="/dashboard" style={s(theme).primaryBtn}>Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/register" style={s(theme).primaryBtn}>Get Started</Link>
              <Link to="/login" style={s(theme).secondaryBtn}>Sign In</Link>
            </>
          )}
          <Link to="/jobs" style={s(theme).secondaryBtn}>Browse Jobs</Link>
        </div>
      </div>
      <div style={s(theme).features}>
        <div style={s(theme).feature}>
          <h3 style={s(theme).featureTitle}>Custom Forms</h3>
          <p style={s(theme).featureDesc}>Build dynamic application forms with drag-and-drop</p>
        </div>
        <div style={s(theme).feature}>
          <h3 style={s(theme).featureTitle}>Smart Tests</h3>
          <p style={s(theme).featureDesc}>Create MCQ and descriptive tests with auto-evaluation</p>
        </div>
        <div style={s(theme).feature}>
          <h3 style={s(theme).featureTitle}>Analytics</h3>
          <p style={s(theme).featureDesc}>Track hiring funnel and candidate performance</p>
        </div>
      </div>
    </div>
  );
}

const s = (theme) => ({
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.colors.bg,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    padding: theme.spacing.xl,
  },
  centered: { padding: theme.spacing.xl },
  hero: { textAlign: 'center', padding: theme.spacing.xl, maxWidth: '800px' },
  logo: { fontSize: '1.5rem', fontWeight: 700, color: theme.colors.primary, marginBottom: theme.spacing.lg },
  h1: { margin: `0 0 ${theme.spacing.lg}`, fontSize: '3rem', fontWeight: 700, lineHeight: 1.2 },
  tagline: { color: theme.colors.textMuted, margin: `0 0 ${theme.spacing.xxl}`, fontSize: '1.25rem' },
  actions: { display: 'flex', gap: theme.spacing.md, justifyContent: 'center', flexWrap: 'wrap' },
  primaryBtn: {
    display: 'inline-block',
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    background: theme.colors.primary,
    color: '#fff',
    textDecoration: 'none',
    transition: 'all 0.2s',
    fontWeight: 600,
  },
  secondaryBtn: {
    display: 'inline-block',
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.text,
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: theme.spacing.xl,
    maxWidth: '1000px',
    marginTop: theme.spacing.xxl,
  },
  feature: {
    background: theme.colors.bgCard,
    padding: theme.spacing.xl,
    border: `1px solid ${theme.colors.border}`,
    textAlign: 'center',
  },
  featureTitle: { fontSize: '1.25rem', fontWeight: 600, marginBottom: theme.spacing.sm },
  featureDesc: { color: theme.colors.textMuted, fontSize: '0.95rem' },
});
