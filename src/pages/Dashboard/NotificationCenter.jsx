import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckSquare, AlertCircle, Shield, AlertTriangle,
  MessageSquare, UserPlus, FileText, Brain, Building2,
  CheckCheck, ArrowRight,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function NotificationCenter({
  notifications = [],
  unreadCount,
  onMarkAllRead,
  loading,
}) {
  const navigate = useNavigate();

  const byType = useMemo(() => {
    const groups = {};
    notifications.slice(0, 10).forEach(n => {
      const type = n.type || 'general';
      if (!groups[type]) groups[type] = [];
      groups[type].push(n);
    });
    return groups;
  }, [notifications]);

  const typeConfig = {
    task_assigned: { icon: CheckSquare, color: 'bg-emerald-100 text-emerald-600', label: 'Task' },
    alert: { icon: AlertTriangle, color: 'bg-rose-100 text-rose-600', label: 'Alert' },
    security: { icon: Shield, color: 'bg-violet-100 text-violet-600', label: 'Security' },
    ai: { icon: Brain, color: 'bg-indigo-100 text-indigo-600', label: 'AI' },
    org: { icon: Building2, color: 'bg-blue-100 text-blue-600', label: 'Organization' },
    message: { icon: MessageSquare, color: 'bg-cyan-100 text-cyan-600', label: 'Message' },
    user: { icon: UserPlus, color: 'bg-emerald-100 text-emerald-600', label: 'User' },
    report: { icon: FileText, color: 'bg-amber-100 text-amber-600', label: 'Report' },
    default: { icon: Bell, color: 'bg-slate-100 text-slate-600', label: 'General' },
  };

  const severityBadge = (type) => {
    if (type === 'alert' || type === 'security') return 'rose';
    if (type === 'task_assigned') return 'emerald';
    if (type === 'ai') return 'violet';
    return 'primary';
  };

  if (loading) {
    return (
      <Card variant="default" padding="p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200" />
              <div className="flex-1">
                <div className="h-3 bg-slate-200 rounded w-3/4 mb-1" />
                <div className="h-2 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="p-5">
      <CardHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        icon={Bell}
        color={unreadCount > 0 ? 'rose' : 'slate'}
        action={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCheck size={12} /> Mark All Read
              </button>
            )}
          </div>
        }
      />

      <AnimatePresence mode="popLayout">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-8"
          >
            <Bell size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">No notifications</p>
            <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">You're all caught up!</p>
          </motion.div>
        ) : (
          <div className="space-y-1">
            {Object.entries(byType).map(([type, items]) => {
              const config = typeConfig[type] || typeConfig.default;
              const Icon = config.icon;
              return (
                <div key={type}>
                  <div className="flex items-center gap-1.5 px-1 py-1.5">
                    <Icon size={10} className="text-slate-400" />
                    <span className="text-[10px] font-medium text-slate-400 uppercase">
                      {config.label}
                    </span>
                    <Badge color="slate" size="xs">{items.length}</Badge>
                  </div>
                  {items.slice(0, 5).map((n, i) => (
                    <motion.div
                      key={n.id || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                        !n.read
                          ? 'bg-primary/5 border-l-2 border-l-primary'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-2 border-l-transparent'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${config.color}`}>
                        <Icon size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {notifications.length > 5 && (
        <button
          onClick={() => navigate('/app/tasks')}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
        >
          View all {notifications.length} notifications <ArrowRight size={12} />
        </button>
      )}
    </Card>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
