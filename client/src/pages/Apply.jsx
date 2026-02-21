import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function Apply() {
  const { positionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  if (loading) return <div style={sty.page}>Loading…</div>;
  if (error && !form) return <div style={sty.page}><p style={sty.error}>{error}</p><a href="/jobs">Back to jobs</a></div>;

  const fields = form?.schema?.fields || [];
  return (
    <div style={sty.page}>
      <div style={sty.card}>
        <h1>Apply: {position?.title}</h1>
        <form onSubmit={handleSubmit}>
          {error && <div style={sty.error}>{error}</div>}
          <div style={sty.field}>
            <label>Resume URL (optional)</label>
            <input type="url" placeholder="https://..." value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} style={sty.input} />
          </div>
          {fields.map((field) => (
            <div key={field.id} style={sty.field}>
              <label>{field.label}{field.required && ' *'}</label>
              {field.type === 'textarea' && (
                <textarea value={data[field.id] || ''} onChange={(e) => setField(field.id, e.target.value)} required={field.required} style={sty.input} rows={3} />
              )}
              {(field.type === 'select' || field.type === 'radio') && (
                field.type === 'select' ? (
                  <select value={data[field.id] || ''} onChange={(e) => setField(field.id, e.target.value)} required={field.required} style={sty.input}>
                    <option value="">— Select —</option>
                    {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <div>
                    {(field.options || []).map((o) => (
                      <label key={o}><input type="radio" name={field.id} value={o} checked={(data[field.id] || '') === o} onChange={() => setField(field.id, o)} /> {o}</label>
                    ))}
                  </div>
                )
              )}
              {!['textarea', 'select', 'radio'].includes(field.type) && (
                <input type={field.type} placeholder={field.placeholder} value={data[field.id] || ''} onChange={(e) => setField(field.id, e.target.value)} required={field.required} style={sty.input} />
              )}
            </div>
          ))}
          <button type="submit" disabled={submitting} style={sty.btn}>{submitting ? 'Submitting…' : 'Submit application'}</button>
        </form>
      </div>
    </div>
  );
}

const sty = {
  page: { minHeight: '100vh', padding: '2rem', background: '#0f172a', color: '#f1f5f9' },
  card: { maxWidth: 480, margin: '0 auto' },
  field: { marginBottom: '1rem' },
  input: { width: '100%', padding: '0.5rem', marginTop: '0.25rem' },
  btn: { padding: '0.75rem 1rem', cursor: 'pointer' },
  error: { color: '#f87171' },
};
