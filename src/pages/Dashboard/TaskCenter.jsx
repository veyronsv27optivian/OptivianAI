import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckSquare, Clock, AlertTriangle, Eye, ArrowRight,
  Calendar, BarChart3, ListTodo, UserPlus,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge, { StatusDot } from '../../components/ui/Badge';

export default function TaskCenter({
  taskStats,
  upcomingDeadlines = [],
  loading,
}) {
  const navigate = useNavigate();

  const todayTasks = useMemo(() =>
    upcomingDeadlines.filter(t =>
      t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()
    ), [upcomingDeadlines]);

  const weekTasks = useMemo(() =>
    upcomingDeadlines.filter(t => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      const end = new Date();
      end.setDate(end.getDate() + 7);
      return d >= new Date() && d <= end;
    }).slice(0, 5), [upcomingDeadlines]);

  if (loading) {
    return (
      <Card variant="default" padding="p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg" />)}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="p-5">
      <CardHeader
        title="Task Center"
        subtitle={`${taskStats.total} tasks · ${taskStats.completed} done`}
        icon={CheckSquare}
        color="emerald"
        action={
          <button onClick={() => navigate('/app/tasks')}
            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1">
            All Tasks <ArrowRight size={12} />
          </button>
        }
      />

      {/* Task Status Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Pending', value: taskStats.pending, color: 'bg-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' },
          { label: 'In Progress', value: taskStats.inProgress, color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50' },
          { label: 'Completed', value: taskStats.completed, color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' },
          { label: 'Overdue', value: taskStats.overdue, color: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`p-3 rounded-lg text-center border ${s.bg} dark:dark-card-metallic`}
          >
            <p className={`text-lg font-bold ${s.label === 'Overdue' && s.value > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground dark:text-slate-100'}`}>
              {s.value}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Priority Distribution */}
      {upcomingDeadlines.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1.5">
            <BarChart3 size={12} /> Priority Distribution
          </h4>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700/50">
            {[
              { label: 'Urgent', count: taskStats.urgent, color: 'bg-rose-500' },
              { label: 'High', count: taskStats.high, color: 'bg-orange-500' },
              { label: 'Medium', count: taskStats.medium, color: 'bg-amber-500' },
              { label: 'Low', count: taskStats.low, color: 'bg-slate-400' },
            ].filter(p => p.count > 0).map((p, i) => {
              const pct = taskStats.total > 0 ? (p.count / taskStats.total) * 100 : 0;
              return (
                <motion.div
                  key={p.label}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, pct)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className={`h-full ${p.color} first:rounded-l-full last:rounded-r-full`}
                  title={`${p.label}: ${p.count}`}
                />
              );
            })}
          </div>
          <div className="flex gap-3 mt-1.5">
            {[
              { label: 'Urgent', count: taskStats.urgent, color: 'bg-rose-500' },
              { label: 'High', count: taskStats.high, color: 'bg-orange-500' },
              { label: 'Medium', count: taskStats.medium, color: 'bg-amber-500' },
              { label: 'Low', count: taskStats.low, color: 'bg-slate-400' },
            ].filter(p => p.count > 0).map(p => (
              <span key={p.label} className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className={`w-1.5 h-1.5 rounded-full ${p.color}`} />
                {p.label}: {p.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 ? (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1.5">
            <Calendar size={12} /> Upcoming Deadlines
          </h4>
          <div className="space-y-1">
            {upcomingDeadlines.slice(0, 5).map((t, i) => {
              const updatedAt = t.updated_at || t.created_at;
              const timeAgo = updatedAt ? (() => {
                const diff = Date.now() - new Date(updatedAt).getTime();
                const mins = Math.floor(diff / 60000);
                if (mins < 1) return 'just now';
                if (mins < 60) return `${mins}m ago`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs}h ago`;
                const days = Math.floor(hrs / 24);
                return `${days}d ago`;
              })() : '';
              return (
                <motion.div
                  key={t.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/app/tasks')}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusDot status={t.priority || 'medium'} size="md" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-[10px] font-medium ${new Date(t.due_date) < new Date() ? 'text-rose-500' : 'text-slate-400'}`}>
                      {t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </span>
                    {t.priority === 'urgent' && <Badge color="rose" size="xs">Urgent</Badge>}
                    {timeAgo && <span className="text-[10px] text-slate-400 italic">updated {timeAgo}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 text-slate-400 dark:text-slate-500">
          <ListTodo size={28} className="mb-2 text-slate-300 dark:text-slate-600" />
          <p className="text-xs">No upcoming deadlines</p>
        </div>
      )}

      {/* Quick task buttons */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-border">
        <button onClick={() => navigate('/app/tasks')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
          <Eye size={12} /> View All
        </button>
        <button onClick={() => navigate('/app/tasks')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors">
          <UserPlus size={12} /> Assign Task
        </button>
      </div>
    </Card>
  );
}
