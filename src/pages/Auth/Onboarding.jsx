import { Building2, LogIn, UserPlus, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';

const features = [
  {
    title: 'Create Organization',
    description: 'Start a new workspace. You will be the owner and can invite your entire team.',
    icon: Building2,
    path: '/onboarding/create',
    highlight: false,
  },
  {
    title: 'Create Account',
    description: 'Sign up with email or continue with Google, GitHub, or Microsoft.',
    icon: UserPlus,
    path: '/onboarding/signup',
    highlight: false,
  },
  {
    title: 'Sign In',
    description: 'Already have an account? Sign in with your email and password or a social provider.',
    icon: LogIn,
    path: '/onboarding/login',
    highlight: true,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // If already authenticated, go to app (declarative Navigate avoids React warnings)
  if (!loading && user) {
    return <Navigate to="/app" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-6xl w-full mx-auto text-center">
        {/* Hero */}
        <div className="space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-sm text-blue-700 font-medium mb-4">
            <Sparkles size={16} />
            <span>AI-Powered Business Platform</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
            Welcome to{' '}
            <span className="text-blue-600">
              OptivianAI
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The intelligent platform to organize, manage, and scale your organization with AI-driven insights and powerful collaboration tools.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.title}
                onClick={() => navigate(feature.path)}
                className={`group text-left bg-white border rounded-lg p-8 transition-all duration-200 hover:shadow-sm active:border-blue-300 ${
                  feature.highlight
                    ? 'border-blue-200 shadow-sm hover:border-blue-300'
                    : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 group-hover:scale-105 transition-transform ${
                  feature.highlight ? 'bg-blue-600' : 'bg-blue-600'
                }`}>
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  {feature.description}
                </p>
                <div className="flex items-center gap-1.5 text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                  <span>Get started</span>
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <p className="mt-16 text-sm text-slate-400">
          Powered by advanced AI &middot; Secure &amp; scalable &middot; Enterprise-ready
        </p>
      </div>
    </div>
  );
}
