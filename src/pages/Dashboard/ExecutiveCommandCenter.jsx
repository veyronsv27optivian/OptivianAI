import { motion } from 'framer-motion';import {
  TrendingUp, TrendingDown,
  Zap, ChevronRight, RefreshCw, Eye, Activity,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';

function StatusIndicator({ label, value, status, trend }) {
  const colors = {
    critical: { bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800/50', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    good: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/50', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    info: { bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800/50', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  };
  const c = colors[status] || colors.info;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : null;
  return (
    <div className={`p-4 rounded-xl border ${c.bg} ${c.border}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${c.text}`}>{label}</span>
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${c.text}`}>{value}</span>
        {TrendIcon && (
          <span className={`flex items-center text-xs font-medium ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <TrendIcon size={12} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}



export default function ExecutiveCommandCenter({ taskStats, staffCount, loading }) {
  return (
    <div className="space-y-5">
      {/* Status Bar — using real data only */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatusIndicator label="Staff Online" value={`${staffCount || 0}`} status="good" trend={0} />
        <StatusIndicator label="Tasks Overdue" value={taskStats?.overdue || 0} status={taskStats?.overdue > 5 ? 'critical' : 'good'} trend={0} />
        <StatusIndicator label="Active Projects" value={taskStats?.inProgress || 0} status="info" trend={0} />
        <StatusIndicator label="Completion Rate" value={taskStats?.completionRate ? `${taskStats.completionRate}%` : '0%'} status={taskStats?.completionRate > 70 ? 'good' : 'warning'} trend={0} />
        <StatusIndicator label="Pending Tasks" value={taskStats?.pending || 0} status={taskStats?.pending > 10 ? 'warning' : 'good'} trend={0} />
        <StatusIndicator label="Urgent Tasks" value={taskStats?.urgent || 0} status={taskStats?.urgent > 3 ? 'critical' : 'info'} trend={0} />
      </div>

      {/* Summary Chart — shows real task data */}
      <Card variant="default" padding="p-5">
        <CardHeader title="Task Overview" subtitle="Real-time task metrics" icon={Activity} color="primary" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          <StatusIndicator label="Total Tasks" value={taskStats?.total || 0} status="info" trend={0} />
          <StatusIndicator label="Completed" value={taskStats?.completed || 0} status="good" trend={0} />
          <StatusIndicator label="In Progress" value={taskStats?.inProgress || 0} status="info" trend={0} />
          <StatusIndicator label="Overdue" value={taskStats?.overdue || 0} status={taskStats?.overdue > 3 ? 'critical' : 'good'} trend={0} />
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all">
          <Zap size={16} /> Generate Executive Report
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
          <Eye size={16} /> View All Metrics
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>
    </div>
  );
}
