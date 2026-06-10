import { Building2, UserPlus, LogIn, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    title: 'Create Organization',
    description: 'Start a new workspace. You will be the owner and can invite your entire team.',
    icon: Building2,
    color: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    path: '/onboarding/create',
  },
  {
    title: 'Sign In',
    description: 'Use your email and password to access your workspace. Staff, admins, and managers all sign in here.',
    icon: LogIn,
    color: 'from-violet-500 to-purple-600',
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    path: '/onboarding/login',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-[120px] animate-float-delayed" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[15%] w-16 h-16 border border-blue-400/20 rounded-lg rotate-45 animate-float opacity-30" />
        <div className="absolute top-40 right-[20%] w-12 h-12 border border-indigo-400/20 rounded-full animate-float-delayed opacity-20" />
        <div className="absolute bottom-40 left-[25%] w-20 h-20 border border-cyan-400/20 rounded-xl rotate-12 animate-float opacity-25" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-[10%] w-8 h-8 border border-violet-400/20 rounded-full animate-float opacity-20" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-1/3 right-[15%] w-14 h-14 border border-blue-400/20 rounded-lg rotate-45 animate-float-delayed opacity-25" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-6xl w-full mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in-up">
            <Sparkles size={14} className="text-blue-400" />
            <span className="text-sm text-slate-400 font-medium">AI-Powered Organization Platform</span>
          </div>

          {/* Hero */}
          <div className="space-y-6 mb-16">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.1]">
              <span className="text-white">Welcome to</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300">
                OptivianAI
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              The intelligent platform to organize, manage, and scale your organization with AI-driven insights and powerful collaboration tools.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto stagger-children">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.title}
                  onClick={() => navigate(feature.path)}
                  className={`group relative text-left ${feature.borderColor} bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:bg-white/[0.06] hover:scale-[1.02] active:scale-[0.98]`}
                >
                  {/* Glow on hover */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.color} blur-2xl -z-10`} />

                  {/* Icon */}
                  <div className={`relative mb-6 w-14 h-14 rounded-xl ${feature.iconBg} p-3 shadow-lg shadow-${feature.color.split(' ')[0].replace('from-', '')}/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon size={28} className="text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-6 text-sm">
                    {feature.description}
                  </p>

                  {/* Arrow */}
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 group-hover:text-white transition-colors duration-300">
                    <span>Get started</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <p className="mt-16 text-sm text-slate-600 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            Powered by advanced AI · Secure & scalable
          </p>
        </div>
      </div>
    </div>
  );
}
