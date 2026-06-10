import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './services/AuthContext';
import Onboarding from './pages/Auth/Onboarding';
import CreateOrganization from './pages/Auth/CreateOrganization';
import Login from './pages/Auth/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Users from './pages/Users/Users';
import Tasks from './pages/Tasks/Tasks';
import Chat from './pages/Chat/Chat';
import AI from './pages/AI/AI';
import Settings from './pages/Settings/Settings';
import ProtectedRoute from './services/ProtectedRoute';

// Role-based route wrapper
function RoleRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role || 'staff';

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/app" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/onboarding/create" element={<CreateOrganization />} />
        <Route path="/onboarding/login" element={<Login />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={
            <RoleRoute allowedRoles={['admin', 'manager']}>
              <Users />
            </RoleRoute>
          } />
          <Route path="tasks" element={<Tasks />} />
          <Route path="chat" element={<Chat />} />
          <Route path="ai" element={
            <RoleRoute allowedRoles={['admin']}>
              <AI />
            </RoleRoute>
          } />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
