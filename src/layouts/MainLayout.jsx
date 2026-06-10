import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, Home, Users, CheckSquare, Brain, MessageSquare,
  ChevronLeft, ChevronRight, Bell, Search, Settings
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';

function getNavItems(role) {
  const items = [
    { icon: Home, label: 'Dashboard', path: '/app', badge: null, roles: ['admin', 'manager', 'staff'] },
    { icon: Users, label: 'Users & Roles', path: '/app/users', badge: null, roles: ['admin', 'manager'] },
    { icon: CheckSquare, label: 'Tasks', path: '/app/tasks', badge: null, roles: ['admin', 'manager', 'staff'] },
    { icon: MessageSquare, label: 'Chat', path: '/app/chat', badge: null, roles: ['admin', 'manager', 'staff'] },
    { icon: Brain, label: 'AI Advisor', path: '/app/ai', badge: null, roles: ['admin'] },
  ];
  return items.filter(item => item.roles.includes(role));
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isDevMode } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const userRole = user?.user_metadata?.role || 'staff';
  const navItems = getNavItems(userRole);

  const handleLogout = async () => {
    await signOut();
    navigate('/onboarding');
  };

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userInitial = (user?.email || 'User').charAt(0).toUpperCase();
  const userEmail = user?.email || '';

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <div className={`relative flex flex-col transition-all duration-300 ease-out ${
        collapsed ? 'w-20' : 'w-64'
      } bg-white/[0.03] backdrop-blur-xl border-r border-white/10`}>
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-5 border-b border-white/10`}>
          {!collapsed && (
            <h1 className="text-xl font-bold">
              <span className="text-white">Optivian</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">AI</span>
            </h1>
          )}
          {collapsed && (
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">O</span>
          )}
          <button
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-blue-400 to-indigo-500" />
                )}
                <div className="relative">
                  <Icon size={20} className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {item.badge && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center bg-rose-500 text-[10px] font-bold text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="ml-auto text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-medium">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-white/10">
          {/* Settings */}
          <button
            onClick={() => navigate('/app/settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          >
            <Settings size={20} />
            {!collapsed && <span className="font-medium text-sm">Settings</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 mt-1 ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} />
            {!collapsed && <span className="font-medium text-sm">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button aria-label="Notifications" className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/25">
                {userInitial}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">{displayName}</p>
                <p className="text-xs text-slate-500">{userEmail}</p>
                {isDevMode && (
                  <span className="text-[10px] text-amber-500 font-medium">Dev Mode</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
