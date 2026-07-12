import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './services/AuthContext';
import Onboarding from './pages/Auth/Onboarding';
import SignUp from './pages/Auth/SignUp';
import CreateOrganization from './pages/Auth/CreateOrganization';
import Login from './pages/Auth/Login';
import ResetPassword from './pages/Auth/ResetPassword';
import MfaVerify from './pages/Auth/MfaVerify';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Users from './pages/Users/Users';
import Tasks from './pages/Tasks/Tasks';
import Chat from './pages/Chat/Chat';
import AI from './pages/AI/AI';
import Settings from './pages/Settings/Settings';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ProtectedRoute from './services/ProtectedRoute';
import OrganizationProfile from './pages/Organization/OrganizationProfile';
import OrganizationAnalytics from './pages/Organization/OrganizationAnalytics';
import OrganizationActivity from './pages/Organization/OrganizationActivity';
import OrganizationStructure from './pages/Organization/OrganizationStructure';
import AIToolView from './pages/AI/AIToolView';
import AISettings from './pages/AI/AISettings';
import AIHistory from './pages/AI/AIHistory';
import AIProviders from './pages/AI/AIProviders';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/onboarding/signup" element={<SignUp />} />
        <Route path="/onboarding/create" element={<CreateOrganization />} />
        <Route path="/onboarding/login" element={<Login />} />
        <Route path="/onboarding/mfa-verify" element={<MfaVerify />} />
        <Route path="/onboarding/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding/update-password" element={<ResetPassword />} />
        <Route path="/onboarding/verify" element={<div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Check Your Email</h1>
            <p className="text-sm text-slate-500">Please verify your email address to continue.</p>
          </div>
        </div>} />

        {/* Main App Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route
            path="users"
            element={
              <ProtectedRoute requiredResource="users" requiredAction="view">
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute requiredResource="users" requiredAction="manage">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="tasks" element={<Tasks />} />
          <Route path="chat" element={<Chat />} />

          {/* ── Organization Management ──────────────────────────── */}
          <Route path="org" element={
            <ProtectedRoute requiredResource="organization" requiredAction="view">
              <OrganizationProfile />
            </ProtectedRoute>
          } />
          <Route path="org/analytics" element={
            <ProtectedRoute requiredResource="analytics" requiredAction="view">
              <OrganizationAnalytics />
            </ProtectedRoute>
          } />
          <Route path="org/activity" element={
            <ProtectedRoute requiredResource="organization" requiredAction="view">
              <OrganizationActivity />
            </ProtectedRoute>
          } />
          <Route path="org/structure" element={
            <ProtectedRoute requiredResource="organization" requiredAction="view">
              <OrganizationStructure />
            </ProtectedRoute>
          } />

          {/* ── AI Platform ────────────────────────────────── */}
          <Route path="ai" element={
              <ProtectedRoute requiredResource="ai" requiredAction="view">
                <AI />
              </ProtectedRoute>
            }
          />
          <Route path="ai/settings" element={
            <ProtectedRoute requiredResource="ai" requiredAction="view">
              <div className="h-full flex flex-col"><AI /></div>
            </ProtectedRoute>
          } />
          <Route path="ai/history" element={
            <ProtectedRoute requiredResource="ai" requiredAction="view">
              <div className="h-full flex flex-col"><AI /></div>
            </ProtectedRoute>
          } />
          <Route path="ai/providers" element={
            <ProtectedRoute requiredResource="ai" requiredAction="view">
              <div className="h-full flex flex-col"><AI /></div>
            </ProtectedRoute>
          } />
          
          {/* ── Settings ─────────────────────────────────────── */}
          <Route path="settings" element={<Settings />} />
          <Route path="settings/login-history" element={<Settings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
