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
import PositionSubmissions from './pages/PositionSubmissions';
import PositionAttempts from './pages/PositionAttempts';
import Questions from './pages/Questions';
import Tests from './pages/Tests';
import TestCreate from './pages/TestCreate';
import TestEdit from './pages/TestEdit';
import TakeTest from './pages/TakeTest';
import Analytics from './pages/Analytics';
import PositionCreate from './pages/PositionCreate';
import PositionEdit from './pages/PositionEdit';

import PublicProfile from './pages/PublicProfile';

import JoinOrganization from './pages/JoinOrganization';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
      <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />
      <Route path="/invite/accept" element={<InviteAccept />} />
      <Route path="/jobs" element={<JobsPublic />} />
      <Route path="/job/:id" element={<JobPublic />} />
      <Route path="/apply/:positionId" element={<ProtectedRoute allowedRoles={['Applicant']}><Apply /></ProtectedRoute>} />
      <Route path="/apply/form/:formUrl" element={<Apply />} />
      <Route path="/dashboard/applicant" element={<ProtectedRoute allowedRoles={['Applicant']}><DashboardApplicant /></ProtectedRoute>} />
      <Route path="/dashboard/forms" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><FormsBuilder /></ProtectedRoute>} />
      <Route path="/dashboard/forms/create" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><FormCreate /></ProtectedRoute>} />
      <Route path="/dashboard/forms/:formUrl/submissions" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><FormSubmissions /></ProtectedRoute>} />
      <Route path="/dashboard/forms/:formUrl/edit" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><FormEdit /></ProtectedRoute>} />
      <Route path="/dashboard/submissions/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><SubmissionView /></ProtectedRoute>} />
      <Route path="/dashboard/positions/:positionId/submissions" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><PositionSubmissions /></ProtectedRoute>} />
      <Route path="/dashboard/positions/:positionId/attempts" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><PositionAttempts /></ProtectedRoute>} />
      <Route path="/dashboard/questions" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Questions /></ProtectedRoute>} />
      <Route path="/dashboard/tests" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Tests /></ProtectedRoute>} />
      <Route path="/dashboard/tests/create" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><TestCreate /></ProtectedRoute>} />
      <Route path="/dashboard/tests/:id/edit" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><TestEdit /></ProtectedRoute>} />
      <Route path="/dashboard/positions/create" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><PositionCreate /></ProtectedRoute>} />
      <Route path="/dashboard/positions/:positionUrl/edit" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><PositionEdit /></ProtectedRoute>} />
      <Route path="/test/:testUrl/:questionId" element={<TakeTest />} />
      <Route path="/test/:testUrl" element={<TakeTest />} />
      <Route path="/dashboard/analytics" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Analytics /></ProtectedRoute>} />
      <Route
        path="/dashboard/manager"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
            <DashboardManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/join-organization" element={<ProtectedRoute allowedRoles={['Manager']}><JoinOrganization /></ProtectedRoute>} />
      <Route path="/users/:username" element={<PublicProfile />} />
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
