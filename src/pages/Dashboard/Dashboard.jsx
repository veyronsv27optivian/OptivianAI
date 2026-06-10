import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, ShieldAlert, Target, TrendingUp, Users, CheckSquare,
  Activity, MessageSquare, Sparkles, BarChart3, Layers
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role || 'staff';
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Future: load dashboard data from Supabase
    const timer = setTimeout(() => {
      setDashboardData({});
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const role = userRole;

  const RoleStatCards = () => {
    const commonStats = [
      {
        label: 'Active Users',
        value: '—',
        icon: Users,
        color: 'from-emerald-500 to-teal-600',
        bgGlow: 'bg-emerald-500/10',
      },
      {
        label: 'Open Tasks',
        value: '—',
        icon: CheckSquare,
        color: 'from-cyan-500 to-blue-600',
        bgGlow: 'bg-cyan-500/10',
      },
    ];

    const adminManagerStats = [
      {
        label: 'Critical Risks',
        value: '—',
        icon: ShieldAlert,
        color: 'from-rose-500 to-pink-600',
        bgGlow: 'bg-rose-500/10',
      },
      {
        label: 'AI Suggestions',
        value: '—',
        icon: Brain,
        color: 'from-violet-500 to-purple-600',
        bgGlow: 'bg-violet-500/10',
      },
    ];

    const allStats = role === 'admin' || role === 'manager'
      ? [...commonStats, ...adminManagerStats]
      : [...commonStats, {
          label: 'My Tasks',
          value: '—',
          icon: CheckSquare,
          color: 'from-emerald-500 to-teal-600',
          bgGlow: 'bg-emerald-500/10',
        }];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {allStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.06] transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${stat.bgGlow} blur-xl -z-10`} />

              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                  <Icon size={22} className="text-white" />
                </div>
              </div>

              <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const QuickLinks = () => {
    const links = [
      ...(role === 'admin' || role === 'manager'
        ? [{ label: 'Manage Users', icon: Users, path: '/app/users', color: 'from-cyan-500 to-blue-600' }]
        : []),
      { label: 'View Tasks', icon: CheckSquare, path: '/app/tasks', color: 'from-emerald-500 to-teal-600' },
      { label: 'Team Chat', icon: MessageSquare, path: '/app/chat', color: 'from-violet-500 to-purple-600' },
      ...(role === 'admin'
        ? [{ label: 'AI Advisor', icon: Brain, path: '/app/ai', color: 'from-amber-500 to-orange-600' }]
        : []),
    ];

    return (
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <h2 className="text-lg font-bold text-white mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all duration-200 group"
              >
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${link.color} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={20} className="text-white" />
                </div>
                <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const WelcomeMessage = () => {
    const messages = {
      admin: {
        title: 'Welcome back, Admin',
        subtitle: 'Manage your organization, review AI insights, and keep your team on track.',
      },
      manager: {
        title: 'Welcome back',
        subtitle: 'Manage your team, assign tasks, and keep projects moving forward.',
      },
      staff: {
        title: 'Welcome back',
        subtitle: 'Check your tasks, collaborate with your team, and stay up to date.',
      },
    };
    const msg = messages[role] || messages.staff;

    return (
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white">{msg.title}</h1>
        <p className="text-slate-400 mt-1">{msg.subtitle}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <WelcomeMessage />
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <WelcomeMessage />

      {/* Stats Grid */}
      <RoleStatCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome content */}
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center gap-3 mb-6">
            <Activity size={20} className="text-blue-400" />
            <h2 className="text-lg font-bold text-white">Getting Started</h2>
          </div>

          <div className="space-y-4">
            {role === 'admin' && (
              <>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Invite your team</p>
                    <p className="text-xs text-slate-400 mt-1">Add staff members from the Users & Roles page so they can join your workspace.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CheckSquare size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Create tasks</p>
                    <p className="text-xs text-slate-400 mt-1">Assign tasks to your team members and track progress.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Brain size={18} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Explore AI Advisor</p>
                    <p className="text-xs text-slate-400 mt-1">Get AI-powered insights and recommendations for your business.</p>
                  </div>
                </div>
              </>
            )}
            {role === 'manager' && (
              <>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CheckSquare size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Manage tasks</p>
                    <p className="text-xs text-slate-400 mt-1">Assign and track tasks for your team members.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Users size={18} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">View team</p>
                    <p className="text-xs text-slate-400 mt-1">See your team members and their roles.</p>
                  </div>
                </div>
              </>
            )}
            {role === 'staff' && (
              <>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CheckSquare size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Your tasks</p>
                    <p className="text-xs text-slate-400 mt-1">Check the Tasks page to see what's been assigned to you.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <MessageSquare size={18} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Team chat</p>
                    <p className="text-xs text-slate-400 mt-1">Use the Chat page to communicate with your team.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickLinks />
        </div>
      </div>

      {/* Modules Overview */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
        <div className="flex items-center gap-3 mb-6">
          <Layers size={20} className="text-blue-400" />
          <h2 className="text-lg font-bold text-white">Modules</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ...(role === 'admin' || role === 'manager'
              ? [{ name: 'Users & Roles', count: 'Manage team', icon: Users, color: 'from-cyan-500 to-blue-600', path: '/app/users' }]
              : []),
            { name: 'Tasks', count: 'View & manage', icon: CheckSquare, color: 'from-emerald-500 to-teal-600', path: '/app/tasks' },
            { name: 'Chat', count: 'Team messaging', icon: MessageSquare, color: 'from-violet-500 to-purple-600', path: '/app/chat' },
            ...(role === 'admin'
              ? [{ name: 'AI Advisor', count: 'Insights & analysis', icon: Brain, color: 'from-amber-500 to-orange-600', path: '/app/ai' }]
              : []),
          ].map((mod, i) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.name}
                onClick={() => navigate(mod.path)}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all duration-200 text-left group"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${mod.color} shadow-lg`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-200">
                    {mod.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{mod.count}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
