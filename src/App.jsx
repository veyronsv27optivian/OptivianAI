import { lazy, Suspense, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './services/AuthContext';

// ─── Lazy-loaded page components ───────────────────────────────
// Code-splitting: each page loads only when navigated to, reducing initial bundle size by ~60-80%.
const Onboarding = lazy(() => import('./pages/Auth/Onboarding'));
const SignUp = lazy(() => import('./pages/Auth/SignUp'));
const CreateOrganization = lazy(() => import('./pages/Auth/CreateOrganization'));
const Login = lazy(() => import('./pages/Auth/Login'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const SetupGuide = lazy(() => import('./pages/Auth/SetupGuide'));
const MfaVerify = lazy(() => import('./pages/Auth/MfaVerify'));
const MainLayout = lazy(() => import('./layouts/MainLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Users = lazy(() => import('./pages/Users/Users'));
const Tasks = lazy(() => import('./pages/Tasks/Tasks'));
const Chat = lazy(() => import('./pages/Chat/Chat'));
const AI = lazy(() => import('./pages/AI/AI'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AiCacheManager = lazy(() => import('./pages/Admin/AiCacheManager'));
const AiAdminConsole = lazy(() => import('./pages/Admin/AiAdminConsole'));
const OrganizationProfile = lazy(() => import('./pages/Organization/OrganizationProfile'));
const Files = lazy(() => import('./pages/Files/Files'));
const OrganizationAnalytics = lazy(() => import('./pages/Organization/OrganizationAnalytics'));
const OrganizationActivity = lazy(() => import('./pages/Organization/OrganizationActivity'));
const OrganizationStructure = lazy(() => import('./pages/Organization/OrganizationStructure'));
const JourneyViewer3D = lazy(() => import('./pages/Analytics/JourneyViewer3D'));
const AutonomousAIManager = lazy(() => import('./pages/Dashboard/AutonomousAIManager'));
const ProtectedRoute = lazy(() => import('./services/ProtectedRoute'));

// ─── Loading spinner ───────────────────────────────────────────
function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{message}</p>
      </div>
    </div>
  );
}

// ─── Lazy wrapper (keeps Suspense + auth guard at route level) ─
function LazyPage({ component: Component, ...props }) {
  const { loading } = useAuth();
  const location = useLocation();
  // Don't block onboarding/auth pages with loading spinner —
  // those pages don't need auth, so they should render immediately.
  const isOnboarding = location.pathname.startsWith('/onboarding');
  if (loading && !isOnboarding && Component !== ProtectedRoute) {
    return <PageLoader message="Loading your workspace..." />;
  }
  return (
    <Suspense fallback={<PageLoader />}>
      <Component {...props} />
    </Suspense>
  );
}

function LazyProtected({ children, ...props }) {
  return (
    <Suspense fallback={<PageLoader message="Checking permissions..." />}>
      <ProtectedRoute {...props}>
        {children}
      </ProtectedRoute>
    </Suspense>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="min-h-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/onboarding" replace />} />
          <Route path="/onboarding" element={<LazyPage component={Onboarding} />} />
          <Route path="/onboarding/signup" element={<LazyPage component={SignUp} />} />
          <Route path="/onboarding/create" element={<LazyPage component={CreateOrganization} />} />
          <Route path="/onboarding/login" element={<LazyPage component={Login} />} />
          <Route path="/onboarding/mfa-verify" element={<LazyPage component={MfaVerify} />} />
          <Route path="/onboarding/reset-password" element={<LazyPage component={ResetPassword} />} />
          <Route path="/onboarding/update-password" element={<LazyPage component={ResetPassword} />} />
          <Route path="/onboarding/setup" element={<LazyPage component={SetupGuide} />} />
          <Route path="/onboarding/verify" element={
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
              <div className="text-center p-8">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Check Your Email</h1>
                <p className="text-sm text-slate-500">Please verify your email address to continue.</p>
              </div>
            </div>
          } />

          {/* Main App Routes */}
          <Route
            path="/app"
            element={
              <LazyProtected>
                <LazyPage component={MainLayout} />
              </LazyProtected>
            }
          >
            <Route index element={<LazyPage component={Dashboard} />} />
            <Route
              path="users"
              element={
                <LazyProtected requiredResource="users" requiredAction="view">
                  <LazyPage component={Users} />
                </LazyProtected>
              }
            />
            <Route
              path="admin"
              element={
                <LazyProtected requiredResource="users" requiredAction="manage">
                  <LazyPage component={AdminDashboard} />
                </LazyProtected>
              }
            />
            <Route
              path="admin/cache"
              element={
                <LazyProtected requiredResource="users" requiredAction="manage">
                  <LazyPage component={AiCacheManager} />
                </LazyProtected>
              }
            />
            <Route
              path="admin/ai-console"
              element={
                <LazyProtected requiredResource="users" requiredAction="manage">
                  <LazyPage component={AiAdminConsole} />
                </LazyProtected>
              }
            />
            <Route path="tasks" element={<LazyPage component={Tasks} />} />
            <Route path="chat" element={<LazyPage component={Chat} />} />

            {/* Organization Management */}
            <Route path="org" element={
              <LazyProtected requiredResource="organization" requiredAction="view">
                <LazyPage component={OrganizationProfile} />
              </LazyProtected>
            } />
            <Route path="org/analytics" element={
              <LazyProtected requiredResource="analytics" requiredAction="view">
                <LazyPage component={OrganizationAnalytics} />
              </LazyProtected>
            } />
            <Route path="org/activity" element={
              <LazyProtected requiredResource="organization" requiredAction="view">
                <LazyPage component={OrganizationActivity} />
              </LazyProtected>
            } />
            <Route path="org/structure" element={
              <LazyProtected requiredResource="organization" requiredAction="view">
                <LazyPage component={OrganizationStructure} />
              </LazyProtected>
            } />

            {/* AI Platform */}
            <Route path="ai" element={
              <LazyProtected requiredResource="ai" requiredAction="view">
                <LazyPage component={AI} />
              </LazyProtected>
            } />
            <Route path="ai/settings" element={
              <LazyProtected requiredResource="ai" requiredAction="view">
                <div className="h-full flex flex-col"><LazyPage component={AI} /></div>
              </LazyProtected>
            } />
            <Route path="ai/history" element={
              <LazyProtected requiredResource="ai" requiredAction="view">
                <div className="h-full flex flex-col"><LazyPage component={AI} /></div>
              </LazyProtected>
            } />
            <Route path="ai/providers" element={
              <LazyProtected requiredResource="ai" requiredAction="view">
                <div className="h-full flex flex-col"><LazyPage component={AI} /></div>
              </LazyProtected>
            } />

            {/* Files */}
            <Route path="files" element={<LazyPage component={Files} />} />

            {/* Journey Viewer 3D (D4.7) */}
            <Route path="journey" element={<LazyPage component={JourneyViewer3D} />} />

            {/* Autonomous AI Manager (D4.9) */}
            <Route path="ai-manager" element={<LazyPage component={AutonomousAIManager} />} />

            {/* Settings */}
            <Route path="settings" element={<LazyPage component={Settings} />} />
            <Route path="settings/login-history" element={<LazyPage component={Settings} />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  // ─── OAuth callback guard (#2) ──────────────────────────────
  // When Supabase redirects back after OAuth, the access_token lands in the
  // URL hash fragment. But HashRouter consumes the hash for routing, so the
  // tokens would be lost. We detect the callback here, BEFORE the Router
  // mounts, and wait for Supabase to process the tokens and clear the hash.
  const [oauthProcessing, setOauthProcessing] = useState(() => {
    return window.location.hash.includes('access_token=');
  });

  useEffect(() => {
    if (!oauthProcessing) return;
    const check = setInterval(() => {
      if (!window.location.hash.includes('access_token=')) {
        setOauthProcessing(false);
        clearInterval(check);
      }
    }, 150);
    // Safety timeout — never hang forever
    const safety = setTimeout(() => {
      clearInterval(check);
      setOauthProcessing(false);
    }, 8000);
    return () => { clearInterval(check); clearTimeout(safety); };
  }, [oauthProcessing]);

  if (oauthProcessing) {
    return <PageLoader message="Completing sign-in..." />;
  }

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <AnimatedRoutes />
      </Suspense>
    </Router>
  );
}

export default App;
