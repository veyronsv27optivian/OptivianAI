import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, Home, Users, CheckSquare, Brain, MessageSquare,
  ChevronLeft, ChevronRight, Bell, Search, Settings,
  Sliders, History, Server, Building2, BarChart3, Clock,
  Target, Activity, Sun, Moon, Command, FileText,
  Globe, Cpu,
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { supabase } from '../services/supabase';
import {
  getUnreadCountAsync,
  markAllRead,
  getNotificationsAsync,
} from '../services/notificationService';
import { initTracker, addListener } from '../services/chatUnreadTracker';
import { useTheme } from '../services/ThemeContext';
import { useSessionTimeout } from '../services/useSessionTimeout';
import SessionTimeoutModal from '../components/ui/SessionTimeoutModal';
import CommandPalette from '../components/ui/CommandPalette';
import RecommendationsPanel from '../components/ui/RecommendationsPanel';

import { hasPermission } from '../services/auth/permissions';

function getNavItems(role) {
  const items = [
    { icon: Home, label: 'Dashboard', path: '/app', badge: null, requiredResource: 'dashboard' },
    { icon: Users, label: 'Users & Roles', path: '/app/users', badge: null, requiredResource: 'users' },
    { icon: CheckSquare, label: 'Tasks', path: '/app/tasks', badge: null, requiredResource: 'tasks' },
    { icon: MessageSquare, label: 'Chat', path: '/app/chat', badge: null, requiredResource: 'chat' },
    { icon: Building2, label: 'Organization', path: '/app/org', badge: null, requiredResource: 'organization', submenu: [
      { icon: Settings, label: 'Org Settings', path: '/app/org' },
      { icon: BarChart3, label: 'Analytics', path: '/app/org/analytics' },
      { icon: Target, label: 'Structure', path: '/app/org/structure' },
      { icon: Clock, label: 'Activity', path: '/app/org/activity' },
    ]},
    { icon: FileText, label: 'Files', path: '/app/files', badge: null, requiredResource: 'documents' },
    { icon: Brain, label: 'AI Platform', path: '/app/ai', badge: null, requiredResource: 'ai', submenu: [
      { icon: Settings, label: 'AI Settings', path: '/app/ai/settings' },
      { icon: History, label: 'History', path: '/app/ai/history' },
      { icon: Server, label: 'Providers', path: '/app/ai/providers' },
      { icon: Cpu, label: 'AI Manager', path: '/app/ai-manager' },
      { icon: Globe, label: 'Journey Map 3D', path: '/app/journey' },
    ]},
  ];
  
  // Filter items based on whether the user's role has 'view' access to the required resource
  return items.filter(item => {
    // If no specific resource is required, everyone sees it
    if (!item.requiredResource) return true;
    return hasPermission(role, item.requiredResource, 'view');
  });
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isDevMode } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Session timeout (Item 66)
  const { showWarning, resetTimer } = useSessionTimeout({
    timeoutMs: 30 * 60 * 1000,
    enabled: !!user && !isDevMode,
  });
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  const userRole = user?.user_metadata?.role || 'staff';
  const navItems = getNavItems(userRole);
  const [expandedNavItem, setExpandedNavItem] = useState(null);

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
    const isDev = !import.meta.env.VITE_SUPABASE_URL;
    if (isDev) return;
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
    // Poll every 30 seconds instead of 10 to reduce network requests
    const interval = setInterval(refreshNotifications, 30000);
    return () => {
      window.removeEventListener('notification-update', handler);
      clearInterval(interval);
    };
  }, [refreshNotifications]);

  // Command palette keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
    window.location.href = '/';
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

  const handleExtendSession = () => {
    resetTimer();
  };

  return (
    <div className="flex h-screen bg-background dark:bg-slate-900">
      {/* Command Palette */}
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* Session Timeout Warning (Item 66) */}
      {showWarning && (
        <SessionTimeoutModal onExtend={handleExtendSession} onLogout={handleLogout} />
      )}

      {/* Sidebar */}
      <div className={`relative flex flex-col transition-all duration-300 ease-out ${
        collapsed ? 'w-20' : 'w-64'
      } apple-sidebar z-10`}>
        {/* Logo */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-5 border-b border-slate-200/80 dark:border-white/5`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-premium flex items-center justify-center text-white text-xs font-bold shadow-premium">
                O
              </div>
              <h1 className="text-lg font-bold text-foreground dark:text-slate-100">
                Optivian<span className="gradient-text">AI</span>
              </h1>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 rounded-xl bg-gradient-premium flex items-center justify-center text-white text-sm font-bold shadow-premium">
              O
            </div>
          )}
          <button
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed(!collapsed)}                className="p-1.5 rounded-xl text-slate-500 dark:text-text-tertiary hover:text-slate-700 dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 active:scale-95"
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
              <div key={item.label}>
              <button
                onClick={() => {
                  if (item.submenu && !collapsed) {
                    // Navigate to the main page AND toggle the submenu
                    navigate(item.path);
                    setExpandedNavItem(expandedNavItem === item.label ? null : item.label);
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group nav-item-glow ${
                  isActive
                    ? 'bg-primary/15 dark:bg-primary/15 text-primary dark:text-primary-light shadow-glow-primary'
                    : 'text-slate-500 dark:text-text-secondary hover:text-slate-700 dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.03]'
                } active:scale-[0.97]`}
              >
                <Icon size={20} className={`shrink-0 ${isActive ? 'text-primary dark:text-primary-light' : 'text-slate-400 dark:text-text-tertiary group-hover:text-slate-700 dark:group-hover:text-text-primary'}`} />
                {!collapsed && (
                  <span className="text-sm">{item.label}</span>
                )}
                {item.label === 'Chat' && chatUnreadCount > 0 && (
                  <span className={`absolute ${collapsed ? 'top-0 right-0' : 'right-3'} min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-glow-primary`}>
                    {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                  </span>
                )}
              </button>
              {/* Submenu */}
              {item.submenu && !collapsed && expandedNavItem === item.label && (
                <div className="ml-8 mt-1 space-y-0.5">
                  {item.submenu.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = location.pathname === sub.path;
                    return (
                      <button
                        key={sub.label}
                        onClick={() => navigate(sub.path)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                          isSubActive
                            ? 'bg-primary/10 text-primary dark:text-primary-light font-medium'
                            : 'text-slate-500 dark:text-text-tertiary hover:text-slate-700 dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.03]'
                        }`}
                      >
                        <SubIcon size={14} />
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-slate-200/80 dark:border-white/5 space-y-1">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 dark:text-text-tertiary hover:text-slate-700 dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-all duration-200 ${collapsed ? 'justify-center' : ''} active:scale-[0.97]`}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={20} className="shrink-0" /> : <Moon size={20} className="shrink-0" />}
            {!collapsed && <span className="text-sm">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button
            onClick={() => navigate('/app/settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 dark:text-text-tertiary hover:text-slate-700 dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-all duration-200 ${collapsed ? 'justify-center' : ''} active:scale-[0.97]`}
          >
            <Settings size={20} className="shrink-0" />
            {!collapsed && <span className="text-sm">Settings</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 mt-1 ${collapsed ? 'justify-center' : ''} active:scale-[0.97]`}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="apple-header dark:apple-header flex items-center justify-between px-8 py-3">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md group">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search anything..."
                onClick={() => setCommandOpen(true)}
                readOnly
                className="w-full pl-10 pr-20 py-2 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700/70 font-mono text-[9px] text-slate-400 dark:text-slate-500">⌘K</kbd>
              </div>
            </div>
          </div>
          {/* Health & Recommendations (Phase C4) */}
          <RecommendationsPanel compact />

          <div className="flex items-center gap-3">
            <div className="relative" ref={bellRef}>
              <button
                aria-label="Notifications"
                onClick={handleBellClick}
                className={`relative p-2 rounded-xl transition-all duration-200 ${
                  showNotifications
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-400 dark:text-text-tertiary hover:text-slate-700 dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/5'
                } active:scale-[0.97]`}
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
                  className="dropdown-premium absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/5">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-text-primary">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => { if (user?.id) markAllRead(user.id); setNotifications([]); setUnreadCount(0); setShowNotifications(false); }}
                        className="text-xs text-primary-light hover:text-primary transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto max-h-80">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-400 dark:text-text-tertiary">
                        <Bell size={24} className="mx-auto mb-2 opacity-50 text-slate-400 dark:text-text-tertiary" />
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 20).map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-slate-100 dark:border-white/5 last:border-0 ${
                            !n.read ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              n.type === 'task_assigned' ? 'bg-emerald-900/30' : 'bg-primary/10'
                            }`}>
                              <CheckSquare size={14} className={n.type === 'task_assigned' ? 'text-emerald-400' : 'text-primary-light' } />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-slate-700 dark:text-text-primary leading-snug">{n.message}</p>
                              <p className="text-xs text-slate-400 dark:text-text-tertiary mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-transparent">
                      <button
                        onClick={() => navigate('/app/tasks')}
                        className="w-full text-xs text-slate-500 dark:text-text-tertiary hover:text-slate-700 dark:hover:text-text-primary text-center transition-colors"
                      >
                        View all tasks
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-white/5">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-8 h-8 rounded-xl object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-premium flex items-center justify-center text-white text-sm font-bold shadow-premium">
                  {userInitial}
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-text-primary">{displayName}</p>
                <p className="text-xs text-slate-500 dark:text-text-tertiary">{userEmail}</p>
                {isDevMode && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Dev Mode</span>
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