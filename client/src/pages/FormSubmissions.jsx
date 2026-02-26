import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOrg } from '../context/OrgContext';
import { Sidebar } from '../components/layout/Sidebar';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import * as api from '../api/client';

export default function FormSubmissions() {
  const { formUrl } = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { organization } = useOrg();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});
  const [testLink, setTestLink] = useState('');
  const [testStartDate, setTestStartDate] = useState('');
  const [testValidityDays, setTestValidityDays] = useState(7);
  const [testMaxAttempts, setTestMaxAttempts] = useState(1);
  const [editingTestLink, setEditingTestLink] = useState(null);

  const canView = user?.role === 'Admin' || user?.canPostJobs === true;

  const getNavItems = () => {
    const role = user?.role === 'Admin' ? 'admin' : 'manager';
    const items = [
      { path: `/${organization?.slug}/${role}/dashboard`, label: 'Dashboard' },
      ...(user?.role === 'Admin' ? [{ path: `/${organization?.slug}/admin/dashboard`, label: 'Organization' }] : []),
    ];
    if (canView) {
      items.push(
        { path: `/${organization?.slug}/${role}/forms`, label: 'Forms' },
        { path: `/${organization?.slug}/${role}/tests`, label: 'Tests' },
        { path: `/${organization?.slug}/${role}/questions`, label: 'Questions' }
      );
    }
    items.push(
      { path: `/${organization?.slug}/${role}/analytics`, label: 'Analytics' },
      { path: '/dashboard/profile', label: 'Profile' }
    );
    return items;
  };

  useEffect(() => {
    if (!canView) {
      const role = user?.role === 'Admin' ? 'admin' : 'manager';
      navigate(`/${organization?.slug}/${role}/forms`);
      return;
    }
    loadSubmissions();
  }, [formUrl, canView, navigate, organization]);

  function loadSubmissions() {
    Promise.all([
      api.api(`/organizations/me/forms/url/${formUrl}`),
      api.api(`/organizations/me/forms/url/${formUrl}/submissions`)
    ])
      .then(([formRes, subRes]) => {
        setForm(formRes.form);
        setSubmissions(subRes.submissions || []);
      })
      .catch((e) => {
        setError(e.message || 'Failed to load');
      })
      .finally(() => setLoading(false));
  }

  async function updateStatus(submissionId, status) {
    try {
      await api.api(`/organizations/me/forms/submissions/${submissionId}/status`, { method: 'PATCH', body: { status } });
      loadSubmissions();
    } catch (e) {
      setError(e.message || 'Failed to update status');
    }
  }

  async function selectAll() {
    try {
      const promises = submissions.map(sub => 
        api.api(`/organizations/me/forms/submissions/${sub._id}/status`, { method: 'PATCH', body: { status: 'shortlisted' } })
      );
      await Promise.all(promises);
      loadSubmissions();
    } catch (e) {
      setError(e.message || 'Failed to select all');
    }
  }

  async function selectFiltered() {
    try {
      const promises = filteredSubmissions.map(sub => 
        api.api(`/organizations/me/forms/submissions/${sub._id}/status`, { method: 'PATCH', body: { status: 'shortlisted' } })
      );
      await Promise.all(promises);
      loadSubmissions();
    } catch (e) {
      setError(e.message || 'Failed to select filtered');
    }
  }

  async function applyTestLinkToFiltered() {
    if (!testLink || !testStartDate) {
      setError('Test link and start date are required');
      return;
    }
    const endDate = new Date(testStartDate);
    endDate.setDate(endDate.getDate() + testValidityDays);
    try {
      const targetSubmissions = filteredSubmissions.filter(sub => sub.status === 'shortlisted' && !sub.testLink);
      const emails = targetSubmissions.map(sub => sub.applicantId?.email).filter(Boolean);
      
      // Extract test URL from test link
      const testUrlMatch = testLink.match(/\/test\/([^\/\?]+)/);
      if (testUrlMatch && testUrlMatch[1] && emails.length > 0) {
        const testUrl = testUrlMatch[1];
        // Add emails to test access
        try {
          const tests = await api.api('/organizations/me/tests');
          const matchingTest = tests.tests?.find(t => t.testUrl === testUrl);
          if (matchingTest) {
            const existingEmails = matchingTest.allowedEmails || [];
            const newEmails = [...new Set([...existingEmails, ...emails])];
            await api.api(`/organizations/me/tests/${matchingTest._id}`, {
              method: 'PATCH',
              body: { allowedEmails: newEmails }
            });
          }
        } catch (e) {
          console.error('Failed to update test access:', e);
        }
      }
      
      const promises = targetSubmissions.map(sub => 
        api.api(`/organizations/me/forms/submissions/${sub._id}/test-link`, { 
          method: 'PATCH', 
          body: { testLink, testStartDate, testEndDate: endDate.toISOString(), maxAttempts: testMaxAttempts } 
        })
      );
      await Promise.all(promises);
      loadSubmissions();
    } catch (e) {
      setError(e.message || 'Failed to apply test links');
    }
  }

  async function updateIndividualTestLink(submissionId, link, startDate, validityDays, maxAttempts) {
    if (!link || !startDate) {
      setError('Test link and start date are required');
      return;
    }
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + validityDays);
    try {
      const submission = submissions.find(s => s._id === submissionId);
      const email = submission?.applicantId?.email;
      
      // Extract test URL from test link and add email to access
      if (email) {
        const testUrlMatch = link.match(/\/test\/([^\/\?]+)/);
        if (testUrlMatch && testUrlMatch[1]) {
          const testUrl = testUrlMatch[1];
          try {
            const tests = await api.api('/organizations/me/tests');
            const matchingTest = tests.tests?.find(t => t.testUrl === testUrl);
            if (matchingTest) {
              const existingEmails = matchingTest.allowedEmails || [];
              if (!existingEmails.includes(email.toLowerCase())) {
                await api.api(`/organizations/me/tests/${matchingTest._id}`, {
                  method: 'PATCH',
                  body: { allowedEmails: [...existingEmails, email] }
                });
              }
            }
          } catch (e) {
            console.error('Failed to update test access:', e);
          }
        }
      }
      
      await api.api(`/organizations/me/forms/submissions/${submissionId}/test-link`, { 
        method: 'PATCH', 
        body: { testLink: link, testStartDate: startDate, testEndDate: endDate.toISOString(), maxAttempts } 
      });
      setEditingTestLink(null);
      loadSubmissions();
    } catch (e) {
      setError(e.message || 'Failed to update test link');
    }
  }

  function handleFilterChange(fieldId, operator, value) {
    setFilters(f => ({ ...f, [fieldId]: { operator, value } }));
  }

  const numericFields = form?.schema?.fields?.filter(f => f.type === 'number') || [];
  const filteredSubmissions = submissions.filter(sub => {
    return Object.entries(filters).every(([fieldId, filter]) => {
      if (!filter.value) return true;
      const fieldValue = parseFloat(sub.data?.[fieldId]);
      const filterValue = parseFloat(filter.value);
      if (isNaN(fieldValue) || isNaN(filterValue)) return true;
      switch(filter.operator) {
        case '==': return fieldValue === filterValue;
        case '<=': return fieldValue <= filterValue;
        case '>=': return fieldValue >= filterValue;
        default: return true;
      }
    });
  });

  if (!canView) return null;

  const s = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xl },
    title: { fontSize: '1.875rem', fontWeight: 600, color: theme.colors.text, margin: 0 },
    subtitle: { fontSize: '0.875rem', color: theme.colors.textMuted, marginTop: '0.25rem' },
    error: { color: theme.colors.danger, marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: `${theme.colors.danger}20`, borderRadius: '8px', fontSize: '0.875rem' },
    table: { width: '100%', borderCollapse: 'collapse', background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: '8px', overflow: 'hidden' },
    th: { padding: theme.spacing.md, textAlign: 'left', borderBottom: `2px solid ${theme.colors.border}`, fontWeight: 600, color: theme.colors.text, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.5px', background: theme.colors.bg },
    td: { padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`, color: theme.colors.text, fontSize: '0.875rem' },
    empty: { textAlign: 'center', padding: theme.spacing.xxl, color: theme.colors.textMuted, fontSize: '0.875rem' },
    btnSecondary: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.bgHover, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, cursor: 'pointer', fontSize: '0.8125rem', fontFamily: theme.fonts.body, textDecoration: 'none', display: 'inline-block', borderRadius: '6px', marginRight: theme.spacing.sm, transition: 'all 0.2s', fontWeight: 500 },
    btnSuccess: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.success, border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8125rem', fontFamily: theme.fonts.body, borderRadius: '6px', marginRight: theme.spacing.sm, transition: 'all 0.2s', fontWeight: 500 },
    btnDanger: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.danger, border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8125rem', fontFamily: theme.fonts.body, borderRadius: '6px', transition: 'all 0.2s', fontWeight: 500 },
    filters: { marginBottom: theme.spacing.lg, padding: theme.spacing.lg, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: '8px' },
    filterRow: { display: 'flex', gap: theme.spacing.md, alignItems: 'center', marginBottom: theme.spacing.sm },
    filterLabel: { fontSize: '0.8125rem', color: theme.colors.text, minWidth: '120px', fontWeight: 500 },
    filterSelect: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, borderRadius: '6px', fontFamily: theme.fonts.body, fontSize: '0.875rem' },
    filterInput: { padding: `${theme.spacing.sm} ${theme.spacing.md}`, background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, color: theme.colors.text, borderRadius: '6px', fontFamily: theme.fonts.body, width: '150px', fontSize: '0.875rem' },
  };

  return (
    <DashboardLayout sidebar={<Sidebar items={getNavItems()} />}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Form Submissions</h1>
          <p style={s.subtitle}>{form?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
          <button onClick={selectAll} style={s.btnSuccess}>Select All ({submissions.length})</button>
          <button onClick={selectFiltered} style={s.btnSuccess}>Select Filtered ({filteredSubmissions.length})</button>
          <button onClick={() => {
            const role = user?.role === 'Admin' ? 'admin' : 'manager';
            navigate(`/${organization?.slug}/${role}/forms`);
          }} style={s.btnSecondary}>Back to Forms</button>
        </div>
      </div>
      {error && <div style={s.error}>{error}</div>}
      {numericFields.length > 0 && (
        <div style={s.filters}>
          <h3 style={{ marginTop: 0, marginBottom: theme.spacing.md }}>Filters</h3>
          {numericFields.map(field => (
            <div key={field.id} style={s.filterRow}>
              <span style={s.filterLabel}>{field.label}:</span>
              <select value={filters[field.id]?.operator || '=='} onChange={(e) => handleFilterChange(field.id, e.target.value, filters[field.id]?.value || '')} style={s.filterSelect}>
                <option value="==">==</option>
                <option value="<=">&lt;=</option>
                <option value=">=">&gt;=</option>
              </select>
              <input type="number" value={filters[field.id]?.value || ''} onChange={(e) => handleFilterChange(field.id, filters[field.id]?.operator || '==', e.target.value)} placeholder="Value" style={s.filterInput} />
            </div>
          ))}
        </div>
      )}
      <div style={s.filters}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <h3 style={{ margin: 0 }}>Test Link Settings</h3>
          <button onClick={applyTestLinkToFiltered} style={s.btnSuccess}>Apply to Filtered Shortlisted ({filteredSubmissions.filter(sub => sub.status === 'shortlisted' && !sub.testLink).length})</button>
        </div>
        <div style={s.filterRow}>
          <span style={s.filterLabel}>Test Link:</span>
          <input type="url" value={testLink} onChange={(e) => setTestLink(e.target.value)} placeholder="https://example.com/test" style={{ ...s.filterInput, width: '300px' }} />
        </div>
        <div style={s.filterRow}>
          <span style={s.filterLabel}>Start Date:</span>
          <input type="date" value={testStartDate} onChange={(e) => setTestStartDate(e.target.value)} style={s.filterInput} />
        </div>
        <div style={s.filterRow}>
          <span style={s.filterLabel}>Validity Days:</span>
          <input type="number" value={testValidityDays} onChange={(e) => setTestValidityDays(parseInt(e.target.value) || 7)} min="1" style={s.filterInput} />
        </div>
        <div style={s.filterRow}>
          <span style={s.filterLabel}>Max Attempts:</span>
          <input type="number" value={testMaxAttempts} onChange={(e) => setTestMaxAttempts(parseInt(e.target.value) || 1)} min="1" style={s.filterInput} />
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : filteredSubmissions.length === 0 ? (
        <div style={s.empty}>No submissions yet</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Applicant</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Submitted</th>
              <th style={s.th}>Position</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Test Link</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map((sub) => (
              <tr key={sub._id}>
                <td style={s.td}>{sub.applicantId?.name || 'N/A'}</td>
                <td style={s.td}>{sub.applicantId?.email || 'N/A'}</td>
                <td style={s.td}>{new Date(sub.createdAt).toLocaleDateString()}</td>
                <td style={s.td}>{sub.positionId?.title || sub.positionFromForm?.title || 'Direct Application'}</td>
                <td style={s.td}>{sub.status}</td>
                <td style={s.td}>
                  {sub.testLink ? (
                    editingTestLink === sub._id ? (
                      <div style={{ minWidth: '200px' }}>
                        <input type="url" defaultValue={sub.testLink} id={`link-${sub._id}`} style={{ ...s.filterInput, width: '100%', marginBottom: '4px' }} placeholder="Test Link" />
                        <input type="date" defaultValue={sub.testStartDate?.split('T')[0]} id={`start-${sub._id}`} style={{ ...s.filterInput, width: '48%', marginRight: '4%' }} />
                        <input type="number" defaultValue={Math.ceil((new Date(sub.testEndDate) - new Date(sub.testStartDate)) / (1000 * 60 * 60 * 24))} id={`days-${sub._id}`} min="1" placeholder="Days" style={{ ...s.filterInput, width: '48%' }} />
                        <input type="number" defaultValue={sub.maxAttempts || 1} id={`attempts-${sub._id}`} min="1" placeholder="Max Attempts" style={{ ...s.filterInput, width: '100%', marginTop: '4px' }} />
                        <div style={{ marginTop: '4px' }}>
                          <button onClick={() => {
                            const link = document.getElementById(`link-${sub._id}`).value;
                            const start = document.getElementById(`start-${sub._id}`).value;
                            const days = parseInt(document.getElementById(`days-${sub._id}`).value) || 7;
                            const attempts = parseInt(document.getElementById(`attempts-${sub._id}`).value) || 1;
                            updateIndividualTestLink(sub._id, link, start, days, attempts);
                          }} style={{ ...s.btnSuccess, fontSize: '0.75rem', padding: '4px 8px', marginRight: '4px' }}>Save</button>
                          <button onClick={() => setEditingTestLink(null)} style={{ ...s.btnSecondary, fontSize: '0.75rem', padding: '4px 8px' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Valid: {new Date(sub.testStartDate).toLocaleDateString()} - {new Date(sub.testEndDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Max Attempts: {sub.maxAttempts || 1}</div>
                        <a href={sub.testLink} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary, textDecoration: 'none', marginRight: '8px' }}>View Link</a>
                        <button onClick={() => setEditingTestLink(sub._id)} style={{ ...s.btnSecondary, fontSize: '0.75rem', padding: '2px 6px' }}>Edit</button>
                      </div>
                    )
                  ) : (
                    sub.status === 'shortlisted' && (
                      <button onClick={() => updateIndividualTestLink(sub._id, testLink, testStartDate, testValidityDays, testMaxAttempts)} style={s.btnSecondary}>Add Test Link</button>
                    )
                  )}
                </td>
                <td style={s.td}>
                  {sub.status !== 'shortlisted' && (
                    <button onClick={() => updateStatus(sub._id, 'shortlisted')} style={s.btnSuccess}>Select</button>
                  )}
                  <button onClick={() => updateStatus(sub._id, 'rejected')} style={s.btnDanger}>Reject</button>
                  <button onClick={() => {
                    const role = user?.role === 'Admin' ? 'admin' : 'manager';
                    window.location.href = `/${organization?.slug}/${role}/submissions/${sub._id}`;
                  }} style={s.btnSecondary}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardLayout>
  );
}
