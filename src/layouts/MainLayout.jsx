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
import { initTracker, addListener } from '../services/chatUnreadTracker';

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

  // Compute initial unread count from localStorage
  function computeLocalUnread() {
    const isDev = !import.meta.env.VITE_SUPABASE_URL;
    if (!isDev) return 0;
    try {
      const timestamps = JSON.parse(localStorage.getItem(`optivian_lastRead_${user?.id}`) || '{}');
      const conversations = JSON.parse(localStorage.getItem('optivian_dev_conversations') || '[]');
      const profiles = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
      const myProfile = profiles.find(p => p.user_id === user?.id);
      if (!myProfile) return 0;

      let unread = 0;
      for (const conv of conversations) {
        const parts = JSON.parse(localStorage.getItem(`optivian_dev_conversations_participants_${conv.id}`) || '[]');
        if (!parts.includes(myProfile.id)) continue;
        const messages = JSON.parse(localStorage.getItem(`optivian_dev_messages_${conv.id}`) || '[]');
        const lastMsg = messages[messages.length - 1];
        if (!lastMsg) continue;
        if (lastMsg.sender_id === myProfile.id) continue;
        const readTime = timestamps[conv.id] ? new Date(timestamps[conv.id]).getTime() : 0;
        if (new Date(lastMsg.created_at).getTime() > readTime) unread++;
      }
      return unread;
    } catch { return 0; }
  }

  // Init chat unread tracker (Survives tab switches in Supabase mode)
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
      }
    })();
    // Listen for Chat's unread-update DOM event (carries the count in detail)
    const removeListener = addListener((e) => {
      setChatUnreadCount(typeof e?.detail === 'number' ? e.detail : computeLocalUnread());
    });
    // Set initial count from localStorage
    setChatUnreadCount(computeLocalUnread());
    return () => { cleanup?.(); removeListener(); };
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

  // Presence heartbeat – update last_seen every 60s
  useEffect(() => {
    if (!user?.id) return;
    const isDev = !import.meta.env.VITE_SUPABASE_URL;

    const touch = async () => {
      if (isDev) {
        const profiles = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
        const idx = profiles.findIndex(p => p.user_id === user.id);
        if (idx !== -1) {
          profiles[idx].last_seen = new Date().toISOString();
          localStorage.setItem('optivian_dev_profiles', JSON.stringify(profiles));
        }
      } else {
        await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('user_id', user.id);
      }
    };
    touch();
    const hb = setInterval(touch, 60000);
    return () => clearInterval(hb);
  }, [user?.id]);

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

  const displayName = user?.user_metadata?.name || (user?.email?.split('@')?.[0]) || 'User';
  const avatarUrl = (() => {
    const url = user?.user_metadata?.avatar_url;
    if (!url) return '';
    try { const p = new URL(url); return p.protocol === 'javascript:' ? '' : p.href; }
    catch { return ''; }
  })();
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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`relative flex flex-col transition-all duration-300 ease-out ${
        collapsed ? 'w-20' : 'w-64'
      } bg-white border-r border-border`}>
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-5 border-b border-border`}>
          {!collapsed && (
            <h1 className="text-xl font-bold text-foreground">
              Optivian<span className="text-primary">AI</span>
            </h1>
          )}
          {collapsed && (
            <span className="text-xl font-bold text-primary">O</span>
          )}
          <button
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 active:scale-95"
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
                    ? 'bg-primary text-on-primary'
                    : 'text-foreground hover:text-primary hover:bg-background'
                } active:scale-95`}
              >
                <Icon size={20} className={`shrink-0 ${isActive ? 'text-on-primary' : 'text-slate-400 group-hover:text-primary'}`} />
                {!collapsed && (
                  <span className="text-sm">{item.label}</span>
                )}
                {item.label === 'Chat' && chatUnreadCount > 0 && (
                  <span className={`absolute ${collapsed ? 'top-0 right-0' : 'right-3'} min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center`}>
                    {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => navigate('/app/settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-foreground hover:text-primary hover:bg-background transition-all duration-200 ${collapsed ? 'justify-center' : ''} active:scale-95`}
          >
            <Settings size={20} className="shrink-0 text-slate-400" />
            {!collapsed && <span className="text-sm">Settings</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-destructive hover:text-destructive/80 hover:bg-red-50 transition-all duration-200 mt-1 ${collapsed ? 'justify-center' : ''} active:scale-95`}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-3 border-b border-border bg-white">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
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
                    ? 'bg-primary text-on-primary'
                    : 'text-slate-400 hover:text-primary hover:bg-background'
                } active:scale-95`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-destructive text-[9px] font-bold text-white rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white border border-border rounded-lg shadow-lg overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => { if (user?.id) markAllRead(user.id); setNotifications([]); setUnreadCount(0); setShowNotifications(false); }}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
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
                          className={`px-4 py-3 border-b border-border last:border-0 ${
                            !n.read ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-background'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              n.type === 'task_assigned' ? 'bg-emerald-100' : 'bg-primary/10'
                            }`}>
                              <CheckSquare size={14} className={n.type === 'task_assigned' ? 'text-emerald-600' : 'text-primary' } />
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
                    <div className="px-4 py-2.5 border-t border-border bg-slate-50">
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

            <div className="flex items-center gap-3 pl-3 border-l border-border">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-bold">
                  {userInitial}
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
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