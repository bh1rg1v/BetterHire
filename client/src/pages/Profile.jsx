import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
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

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>My profile</h1>
        <p style={styles.subtitle}>{user?.email} · {user?.role}</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          {message && <div style={styles.message}>{message}</div>}
          <label style={styles.label}>Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Senior Frontend Developer"
            style={styles.input}
          />
          <label style={styles.label}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short bio"
            rows={3}
            style={{ ...styles.input, resize: 'vertical' }}
          />
          <label style={styles.label}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={styles.input}
          />
          <label style={styles.label}>Resume URL</label>
          <input
            type="url"
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
            placeholder="https://..."
            style={styles.input}
          />
          {user?.role === 'Applicant' && (
            <>
              <label style={styles.label}>Profile visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                style={styles.input}
              >
                <option value="private">Private</option>
                <option value="public">Public (show in public profile)</option>
              </select>
            </>
          )}
          <button type="submit" disabled={saving} style={styles.button}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '2rem',
    background: '#0f172a',
    color: '#f1f5f9',
  },
  card: { maxWidth: 560, margin: '0 auto' },
  title: { margin: '0 0 0.25rem' },
  subtitle: { color: '#94a3b8', margin: '0 0 1.5rem', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  label: { color: '#94a3b8', fontSize: '0.875rem' },
  message: { color: '#86efac', fontSize: '0.9rem' },
  input: {
    padding: '0.75rem 1rem',
    border: '1px solid #334155',
    borderRadius: 8,
    background: '#1e293b',
    color: '#f1f5f9',
    fontSize: '1rem',
  },
  button: {
    padding: '0.75rem',
    border: 'none',
    borderRadius: 8,
    background: '#3b82f6',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
