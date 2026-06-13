import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, ShieldAlert, Target, TrendingUp, Users, CheckSquare,
  Activity, MessageSquare, BarChart3, Layers
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role || 'staff';
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        color: 'bg-blue-600',
      },
      {
        label: 'Open Tasks',
        value: '—',
        icon: CheckSquare,
        color: 'bg-emerald-600',
      },
    ];

    const adminManagerStats = [
      {
        label: 'Critical Risks',
        value: '—',
        icon: ShieldAlert,
        color: 'bg-red-600',
      },
      {
        label: 'AI Suggestions',
        value: '—',
        icon: Brain,
        color: 'bg-violet-600',
      },
    ];

    const allStats = role === 'admin' || role === 'manager'
      ? [...commonStats, ...adminManagerStats]
      : [...commonStats, {
          label: 'My Tasks',
          value: '—',
          icon: CheckSquare,
          color: 'bg-emerald-600',
        }];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {allStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white border border-slate-200 rounded-lg p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-0.5">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const QuickLinks = () => {
    const links = [
      ...(role === 'admin' || role === 'manager'
        ? [{ label: 'Manage Users', icon: Users, path: '/app/users', color: 'bg-blue-600' }]
        : []),
      { label: 'View Tasks', icon: CheckSquare, path: '/app/tasks', color: 'bg-emerald-600' },
      { label: 'Team Chat', icon: MessageSquare, path: '/app/chat', color: 'bg-violet-600' },
      ...(role === 'admin'
        ? [{ label: 'AI Advisor', icon: Brain, path: '/app/ai', color: 'bg-amber-600' }]
        : []),
    ];

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className={`p-2 rounded-lg ${link.color}`}>
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-xs font-medium text-slate-600">{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const WelcomeMessage = () => {
    const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    const subtitles = {
      admin: 'Manage your organization, review AI insights, and keep your team on track.',
      manager: 'Manage your team, assign tasks, and keep projects moving forward.',
      staff: 'Check your tasks, collaborate with your team, and stay up to date.',
    };

    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {name}</h1>
        <p className="text-slate-500 mt-1 text-sm">{subtitles[role] || subtitles.staff}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <WelcomeMessage />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
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
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">Getting Started</h2>
          </div>

          <div className="space-y-3">
            {role === 'admin' && (
              <>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Users size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Invite your team</p>
                    <p className="text-xs text-slate-500 mt-0.5">Add staff members from the Users & Roles page so they can join your workspace.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <CheckSquare size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Create tasks</p>
                    <p className="text-xs text-slate-500 mt-0.5">Assign tasks to your team members and track progress.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-violet-50 border border-violet-100">
                  <div className="p-2 rounded-lg bg-violet-100">
                    <Brain size={16} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Explore AI Advisor</p>
                    <p className="text-xs text-slate-500 mt-0.5">Get AI-powered insights and recommendations for your business.</p>
                  </div>
                </div>
              </>
            )}
            {role === 'manager' && (
              <>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <CheckSquare size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Manage tasks</p>
                    <p className="text-xs text-slate-500 mt-0.5">Assign and track tasks for your team members.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Users size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">View team</p>
                    <p className="text-xs text-slate-500 mt-0.5">See your team members and their roles.</p>
                  </div>
                </div>
              </>
            )}
            {role === 'staff' && (
              <>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <CheckSquare size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Your tasks</p>
                    <p className="text-xs text-slate-500 mt-0.5">Check the Tasks page to see what's been assigned to you.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-violet-50 border border-violet-100">
                  <div className="p-2 rounded-lg bg-violet-100">
                    <MessageSquare size={16} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Team chat</p>
                    <p className="text-xs text-slate-500 mt-0.5">Use the Chat page to communicate with your team.</p>
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
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-5">
          <Layers size={18} className="text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Modules</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ...(role === 'admin' || role === 'manager'
              ? [{ name: 'Users & Roles', count: 'Manage team', icon: Users, color: 'bg-blue-600', path: '/app/users' }]
              : []),
            { name: 'Tasks', count: 'View & manage', icon: CheckSquare, color: 'bg-emerald-600', path: '/app/tasks' },
            { name: 'Chat', count: 'Team messaging', icon: MessageSquare, color: 'bg-violet-600', path: '/app/chat' },
            ...(role === 'admin'
              ? [{ name: 'AI Advisor', count: 'Insights & analysis', icon: Brain, color: 'bg-amber-600', path: '/app/ai' }]
              : []),
          ].map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.name}
                onClick={() => navigate(mod.path)}
                className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-left"
              >
                <div className={`p-2.5 rounded-lg ${mod.color}`}>
                  <Icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{mod.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{mod.count}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
