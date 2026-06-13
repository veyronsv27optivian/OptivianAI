import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, Home, Users, CheckSquare, Brain, MessageSquare,
  ChevronLeft, ChevronRight, Bell, Search, Settings
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { supabase } from '../services/supabase';
import {
  getUnreadCountAsync,
  markAllRead,
  getNotificationsAsync,
} from '../services/notificationService';
import { initTracker, addListener, markAllConversationsRead } from '../services/chatUnreadTracker';

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  const userRole = user?.user_metadata?.role || 'staff';
  const navItems = getNavItems(userRole);

  // Init chat unread tracker (survives tab switches)
  useEffect(() => {
    if (!user) return;
    let cleanup;
    (async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (profile) {
        cleanup = initTracker(user.id, profile.id);
        const removeListener = addListener((_counts, total) => {
          setChatUnreadCount(total);
        });
        // Wrap both cleanups
        const origCleanup = cleanup;
        cleanup = () => { origCleanup?.(); removeListener(); };
      }
    })();
    return () => { cleanup?.(); };
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;
    const count = await getUnreadCountAsync(user.id);
    setUnreadCount(count);
  }, [user?.id]);

  useEffect(() => {
    refreshNotifications();
    const handler = () => refreshNotifications();
    window.addEventListener('notification-update', handler);
    const interval = setInterval(refreshNotifications, 10000);
    return () => {
      window.removeEventListener('notification-update', handler);
      clearInterval(interval);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClick = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifications]);

  const handleBellClick = async () => {
    if (showNotifications) {
      setShowNotifications(false);
      return;
    }
    setShowNotifications(true);
    if (user?.id) {
      const items = await getNotificationsAsync(user.id);
      setNotifications(items);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/onboarding');
  };

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const userInitial = (user?.email || 'User').charAt(0).toUpperCase();
  const userEmail = user?.email || '';

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className={`relative flex flex-col transition-all duration-300 ease-out ${
        collapsed ? 'w-20' : 'w-64'
      } bg-white border-r border-slate-200`}>
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-5 border-b border-slate-200`}>
          {!collapsed && (
            <h1 className="text-xl font-bold text-slate-900">
              Optivian<span className="text-blue-600">AI</span>
            </h1>
          )}
          {collapsed && (
            <span className="text-xl font-bold text-blue-600">O</span>
          )}
          <button
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
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
                className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={20} className={`shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {!collapsed && (
                  <span className="text-sm">{item.label}</span>
                )}
                {item.label === 'Chat' && chatUnreadCount > 0 && (
                  <span className={`absolute ${collapsed ? 'top-0 right-0' : 'right-3'} min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center`}>
                    {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => navigate('/app/settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          >
            <Settings size={20} className="shrink-0 text-slate-400" />
            {!collapsed && <span className="text-sm">Settings</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 mt-1 ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={bellRef}>
              <button
                aria-label="Notifications"
                onClick={handleBellClick}
                className={`relative p-2 rounded-lg transition-all duration-200 ${
                  showNotifications
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-[9px] font-bold text-white rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => { if (user?.id) markAllRead(user.id); setNotifications([]); setUnreadCount(0); setShowNotifications(false); }}
                        className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto max-h-80">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-400">
                        <Bell size={24} className="mx-auto mb-2 text-slate-300" />
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 20).map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-slate-100 last:border-0 ${
                            !n.read ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              n.type === 'task_assigned' ? 'bg-emerald-100' : 'bg-blue-100'
                            }`}>
                              <CheckSquare size={14} className={n.type === 'task_assigned' ? 'text-emerald-600' : 'text-blue-600'} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                              <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50">
                      <button
                        onClick={() => navigate('/app/tasks')}
                        className="w-full text-xs text-slate-500 hover:text-slate-700 text-center transition-colors"
                      >
                        View all tasks
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {userInitial}
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">{displayName}</p>
                <p className="text-xs text-slate-500">{userEmail}</p>
                {isDevMode && (
                  <span className="text-[10px] text-amber-600 font-medium">Dev Mode</span>
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
