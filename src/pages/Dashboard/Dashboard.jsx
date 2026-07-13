import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ChevronDown, RefreshCw, Maximize2, Minimize2,
  AlertCircle, X,  Info, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { getTasks } from '../../services/taskService';
import { getAnalytics, getAvailableProviders, getActiveProviderName } from '../../services/ai';
import { getUnreadCountAsync, getNotificationsAsync, markAllRead } from '../../services/notificationService';
import { supabase } from '../../services/supabase';
import DashboardSkeleton, { SectionSkeleton } from './Skeleton';
import Badge from '../../components/ui/Badge';
import ScrollReveal from '../../components/ui/ScrollReveal';
import { getAnnouncements, dismissAnnouncement } from '../../services/announcementService';

// Lazy load heavy sub-components for performance
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function Section({ id, title, subtitle, icon: Icon, children, defaultExpanded = true, className = '' }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <ScrollReveal variant="fade-up" className={className}>
      <div className="rounded-xl border border-border dark:border-slate-700/50 bg-white dark:bg-slate-800/90 overflow-hidden transition-colors duration-300">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 group-hover:bg-slate-200 dark:group-hover:bg-slate-600/50 transition-colors">
                <Icon size={16} className="text-slate-600 dark:text-slate-400" />
              </div>
            )}
            <div className="text-left">
              <h2 className="text-sm font-semibold text-foreground dark:text-slate-100">{title}</h2>
              {subtitle && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} className="text-slate-400" />
          </motion.div>
        </button>
        <motion.div
          initial={false}
          animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-4">{children}</div>
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

  // Load announcements (Item 58)
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
    return items.length > 0 ? items : [{ name: 'No tasks', value: 1, color: '#e2e8f0' }];
  }, [taskStats]);

  const taskStatusData = useMemo(() => [
    { name: 'Pending', value: taskStats.pending, color: '#94a3b8' },
    { name: 'In Progress', value: taskStats.inProgress, color: '#3b82f6' },
    { name: 'Completed', value: taskStats.completed, color: '#10b981' },
    { name: 'Overdue', value: taskStats.overdue, color: '#ef4444' },
  ].filter(d => d.value > 0), [taskStats]);

  const upcomingDeadlines = useMemo(() =>
    tasks.filter(t => t.due_date && t.status !== 'done' && t.status !== 'completed')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 10), [tasks]);

  const providerUsageData = useMemo(() =>
    providers.map(p => ({ name: p.label || p.name, value: p.isActive ? 1 : 0, color: p.isActive ? '#3b82f6' : '#94a3b8' })), [providers]);

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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-5 transition-all duration-300 ${fullscreen ? 'max-w-7xl mx-auto' : ''}`}
    >
      {/* Announcements banner (Item 58) */}
      {announcements.map((announcement) => {
        const announcementStyles = {
          info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', icon: Info },
          warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', icon: AlertTriangle },
          success: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle },
          alert: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300', icon: AlertCircle },
        };
        const style = announcementStyles[announcement.type] || announcementStyles.info;
        const Icon = style.icon;
        return (
          <div key={announcement.id} className={`flex items-start gap-3 px-5 py-4 rounded-xl border ${style.bg} ${style.border}`}>
            <div className={`p-1.5 rounded-lg ${style.bg} ${style.text} shrink-0`}>
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${style.text}`}>{announcement.title}</p>
              <p className={`text-xs mt-0.5 ${style.text} opacity-80`}>{announcement.message}</p>
            </div>
            <button
              onClick={() => handleDismissAnnouncement(announcement.id)}
              className={`p-1 rounded hover:bg-white/50 dark:hover:bg-black/20 transition-all ${style.text} shrink-0`}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}

      {/* Fetch error banner */}
      {fetchError && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{fetchError}</span>
          <button onClick={() => setFetchError(null)} className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <ScrollReveal variant="fade-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-premium shadow-premium">
                <LayoutDashboard size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground dark:text-slate-100">CEO Dashboard</h1>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  {' \u00b7 '}
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setFullscreen(!fullscreen)}
              className="p-2 rounded-xl border border-border dark:border-slate-700/50 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => fetchData(true)}
              className={`p-2 rounded-xl border border-border dark:border-slate-700/50 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all ${refreshing ? 'animate-spin' : ''}`}
              title="Refresh">
              <RefreshCw size={16} />
            </motion.button>
            <Badge color="emerald" dot pulse size="md">{onlineStaff} online</Badge>
            <Badge color="slate" size="md">{staffCount} staff</Badge>
          </div>
        </div>
      </ScrollReveal>

      {/* Executive Statistics */}
      <Suspense fallback={<SectionSkeleton height={380} />}>
        <ExecutiveStats staffCount={staffCount} onlineStaff={onlineStaff} taskStats={taskStats}
          aiAnalytics={aiAnalytics} unreadCount={unreadCount} loading={loading} />
      </Suspense>

      {/* Advanced Analytics */}
      <Suspense fallback={<SectionSkeleton height={500} />}>
        <Section id="analytics" title="Advanced Analytics" subtitle="Interactive charts & metrics" icon={LayoutDashboard}>
          <AdvancedAnalytics taskStats={taskStats} taskPriorityData={taskPriorityData}
            taskStatusData={taskStatusData} providerUsageData={providerUsageData}
            aiAnalytics={aiAnalytics} staffCount={staffCount} loading={loading} />
        </Section>
      </Suspense>

      {/* 3-Column Middle Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-5 lg:col-span-1">
          <Suspense fallback={<SectionSkeleton height={300} />}>
            <OrgOverview staffCount={staffCount} onlineStaff={onlineStaff} loading={loading} recentMembers={recentMembers} />
          </Suspense>
          <Suspense fallback={<SectionSkeleton height={300} />}>
            <StaffOverview staffCount={staffCount} onlineStaff={onlineStaff} loading={loading} />
          </Suspense>
        </div>
        <div className="space-y-5 lg:col-span-1">
          <Suspense fallback={<SectionSkeleton height={300} />}>
            <TaskCenter taskStats={taskStats} upcomingDeadlines={upcomingDeadlines} loading={loading} />
          </Suspense>
          <Suspense fallback={<SectionSkeleton height={300} />}>
            <CalendarWidget upcomingDeadlines={upcomingDeadlines} />
          </Suspense>
        </div>
        <div className="space-y-5 lg:col-span-1">
          <Suspense fallback={<SectionSkeleton height={300} />}>
            <NotificationCenter notifications={notifications} unreadCount={unreadCount}
              onMarkAllRead={handleMarkAllRead} loading={loading} />
          </Suspense>
          <Suspense fallback={<SectionSkeleton height={300} />}>
            <AIDashboard aiAnalytics={aiAnalytics} providers={providers}
              activeProviderName={activeProviderName} loading={loading} />
          </Suspense>
        </div>
      </motion.div>

      {/* AI Insights Panel */}
      <Suspense fallback={<SectionSkeleton height={300} />}>
        <Section id="ai-insights" title="AI Insights Panel" subtitle="Live AI health & recommendations" icon={LayoutDashboard}>
          <AIPanel aiAnalytics={aiAnalytics} providers={providers}
            activeProviderName={activeProviderName} loading={loading} />
        </Section>
      </Suspense>

      {/* Quick Actions */}
      <Suspense fallback={<SectionSkeleton height={250} />}>
        <Section id="quick-actions" title="Quick Actions" subtitle="Frequently used tools" defaultExpanded={true}>
          <QuickActions />
        </Section>
      </Suspense>

      {/* Footer Data Status */}
      <ScrollReveal variant="fade-up">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border dark:border-slate-700/50 text-[10px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              {refreshing ? 'Refreshing...' : 'Live'}
            </span>
            <span>{tasks.length} tasks</span>
            <span>{notifications.length} notifications</span>
            {aiAnalytics?.total > 0 && <span>{aiAnalytics.total} AI requests</span>}
          </div>
          <span>Updated {new Date().toLocaleTimeString()}</span>
        </div>
      </ScrollReveal>
    </motion.div>
  );
}
