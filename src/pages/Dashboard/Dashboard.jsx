import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ChevronDown, RefreshCw, Maximize2, Minimize2,
  AlertCircle, X, Info, AlertTriangle, CheckCircle, Settings2,
  Users, Briefcase, Sparkles,
  Activity, BarChart3, Crown,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { getTasks } from '../../services/taskService';
import { getAnalytics, getAvailableProviders, getActiveProviderName } from '../../services/ai';
import { getUnreadCountAsync, getNotificationsAsync, markAllRead } from '../../services/notificationService';
import { supabase } from '../../services/supabase';
import { getRoleInfo } from '../../services/auth/roles';
import DashboardSkeleton, { SectionSkeleton } from './Skeleton';

import ScrollReveal from '../../components/ui/ScrollReveal';
import { getAnnouncements, dismissAnnouncement } from '../../services/announcementService';
import DashboardCustomizer, { loadWidgetConfig } from './DashboardCustomizer';
import SetupChecklist from '../../components/ui/SetupChecklist';

// Lazy load sub-components
const ExecutiveStats = lazy(() => import('./ExecutiveStats'));
const AdvancedAnalytics = lazy(() => import('./AdvancedAnalytics'));
const AIPanel = lazy(() => import('./AIPanel'));
const OrgOverview = lazy(() => import('./OrgOverview'));
const StaffOverview = lazy(() => import('./StaffOverview'));
const TaskCenter = lazy(() => import('./TaskCenter'));
const NotificationCenter = lazy(() => import('./NotificationCenter'));
const AIDashboard = lazy(() => import('./AIDashboard'));
const QuickActions = lazy(() => import('./QuickActions'));
const CalendarWidget = lazy(() => import('./CalendarWidget'));

// ─── Premium Section Component ──────────────────────────────
function Section({ id, title, subtitle, icon: Icon, children, defaultExpanded = true, className = '', accent = 'blue' }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const accentBorders = {
    blue: 'hover:border-blue-500/20',
    purple: 'hover:border-violet-500/20',
    emerald: 'hover:border-emerald-500/20',
    amber: 'hover:border-amber-500/20',
    cyan: 'hover:border-cyan-500/20',
  };
  return (
    <ScrollReveal variant="fade-up" className={className}>
      <div className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 transition-all duration-300 ${accentBorders[accent] || accentBorders.blue}`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group"
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/50 group-hover:bg-slate-200 dark:group-hover:bg-slate-700/80 transition-colors border border-slate-200 dark:border-slate-600/50">
                <Icon size={16} className="text-slate-500 dark:text-slate-400" />
              </div>
            )}
            <div className="text-left">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
              {subtitle && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} className="text-slate-400 dark:text-slate-500" />
          </motion.div>
        </button>
        <motion.div
          initial={false}
          animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="px-5 pb-5">{children}</div>
        </motion.div>
      </div>
    </ScrollReveal>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const orgId = user?.user_metadata?.organization_id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [aiAnalytics, setAiAnalytics] = useState(null);
  const [providers, setProviders] = useState([]);
  const [activeProviderName, setActiveProviderName] = useState('');
  const [staffCount, setStaffCount] = useState(0);
  const [onlineStaff, setOnlineStaff] = useState(0);
  const [recentMembers, setRecentMembers] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fullscreen, setFullscreen] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState(() => loadWidgetConfig());

  // Check if this is a new org
  const [isNewOrg, setIsNewOrg] = useState(() => {
    return !localStorage.getItem('optivian_setup_dismissed');
  });

  // ── Role-based dashboard config ───────────────────────────
  const userRole = user?.user_metadata?.role || 'staff';
  const roleInfo = useMemo(() => getRoleInfo(userRole), [userRole]);

  const dashboardConfig = useMemo(() => {
    const isAdmin = ['super_admin', 'owner', 'administrator'].includes(userRole);
    const isExecutive = ['executive', 'director', 'manager'].includes(userRole) || isAdmin;
    const isStaff = ['staff', 'intern', 'support'].includes(userRole);

    if (isExecutive || isAdmin) {
      return {
        title: `${roleInfo.label} Dashboard`,
        icon: Crown,
        showExecutiveStats: true,
        showAdvancedAnalytics: true,
        showOrgOverview: true,
        showStaffOverview: true,
        showTaskCenter: true,
        showCalendar: true,
        showNotifications: true,
        showAIDashboard: true,
        showAIPanel: true,
        showQuickActions: true,
      };
    }
    if (isStaff) {
      return {
        title: `${roleInfo.label} Dashboard`,
        icon: Users,
        showExecutiveStats: true,
        showAdvancedAnalytics: false,
        showOrgOverview: true,
        showStaffOverview: false,
        showTaskCenter: true,
        showCalendar: true,
        showNotifications: true,
        showAIDashboard: true,
        showAIPanel: false,
        showQuickActions: true,
      };
    }
    return {
      title: `${roleInfo.label} Dashboard`,
      icon: Briefcase,
      showExecutiveStats: true,
      showAdvancedAnalytics: false,
      showOrgOverview: true,
      showStaffOverview: false,
      showTaskCenter: true,
      showCalendar: true,
      showNotifications: true,
      showAIDashboard: true,
      showAIPanel: true,
      showQuickActions: true,
    };
  }, [userRole, roleInfo]);

  const DashboardIcon = dashboardConfig.icon;

  // ── Clock ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const withTimeout = useCallback((promise, ms = 8000) => {
    return Promise.race([promise, new Promise(resolve => setTimeout(() => resolve(null), ms))]);
  }, []);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const safetyTimer = setTimeout(() => { setLoading(false); setRefreshing(false); }, 12000);

    try {
      const [fetchedTasks, agg, provs, activeProv] = await Promise.all([
        withTimeout(getTasks(user).catch(() => []), 6000),
        withTimeout(getAnalytics({}).catch(() => null), 6000),
        withTimeout(Promise.resolve(getAvailableProviders()).catch(() => []), 3000),
        withTimeout(Promise.resolve(getActiveProviderName()).catch(() => ''), 3000),
      ]);

      setTasks((fetchedTasks && Array.isArray(fetchedTasks)) ? fetchedTasks : []);
      setAiAnalytics(agg || null);
      setProviders(Array.isArray(provs) ? provs : []);
      setActiveProviderName(typeof activeProv === 'string' ? activeProv : '');

      if (user?.id) {
        const [count, items] = await Promise.all([
          withTimeout(getUnreadCountAsync(user.id).catch(() => 0), 4000),
          withTimeout(getNotificationsAsync(user.id).catch(() => []), 4000),
        ]);
        setUnreadCount(typeof count === 'number' ? count : 0);
        setNotifications(Array.isArray(items) ? items : []);
      }

      const isDev = !import.meta.env.VITE_SUPABASE_URL;
      if (isDev) {
        const stored = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
        setStaffCount(stored.length);
        setOnlineStaff(stored.filter(p => Date.now() - (p.last_seen ? new Date(p.last_seen).getTime() : 0) < 300000).length);
        setRecentMembers(stored.slice(-5).reverse());
      } else if (orgId) {
        const [totalResult, onlineResult, membersResult] = await Promise.all([
          withTimeout(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('organization_id', orgId), 5000),
          withTimeout(supabase.from('profiles').select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('last_seen', new Date(Date.now() - 300000).toISOString()), 5000),
          withTimeout(supabase.from('profiles').select('*').eq('organization_id', orgId)
            .order('created_at', { ascending: false }).limit(5), 5000),
        ]);
        setStaffCount(totalResult?.count || 0);
        setOnlineStaff(onlineResult?.count || 0);
        setRecentMembers(Array.isArray(membersResult?.data) ? membersResult.data : []);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setFetchError('Some data failed to load. Refreshing automatically...');
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, orgId, withTimeout]);

  useEffect(() => {
    getAnnouncements(user?.id).then(setAnnouncements);
  }, [user?.id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (!orgId || !import.meta.env.VITE_SUPABASE_URL) return;
    const taskChannel = supabase.channel('dashboard-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `organization_id=eq.${orgId}` }, () => fetchData(true))
      .subscribe();
    const notifChannel = supabase.channel('dashboard-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` },
        (payload) => { setNotifications(prev => [payload.new, ...prev].slice(0, 20)); setUnreadCount(prev => prev + 1); }
      ).subscribe();
    return () => { supabase.removeChannel(taskChannel); supabase.removeChannel(notifChannel); };
  }, [orgId, user?.id, fetchData]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress').length;
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done' && t.status !== 'completed').length;
    const urgent = tasks.filter(t => t.priority === 'urgent').length;
    const high = tasks.filter(t => t.priority === 'high').length;
    const medium = tasks.filter(t => t.priority === 'medium').length;
    const low = tasks.filter(t => t.priority === 'low').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, inProgress, overdue, urgent, high, medium, low, completionRate };
  }, [tasks]);

  const taskPriorityData = useMemo(() => {
    const items = [
      { name: 'Urgent', value: taskStats.urgent, color: '#ef4444' },
      { name: 'High', value: taskStats.high, color: '#f97316' },
      { name: 'Medium', value: taskStats.medium, color: '#f59e0b' },
      { name: 'Low', value: taskStats.low, color: '#10b981' },
    ].filter(d => d.value > 0);
    return items.length > 0 ? items : [{ name: 'No tasks', value: 1, color: 'rgba(255,255,255,0.1)' }];
  }, [taskStats]);

  const taskStatusData = useMemo(() => [
    { name: 'Pending', value: taskStats.pending, color: '#94a3b8' },
    { name: 'In Progress', value: taskStats.inProgress, color: '#6366F1' },
    { name: 'Completed', value: taskStats.completed, color: '#10b981' },
    { name: 'Overdue', value: taskStats.overdue, color: '#ef4444' },
  ].filter(d => d.value > 0), [taskStats]);

  const upcomingDeadlines = useMemo(() =>
    tasks.filter(t => t.due_date && t.status !== 'done' && t.status !== 'completed')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 10), [tasks]);

  const providerUsageData = useMemo(() =>
    providers.map(p => ({ name: p.label || p.name, value: p.isActive ? 1 : 0, color: p.isActive ? '#6366F1' : 'rgba(255,255,255,0.2)' })), [providers]);

  const handleMarkAllRead = useCallback(() => {
    if (user?.id) { markAllRead(user.id); setNotifications([]); setUnreadCount(0); }
  }, [user?.id]);

  const handleDismissAnnouncement = (id) => {
    dismissAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`space-y-6 transition-all duration-300 ${fullscreen ? 'max-w-7xl mx-auto' : ''}`}
    >
      {/* ═══ SECTION 1: HERO OVERVIEW ═══ */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/5 bg-gradient-to-br from-violet-600 via-blue-600 to-slate-900 dark:from-violet-600/20 dark:via-blue-600/10 dark:to-slate-900/80 backdrop-blur-xl p-6 sm:p-8">
        {/* Abstract background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/20">
              <DashboardIcon size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white dark:text-white font-display tracking-tight">{dashboardConfig.title}</h1>
                <span className="px-2 py-0.5 rounded-full bg-white/20 dark:bg-white/10 text-white text-[10px] font-medium">
                  {user?.user_metadata?.role || 'Executive'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-white/70 dark:text-white/40">
                  {user?.user_metadata?.organization_name || 'Organization'}
                </p>
                <span className="text-white/40 dark:text-white/20">·</span>
                <p className="text-sm text-white/70 dark:text-white/50">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <span className="text-white/40 dark:text-white/20">·</span>
                <p className="text-sm text-white/70 dark:text-white/50">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Quick actions toolbar */}
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowCustomizer(true)}
              className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Customize Dashboard">
              <Settings2 size={16} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setFullscreen(!fullscreen)}
              className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => fetchData(true)}
              className={`p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${refreshing ? 'animate-spin' : ''}`}
              title="Refresh">
              <RefreshCw size={16} />
            </motion.button>
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200 dark:border-slate-700/50">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {onlineStaff} online
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/70 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 text-xs font-medium">
                {staffCount} staff
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ QUICK ACTIONS BAR ═══ */}
      {dashboardConfig.showQuickActions && widgetConfig.find(w => w.id === 'quick-actions')?.visible !== false && (
        <Suspense fallback={<SectionSkeleton height={80} />}>
          <QuickActions />
        </Suspense>
      )}

      {/* Announcements */}
      {announcements.map((announcement) => {
        const style = {
          info: { bg: 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 text-blue-700 dark:text-blue-300', icon: Info },
          warning: { bg: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 text-amber-700 dark:text-amber-300', icon: AlertTriangle },
          success: { bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300', icon: CheckCircle },
          alert: { bg: 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20 text-red-700 dark:text-red-300', icon: AlertCircle },
        }[announcement.type] || { bg: 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 text-blue-700 dark:text-blue-300', icon: Info };
        const Icon = style.icon;
        return (
          <div key={announcement.id} className={`flex items-start gap-3 px-5 py-4 rounded-2xl border backdrop-blur-sm ${style.bg}`}>
            <Icon size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold">{announcement.title}</h4>
              <p className="text-xs mt-0.5 opacity-80">{announcement.message}</p>
            </div>
            <button onClick={() => handleDismissAnnouncement(announcement.id)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-all shrink-0">
              <X size={14} />
            </button>
          </div>
        );
      })}

      {/* Fetch error */}
      {fetchError && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 text-sm text-amber-700 dark:text-amber-300 backdrop-blur-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{fetchError}</span>
          <button onClick={() => setFetchError(null)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Setup Checklist */}
      {isNewOrg && <SetupChecklist onClose={() => setIsNewOrg(false)} />}

      {/* ═══ SECTION 2: KPI SECTION (Executive Stats) ═══ */}
      {dashboardConfig.showExecutiveStats && widgetConfig.find(w => w.id === 'executive-stats')?.visible !== false && (
        <Suspense fallback={<SectionSkeleton height={380} />}>
          <ExecutiveStats staffCount={staffCount} onlineStaff={onlineStaff} taskStats={taskStats}
            aiAnalytics={aiAnalytics} unreadCount={unreadCount} loading={loading} />
        </Suspense>
      )}

      {/* ═══ SECTION 3: ANALYTICS SECTION ═══ */}
      {dashboardConfig.showAdvancedAnalytics && widgetConfig.find(w => w.id === 'advanced-analytics')?.visible !== false && (
        <Suspense fallback={<SectionSkeleton height={500} />}>
          <Section id="analytics" title="Advanced Analytics" subtitle="Interactive charts & metrics" icon={BarChart3} accent="purple">
            <AdvancedAnalytics taskStats={taskStats} taskPriorityData={taskPriorityData}
              taskStatusData={taskStatusData} providerUsageData={providerUsageData}
              aiAnalytics={aiAnalytics} staffCount={staffCount} loading={loading} />
          </Section>
        </Suspense>
      )}

      {/* ═══ SECTIONS 4-6: 3-COLUMN (Productivity, Team, Events) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-5">
          {/* Org Overview */}
          {dashboardConfig.showOrgOverview && widgetConfig.find(w => w.id === 'org-overview')?.visible !== false && (
            <Suspense fallback={<SectionSkeleton height={300} />}>
              <OrgOverview staffCount={staffCount} onlineStaff={onlineStaff} loading={loading} recentMembers={recentMembers} />
            </Suspense>
          )}
          {/* Staff Overview */}
          {dashboardConfig.showStaffOverview && widgetConfig.find(w => w.id === 'staff-overview')?.visible !== false && (
            <Suspense fallback={<SectionSkeleton height={300} />}>
              <StaffOverview staffCount={staffCount} onlineStaff={onlineStaff} loading={loading} />
            </Suspense>
          )}
        </div>
        <div className="space-y-5">
          {/* Task Center */}
          {dashboardConfig.showTaskCenter && widgetConfig.find(w => w.id === 'task-center')?.visible !== false && (
            <Suspense fallback={<SectionSkeleton height={300} />}>
              <TaskCenter taskStats={taskStats} upcomingDeadlines={upcomingDeadlines} loading={loading} />
            </Suspense>
          )}
          {/* Calendar */}
          {dashboardConfig.showCalendar && widgetConfig.find(w => w.id === 'calendar')?.visible !== false && (
            <Suspense fallback={<SectionSkeleton height={300} />}>
              <CalendarWidget upcomingDeadlines={upcomingDeadlines} loading={loading} />
            </Suspense>
          )}
        </div>
        <div className="space-y-5">
          {/* Notifications */}
          {dashboardConfig.showNotifications && widgetConfig.find(w => w.id === 'notifications')?.visible !== false && (
            <Suspense fallback={<SectionSkeleton height={300} />}>
              <NotificationCenter notifications={notifications} unreadCount={unreadCount}
                onMarkAllRead={handleMarkAllRead} loading={loading} />
            </Suspense>
          )}
          {/* AI Dashboard */}
          {dashboardConfig.showAIDashboard && widgetConfig.find(w => w.id === 'ai-dashboard')?.visible !== false && (
            <Suspense fallback={<SectionSkeleton height={300} />}>
              <AIDashboard aiAnalytics={aiAnalytics} taskStats={taskStats} loading={loading} />
            </Suspense>
          )}
        </div>
      </div>

      {/* ═══ SECTION 7: AI EXECUTIVE ADVISOR ═══ */}
      {dashboardConfig.showAIPanel && widgetConfig.find(w => w.id === 'ai-panel')?.visible !== false && (
        <Suspense fallback={<SectionSkeleton height={300} />}>
          <Section id="ai-insights" title="AI Executive Advisor" subtitle="Strategic insights & recommendations" icon={Sparkles} accent="purple">
            <AIPanel aiAnalytics={aiAnalytics} taskStats={taskStats}
              staffCount={staffCount} onlineStaff={onlineStaff} loading={loading} />
          </Section>
        </Suspense>
      )}



      {/* Dashboard Customizer */}
      {showCustomizer && (
        <DashboardCustomizer onClose={() => { setShowCustomizer(false); setWidgetConfig(loadWidgetConfig()); }} />
      )}

      {/* Footer */}
      <ScrollReveal variant="fade-up">
        <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              {refreshing ? 'Refreshing...' : 'Live'}
            </span>
            <span>{tasks.length} tasks</span>
            <span>{notifications.length} notifications</span>
            {aiAnalytics?.total > 0 && <span>{aiAnalytics.total} AI analyses</span>}
          </div>
          <div className="flex items-center gap-2">
            {activeProviderName && (
              <span className="flex items-center gap-1">
                <Activity size={10} /> {activeProviderName}
              </span>
            )}
            <span>Updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </ScrollReveal>
    </motion.div>
  );
}
