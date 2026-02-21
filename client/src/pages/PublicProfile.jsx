import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import * as api from '../api/client';

export default function PublicProfile() {
  const { username } = useParams();
  const { theme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.api(`/users/profile/${username}`, { auth: false })
      .then((res) => setProfile(res.user))
      .catch((e) => setError(e.message || 'Profile not found'))
      .finally(() => setLoading(false));
  }, [username]);

  const s = {
    page: { minHeight: '100vh', padding: theme.spacing.xl, background: theme.colors.bg, color: theme.colors.text, fontFamily: theme.fonts.body },
    container: { maxWidth: '800px', margin: '0 auto' },
    header: { textAlign: 'center', marginBottom: theme.spacing.xxl },
    name: { fontSize: '2.5rem', fontWeight: 700, marginBottom: theme.spacing.sm, color: theme.colors.text },
    username: { fontSize: '1.25rem', color: theme.colors.textMuted, marginBottom: theme.spacing.md },
    headline: { fontSize: '1.25rem', color: theme.colors.primary, marginBottom: theme.spacing.lg },
    card: { background: theme.colors.bgCard, padding: theme.spacing.xl, border: `1px solid ${theme.colors.border}`, marginBottom: theme.spacing.lg },
    label: { fontSize: '0.875rem', color: theme.colors.textMuted, fontWeight: 500, marginBottom: theme.spacing.xs },
    value: { fontSize: '1rem', color: theme.colors.text, marginBottom: theme.spacing.lg },
    link: { color: theme.colors.primary, fontWeight: 500 },
    error: { textAlign: 'center', padding: theme.spacing.xxl, color: theme.colors.danger },
    backLink: { display: 'inline-block', marginBottom: theme.spacing.xl, color: theme.colors.primary, fontWeight: 500 },
  };

  if (loading) return <div style={s.page}><div style={s.container}><p>Loading...</p></div></div>;
  if (error) return <div style={s.page}><div style={s.container}><p style={s.error}>{error}</p><Link to="/" style={s.backLink}>Go Home</Link></div></div>;
  if (!profile) return <div style={s.page}><div style={s.container}><p style={s.error}>Profile not found</p><Link to="/" style={s.backLink}>Go Home</Link></div></div>;

  return (
    <div style={s.page}>
      <div style={s.container}>
        <Link to="/" style={s.backLink}>← Back to Home</Link>
        <div style={s.header}>
          <h1 style={s.name}>{profile.name}</h1>
          <p style={s.username}>@{profile.username}</p>
          {profile.profile?.headline && <p style={s.headline}>{profile.profile.headline}</p>}
        </div>
        {profile.profile?.bio && (
          <div style={s.card}>
            <div style={s.label}>About</div>
            <div style={s.value}>{profile.profile.bio}</div>
          </div>
        )}
        {profile.profile?.phone && (
          <div style={s.card}>
            <div style={s.label}>Phone</div>
            <div style={s.value}>{profile.profile.phone}</div>
          </div>
        )}
        {profile.profile?.resumeUrl && (
          <div style={s.card}>
            <div style={s.label}>Resume</div>
            <a href={profile.profile.resumeUrl} target="_blank" rel="noopener noreferrer" style={s.link}>
              View Resume
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
