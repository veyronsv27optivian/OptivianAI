import { Building2, LogIn, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    title: 'Create Organization',
    description: 'Start a new workspace. You will be the owner and can invite your entire team.',
    icon: Building2,
    path: '/onboarding/create',
  },
  {
    title: 'Sign In',
    description: 'Use your email and password to access your workspace. Staff, admins, and managers all sign in here.',
    icon: LogIn,
    path: '/onboarding/login',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-6xl w-full mx-auto text-center">
        {/* Hero */}
        <div className="space-y-4 mb-16">
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
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.title}
                onClick={() => navigate(feature.path)}
                className="group text-left bg-white border border-slate-200 rounded-lg p-8 transition-all duration-200 hover:border-blue-200 hover:shadow-sm active:border-blue-300"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-700 transition-colors">
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
          Powered by advanced AI &middot; Secure &amp; scalable
        </p>
      </div>
    </div>
  );
}
