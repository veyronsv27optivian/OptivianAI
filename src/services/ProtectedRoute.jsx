import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { hasPermission } from './auth/permissions';

/**
 * ProtectedRoute — requires authentication.
 * Optional props: allowedRoles, requiredResource, requiredAction
 *
 * Examples:
 *   <ProtectedRoute>                        — any authenticated user
 *   <ProtectedRoute allowedRoles={['admin']}> — specific roles only (legacy)
 *   <ProtectedRoute requiredResource="users" requiredAction="manage">  — specific permission
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  requiredResource,
  requiredAction,
}) {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // Check legacy allowedRoles
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/app" replace />;
    }
  }

  // Check RBAC permission
  if (requiredResource && requiredAction) {
    if (!hasPermission(userRole, requiredResource, requiredAction)) {
      return <Navigate to="/app" replace />;
    }
  }

  return children;
}
