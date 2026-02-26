import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOrg } from '../context/OrgContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

export default function TestSubmissions() {
  const { testId } = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { organization } = useOrg();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [copied, setCopied] = useState(false);

  const canView = user?.role === 'Admin' || user?.canPostJobs === true;
  const orgSlug = organization?.slug;
  const userRole = user?.role?.toLowerCase();

  const getNavItems = () => {
    if (!orgSlug) return [];
    const items = [
      { path: `/${orgSlug}/${userRole}/dashboard`, label: 'Dashboard' },
    ];
    if (canView) {
      items.push(
        { path: `/${orgSlug}/${userRole}/forms`, label: 'Forms' },
        { path: `/${orgSlug}/${userRole}/tests`, label: 'Tests' },
        { path: `/${orgSlug}/${userRole}/questions`, label: 'Questions' }
      );
    }
    items.push(
      { path: `/${orgSlug}/${userRole}/analytics`, label: 'Analytics' },
      { path: '/dashboard/profile', label: 'Profile' }
    );
    return items;
  };

  useEffect(() => {
    if (!canView) {
      navigate(`/${orgSlug}/${userRole}/tests`);
      return;
    }
    loadSubmissions();
  }, [testId, canView, navigate, orgSlug, userRole]);

  async function loadSubmissions() {
    try {
      const [testRes, attemptsRes] = await Promise.all([
        api.api(`/organizations/me/tests/${testId}`),
        api.api(`/organizations/me/tests/${testId}/attempts`)
      ]);
      setTest(testRes.test);
      setAttempts(attemptsRes.attempts || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  if (!canView) return null;

  const filteredAttempts = attempts.filter(attempt => {
    if (minScore !== '' && attempt.totalScore < parseFloat(minScore)) return false;
    if (maxScore !== '' && attempt.totalScore > parseFloat(maxScore)) return false;
    return true;
  });

  function copyEmails() {
    const uniqueEmails = [...new Set(filteredAttempts.map(a => a.applicantId?.email).filter(Boolean))];
    navigator.clipboard.writeText(uniqueEmails.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
    title: { fontSize: '1.875rem', fontWeight: 600, color: theme.colors.text, margin: 0 },
    subtitle: { fontSize: '0.875rem', color: theme.colors.textMuted, marginTop: '0.25rem' },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20`, borderRadius: '8px', fontSize: '0.875rem' },
    table: { width: '100%', borderCollapse: 'collapse', background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: '8px', overflow: 'hidden' },
    th: { padding: theme.spacing.md, textAlign: 'left', borderBottom: `2px solid ${theme.colors.border}`, fontWeight: 600, color: theme.colors.text, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.5px', background: theme.colors.bg },
    td: { padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontSize: '0.875rem' },
    empty: { textAlign: 'center', padding: theme.spacing.xxl, color: theme.colors.textMuted, fontSize: '0.875rem' },
    btnSecondary: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontSize: '0.8125rem', fontFamily: theme.fonts.body, textDecoration: 'none', display: 'inline-block', borderRadius: '6px', transition: 'all 0.2s', fontWeight: 500 },
    badge: { padding: `${theme.spacing.xs} ${theme.spacing.sm}`, fontSize: '0.75rem', borderRadius: '12px', fontWeight: 500 },
    badgeSuccess: { background: `${theme.colors.success}20`, color: theme.colors.success },
    badgeWarning: { background: `${theme.colors.warning}20`, color: theme.colors.warning },
    filters: { marginBottom: theme.spacing.lg, padding: theme.spacing.lg, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: '8px', display: 'flex', gap: theme.spacing.md, alignItems: 'center', flexWrap: 'wrap' },
    filterLabel: { fontSize: '0.875rem', color: theme.colors.text, fontWeight: 500 },
    filterInput: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, borderRadius: '6px', fontFamily: theme.fonts.body, width: '100px', fontSize: '0.875rem' },
    btnCopy: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.success, border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8125rem', fontFamily: theme.fonts.body, borderRadius: '6px', fontWeight: 500 },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={getNavItems()} />}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Test Submissions</h1>
          <p style={s.subtitle}>{test?.title}</p>
        </div>
        <button onClick={() => navigate(`/${orgSlug}/${userRole}/tests`)} style={s.btnSecondary}>
          Back to Tests
        </button>
      </div>
      {error && <div style={s.error}>{error}</div>}
      <div style={s.filters}>
        <span style={s.filterLabel}>Filter by Score:</span>
        <input 
          type="number" 
          placeholder="Min" 
          value={minScore} 
          onChange={(e) => setMinScore(e.target.value)} 
          style={s.filterInput}
        />
        <span style={{ color: theme.colors.textMuted }}>to</span>
        <input 
          type="number" 
          placeholder="Max" 
          value={maxScore} 
          onChange={(e) => setMaxScore(e.target.value)} 
          style={s.filterInput}
        />
        {(minScore || maxScore) && (
          <button 
            onClick={() => { setMinScore(''); setMaxScore(''); }} 
            style={{ ...s.btnSecondary, padding: `${theme.spacing.xs} ${theme.spacing.sm}`, fontSize: '0.75rem' }}
          >
            Clear
          </button>
        )}
        <button 
          onClick={copyEmails} 
          disabled={filteredAttempts.length === 0}
          style={{ ...s.btnCopy, opacity: filteredAttempts.length === 0 ? 0.5 : 1, cursor: filteredAttempts.length === 0 ? 'not-allowed' : 'pointer' }}
        >
          {copied ? 'Copied!' : 'Copy Emails'}
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: theme.colors.textMuted }}>
          Showing {filteredAttempts.length} of {attempts.length} submissions
        </span>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : filteredAttempts.length === 0 ? (
        <div style={s.empty}>{attempts.length === 0 ? 'No submissions yet' : 'No submissions match the filter criteria'}</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Applicant</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Submitted</th>
              <th style={s.th}>Score</th>
              <th style={s.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttempts.map((attempt) => (
              <tr key={attempt._id}>
                <td style={s.td}>{attempt.applicantId?.name || 'N/A'}</td>
                <td style={s.td}>{attempt.applicantId?.email || 'N/A'}</td>
                <td style={s.td}>{new Date(attempt.submittedAt).toLocaleString()}</td>
                <td style={s.td}>
                  {attempt.totalScore !== undefined ? `${attempt.totalScore}/${attempt.maxScore}` : 'N/A'}
                </td>
                <td style={s.td}>
                  {attempt.needsManualEvaluation ? (
                    <span style={{ ...s.badge, ...s.badgeWarning }}>Needs Review</span>
                  ) : (
                    <span style={{ ...s.badge, ...s.badgeSuccess }}>Auto-Graded</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardLayout>
  );
}
