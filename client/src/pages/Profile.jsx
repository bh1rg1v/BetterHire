import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const getNavItems = () => {
    const orgSlug = user?.organizationId?.slug;
    if (user?.role === 'Admin' && orgSlug) {
      const role = 'admin';
      return [
        { path: `/${orgSlug}/${role}/dashboard`, label: 'Dashboard' },
        { path: `/${orgSlug}/admin/dashboard`, label: 'Organization' },
        { path: `/${orgSlug}/${role}/forms`, label: 'Forms' },
        { path: `/${orgSlug}/${role}/tests`, label: 'Tests' },
        { path: `/${orgSlug}/${role}/questions`, label: 'Questions' },
        { path: `/${orgSlug}/${role}/analytics`, label: 'Analytics' },
        { path: '/dashboard/profile', label: 'Profile' },
      ];
    }
    if (user?.role === 'Manager' && orgSlug) {
      const role = 'manager';
      return [
        { path: `/${orgSlug}/${role}/dashboard`, label: 'Dashboard' },
        ...(user?.canPostJobs ? [
          { path: `/${orgSlug}/${role}/forms`, label: 'Forms' },
          { path: `/${orgSlug}/${role}/tests`, label: 'Tests' },
          { path: `/${orgSlug}/${role}/questions`, label: 'Questions' },
        ] : []),
        { path: `/${orgSlug}/${role}/analytics`, label: 'Analytics' },
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

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
    if (user?.profile) {
      setHeadline(user.profile.headline || '');
      setBio(user.profile.bio || '');
      setPhone(user.profile.phone || '');
      setResumeUrl(user.profile.resumeUrl || '');
      setVisibility(user.profile.visibility || 'private');
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      await api.api('/users/me', {
        method: 'PATCH',
        body: {
          name,
          profile: { headline, bio, phone, resumeUrl, visibility },
        },
      });
      await refreshUser();
      setMessage('Profile updated.');
    } catch (err) {
      setMessage(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  const s = {
    title: { fontSize: '2rem', fontWeight: 600, marginBottom: theme.spacing.sm },
    subtitle: { color: theme.colors.textMuted, marginBottom: theme.spacing.xl },
    actions: { display: 'flex', gap: theme.spacing.md, marginBottom: theme.spacing.xl },
    btnSecondary: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontFamily: theme.fonts.body, textDecoration: 'none', display: 'inline-block' },
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.lg, maxWidth: '600px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: theme.spacing.sm },
    label: { color: theme.colors.textMuted, fontSize: '0.875rem', fontWeight: 500 },
    message: { color: theme.colors.success, fontSize: '0.9rem', padding: theme.spacing.md, background: `${theme.colors.success}20` },
    input: {
      padding: theme.spacing.md,
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.bgCard,
      color: theme.colors.text,
      fontSize: '1rem',
      fontFamily: theme.fonts.body,
    },
    textarea: {
      padding: theme.spacing.md,
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.bgCard,
      color: theme.colors.text,
      fontSize: '1rem',
      fontFamily: theme.fonts.body,
      resize: 'vertical',
    },
    select: {
      padding: theme.spacing.md,
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.bgCard,
      color: theme.colors.text,
      fontSize: '1rem',
      fontFamily: theme.fonts.body,
    },
    button: {
      padding: theme.spacing.md,
      border: 'none',
      background: theme.colors.primary,
      color: '#fff',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: theme.fonts.body,
    },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={getNavItems()} />}>
      <h1 style={s.title}>My Profile</h1>
      <p style={s.subtitle}>{user?.email} - {user?.role}</p>
      <div style={s.actions}>
        <Link to={`/users/${user?.username}`} target="_blank" style={s.btnSecondary}>View Public Profile</Link>
      </div>
      <form onSubmit={handleSubmit} style={s.form}>
        {message && <div style={s.message}>{message}</div>}
        <div style={s.formGroup}>
          <label style={s.label}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            style={s.input}
          />
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Senior Frontend Developer"
            style={s.input}
          />
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short bio"
            rows={3}
            style={s.textarea}
          />
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={s.input}
          />
        </div>
        <div style={s.formGroup}>
          <label style={s.label}>Resume URL</label>
          <input
            type="url"
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
            placeholder="https://..."
            style={s.input}
          />
        </div>
        {user?.role === 'Applicant' && (
          <div style={s.formGroup}>
            <label style={s.label}>Profile Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              style={s.select}
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
        )}
        <button type="submit" disabled={saving} style={s.button}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </DashboardLayout>
  );
}
