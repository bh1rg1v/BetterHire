import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../api/client';

export default function Apply() {
  const { positionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [position, setPosition] = useState(null);
  const [form, setForm] = useState(null);
  const [data, setData] = useState({});
  const [resumeUrl, setResumeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'Applicant') {
      navigate('/login', { state: { from: { pathname: `/apply/${positionId}` } } });
      return;
    }
    api
      .api(`/applications/position/${positionId}/form`)
      .then((res) => {
        setPosition(res.position);
        setForm(res.form);
        const initial = {};
        (res.form?.schema?.fields || []).forEach((f) => { initial[f.id] = ''; });
        setData(initial);
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [positionId, user, navigate]);

  function setField(id, value) {
    setData((d) => ({ ...d, [id]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.api('/applications', { method: 'POST', body: { positionId, data, resumeUrl: resumeUrl.trim() || undefined } });
      navigate('/dashboard/applicant');
    } catch (e) {
      setError(e.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ minHeight: '100vh', padding: '2rem', background: theme.colors.bg, color: theme.colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading...</p></div>;
  if (error && !form) return <div style={{ minHeight: '100vh', padding: '2rem', background: theme.colors.bg, color: theme.colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: theme.colors.danger }}>{error}</p><a href="/jobs" style={{ color: theme.colors.primary, fontWeight: 500 }}>Back to jobs</a></div>;

  const fields = form?.schema?.fields || [];
  
  const sty = {
    page: { minHeight: '100vh', padding: '2rem', background: theme.colors.bg, color: theme.colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.fonts.body },
    card: { maxWidth: '600px', width: '100%', background: theme.colors.bgCard, padding: theme.spacing.xxl, border: `1px solid ${theme.colors.border}` },
    title: { fontSize: '1.75rem', fontWeight: 600, marginBottom: theme.spacing.xl, color: theme.colors.text },
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.lg },
    formGroup: { display: 'flex', flexDirection: 'column', gap: theme.spacing.sm },
    label: { color: theme.colors.textMuted, fontSize: '0.875rem', fontWeight: 500 },
    input: { padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    textarea: { padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body, resize: 'vertical' },
    select: { padding: theme.spacing.md, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontFamily: theme.fonts.body },
    radioGroup: { display: 'flex', flexDirection: 'column', gap: theme.spacing.sm },
    radioLabel: { color: theme.colors.text, fontSize: '0.9rem' },
    btn: { padding: `${theme.spacing.md} ${theme.spacing.lg}`, background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: theme.fonts.body, fontWeight: 600, fontSize: '1rem' },
    error: { color: theme.colors.danger, padding: theme.spacing.md, background: `${theme.colors.danger}20`, border: `1px solid ${theme.colors.danger}`, marginBottom: theme.spacing.md },
    link: { color: theme.colors.primary, fontWeight: 500 },
  };

  return (
    <div style={sty.page}>
      <div style={sty.card}>
        <h1 style={sty.title}>Apply: {position?.title}</h1>
        <form onSubmit={handleSubmit} style={sty.form}>
          {error && <div style={sty.error}>{error}</div>}
          <div style={sty.formGroup}>
            <label style={sty.label}>Resume URL (optional)</label>
            <input type="url" placeholder="https://..." value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} style={sty.input} />
          </div>
          {fields.map((field) => (
            <div key={field.id} style={sty.formGroup}>
              <label style={sty.label}>{field.label}{field.required && ' *'}</label>
              {field.type === 'textarea' && (
                <textarea value={data[field.id] || ''} onChange={(e) => setField(field.id, e.target.value)} required={field.required} style={sty.textarea} rows={3} />
              )}
              {(field.type === 'select' || field.type === 'radio') && (
                field.type === 'select' ? (
                  <select value={data[field.id] || ''} onChange={(e) => setField(field.id, e.target.value)} required={field.required} style={sty.select}>
                    <option value="">- Select -</option>
                    {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <div style={sty.radioGroup}>
                    {(field.options || []).map((o) => (
                      <label key={o} style={sty.radioLabel}><input type="radio" name={field.id} value={o} checked={(data[field.id] || '') === o} onChange={() => setField(field.id, o)} /> {o}</label>
                    ))}
                  </div>
                )
              )}
              {!['textarea', 'select', 'radio'].includes(field.type) && (
                <input type={field.type} placeholder={field.placeholder} value={data[field.id] || ''} onChange={(e) => setField(field.id, e.target.value)} required={field.required} style={sty.input} />
              )}
            </div>
          ))}
          <button type="submit" disabled={submitting} style={sty.btn}>{submitting ? 'Submitting...' : 'Submit Application'}</button>
        </form>
      </div>
    </div>
  );
}

