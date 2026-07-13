import { Building2, LogIn, UserPlus, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';

const features = [
  {
    title: 'Create Organization',
    description: 'Start a new workspace. You will be the owner and can invite your entire team.',
    icon: Building2,
    path: '/onboarding/create',
    gradient: 'from-blue-500 to-indigo-500',
    highlight: false,
  },
  {
    title: 'Create Account',
    description: 'Sign up with email or continue with Google, GitHub, or Microsoft.',
    icon: UserPlus,
    path: '/onboarding/signup',
    gradient: 'from-violet-500 to-purple-500',
    highlight: false,
  },
  {
    title: 'Sign In',
    description: 'Already have an account? Sign in with your email and password or a social provider.',
    icon: LogIn,
    path: '/onboarding/login',
    gradient: 'from-blue-600 to-violet-600',
    highlight: true,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/app" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-premium flex items-center justify-center shadow-premium-lg animate-pulse-soft">
            <Sparkles size={24} className="text-white" />
          </div>
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-primary/3 to-accent2/3 dark:from-primary/5 dark:to-accent2/5 rounded-full blur-3xl" />

      <div className="max-w-6xl w-full mx-auto text-center relative z-10">
        {/* Hero */}
        <div className="space-y-6 mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass dark:glass-dark text-sm text-primary dark:text-primary-light font-medium mb-4 shadow-soft">
            <Sparkles size={16} />
            <span>AI-Powered Business Platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Welcome to{' '}
            <span className="gradient-text">
              OptivianAI
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The intelligent platform to organize, manage, and scale your organization with AI-driven insights and powerful collaboration tools.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.title}
                onClick={() => navigate(feature.path)}
                className="group text-left glass dark:glass-dark rounded-2xl p-8 transition-all duration-300 hover:shadow-glass-lg hover:-translate-y-1 active:scale-[0.98]"
                style={{
                  animationDelay: `${index * 0.15}s`,
                  animation: `fade-in-up 0.6s ease-out ${index * 0.15}s forwards`,
                  opacity: 0,
                }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <Icon size={26} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                  {feature.description}
                </p>
                <div className={`flex items-center gap-1.5 text-sm font-medium ${
                  feature.highlight
                    ? 'text-primary dark:text-primary-light'
                    : 'text-primary dark:text-primary-light'
                } group-hover:gap-2 transition-all`}>
                  <span>Get started</span>
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <p className="mt-16 text-sm text-slate-400 dark:text-slate-500">
          Powered by advanced AI &middot; Secure &amp; scalable &middot; Enterprise-ready
        </p>
      </div>
    </div>
  );
}
