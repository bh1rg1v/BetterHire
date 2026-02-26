import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardManager from './pages/DashboardManager';
import Profile from './pages/Profile';
import InviteAccept from './pages/InviteAccept';
import JobsPublic from './pages/JobsPublic';
import JobPublic from './pages/JobPublic';
import Apply from './pages/Apply';
import DashboardApplicant from './pages/DashboardApplicant';
import FormsBuilder from './pages/FormsBuilder';
import FormCreate from './pages/FormCreate';
import FormEdit from './pages/FormEdit';
import FormSubmissions from './pages/FormSubmissions';
import SubmissionView from './pages/SubmissionView';
import SubmissionEdit from './pages/SubmissionEdit';
import PositionSubmissions from './pages/PositionSubmissions';
import PositionAttempts from './pages/PositionAttempts';
import Questions from './pages/Questions';
import Tests from './pages/Tests';
import TestCreate from './pages/TestCreate';
import TestEdit from './pages/TestEdit';
import TestOverview from './pages/TestOverview';
import TakeTest from './pages/TakeTest';
import TestSubmissions from './pages/TestSubmissions';
import Analytics from './pages/Analytics';
import PositionCreate from './pages/PositionCreate';
import PositionEdit from './pages/PositionEdit';
import SuperAdmin from './pages/SuperAdmin';
import SuperAdminUsers from './pages/SuperAdminUsers';
import SuperAdminOrganizations from './pages/SuperAdminOrganizations';
import { OrgProvider } from './context/OrgContext';

import PublicProfile from './pages/PublicProfile';

import JoinOrganization from './pages/JoinOrganization';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
      <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/superadmin" element={<ProtectedRoute allowedRoles={['SuperAdmin']}><SuperAdmin /></ProtectedRoute>} />
      <Route path="/dashboard/superadmin/users" element={<ProtectedRoute allowedRoles={['SuperAdmin']}><SuperAdminUsers /></ProtectedRoute>} />
      <Route path="/dashboard/superadmin/organizations" element={<ProtectedRoute allowedRoles={['SuperAdmin']}><SuperAdminOrganizations /></ProtectedRoute>} />
      <Route path="/dashboard/applicant" element={<ProtectedRoute allowedRoles={['Applicant']}><DashboardApplicant /></ProtectedRoute>} />
      <Route path="/dashboard/submissions/:id" element={<ProtectedRoute allowedRoles={['Applicant']}><SubmissionView /></ProtectedRoute>} />
      <Route path="/dashboard/submissions/:id/edit" element={<ProtectedRoute allowedRoles={['Applicant']}><SubmissionEdit /></ProtectedRoute>} />
      <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/invite/accept" element={<InviteAccept />} />
      <Route path="/jobs" element={<JobsPublic />} />
      <Route path="/job/:id" element={<JobPublic />} />
      <Route path="/apply/:positionId" element={<ProtectedRoute allowedRoles={['Applicant']}><Apply /></ProtectedRoute>} />
      <Route path="/apply/form/:formUrl" element={<Apply />} />
      <Route path="/join-organization" element={<ProtectedRoute allowedRoles={['Manager']}><JoinOrganization /></ProtectedRoute>} />
      <Route path="/users/:username" element={<PublicProfile />} />
      <Route path="/test/:testUrl/:questionId" element={<TakeTest />} />
      <Route path="/test/:testUrl/take" element={<TakeTest />} />
      <Route path="/test/:testUrl" element={<TestOverview />} />
      
      {/* Organization-based routes */}
      <Route path="/:orgHandle/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><DashboardManager /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/dashboard" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><DashboardManager /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/jobs" element={<OrgProvider><JobsPublic /></OrgProvider>} />
      <Route path="/:orgHandle/admin/forms" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><FormsBuilder /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/forms" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><FormsBuilder /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/forms/create" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><FormCreate /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/forms/create" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><FormCreate /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/forms/:formUrl/edit" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><FormEdit /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/forms/:formUrl/edit" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><FormEdit /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/forms/:formUrl/submissions" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><FormSubmissions /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/forms/:formUrl/submissions" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><FormSubmissions /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/questions" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><Questions /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/questions" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><Questions /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/tests" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><Tests /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/tests" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><Tests /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/tests/create" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><TestCreate /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/tests/create" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><TestCreate /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/tests/:id/edit" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><TestEdit /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/tests/:id/edit" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><TestEdit /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/tests/:testId/submissions" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><TestSubmissions /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/tests/:testId/submissions" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><TestSubmissions /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/positions/create" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><PositionCreate /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/positions/create" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><PositionCreate /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/positions/:positionUrl/edit" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><PositionEdit /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/positions/:positionUrl/edit" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><PositionEdit /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/analytics" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><Analytics /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/analytics" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><Analytics /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/submissions/:id" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><SubmissionView /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/submissions/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><SubmissionView /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/positions/:positionId/submissions" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><PositionSubmissions /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/positions/:positionId/submissions" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><PositionSubmissions /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/admin/positions/:positionId/attempts" element={<ProtectedRoute allowedRoles={['Admin']}><OrgProvider><PositionAttempts /></OrgProvider></ProtectedRoute>} />
      <Route path="/:orgHandle/manager/positions/:positionId/attempts" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><OrgProvider><PositionAttempts /></OrgProvider></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function GuestOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
