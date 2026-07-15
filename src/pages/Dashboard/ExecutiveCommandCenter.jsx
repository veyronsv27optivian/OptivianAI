import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, AlertTriangle,
  Users, Target, DollarSign, Activity, Clock, Zap,
  ChevronRight, RefreshCw, Eye,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Card, { CardHeader } from '../../components/ui/Card';

function StatusIndicator({ label, value, status, trend }) {
  const colors = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
    good: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
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

function AlertItem({ alert }) {
  const icons = {
    critical: AlertCircle, warning: AlertTriangle, info: Activity,
  };
  const Icon = icons[alert.severity] || AlertCircle;
  const colors = {
    critical: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${colors[alert.severity] || colors.info}`}>
      <Icon size={16} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{alert.title}</p>
        <p className="text-xs opacity-80 mt-0.5">{alert.message}</p>
      </div>
      <span className="text-[10px] opacity-60 shrink-0">{alert.time}</span>
    </div>
  );
}

export default function ExecutiveCommandCenter({ taskStats, staffCount, loading }) {
  const [alerts] = useState([
    { id: 1, severity: 'critical', title: 'Revenue Target at Risk', message: 'Q3 revenue is 23% behind target. Urgent action needed.', time: '2m ago' },
    { id: 2, severity: 'warning', title: 'Team Capacity Low', message: 'Engineering team at 95% capacity for 2 weeks.', time: '15m ago' },
    { id: 3, severity: 'info', title: 'Product Launch On Track', message: 'All milestones for Q4 launch are green.', time: '1h ago' },
  ]);

  const revenueData = [
    { month: 'Jan', revenue: 120000, target: 100000, cost: 70000 },
    { month: 'Feb', revenue: 135000, target: 110000, cost: 72000 },
    { month: 'Mar', revenue: 142000, target: 130000, cost: 75000 },
    { month: 'Apr', revenue: 155000, target: 140000, cost: 78000 },
    { month: 'May', revenue: 168000, target: 150000, cost: 82000 },
    { month: 'Jun', revenue: 175000, target: 160000, cost: 85000 },
  ];

  const deptHealth = [
    { dept: 'Engineering', health: 88, tasks: taskStats?.inProgress || 12 },
    { dept: 'Marketing', health: 72, tasks: 8 },
    { dept: 'Sales', health: 65, tasks: taskStats?.overdue || 5 },
    { dept: 'HR', health: 90, tasks: 3 },
    { dept: 'Finance', health: 85, tasks: 4 },
    { dept: 'Operations', health: 78, tasks: 9 },
  ];

  const alertsBySeverity = useMemo(() => {
    const c = alerts.filter(a => a.severity === 'critical').length;
    const w = alerts.filter(a => a.severity === 'warning').length;
    return { critical: c, warning: w, total: alerts.length };
  }, [alerts]);

  return (
    <div className="space-y-5">
      {/* Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatusIndicator label="Revenue MTD" value="$175K" status="good" trend={8} />
        <StatusIndicator label="Profit Margin" value="48%" status="good" trend={3} />
        <StatusIndicator label="Team Health" value="82%" status="warning" trend={-2} />
        <StatusIndicator label="Tasks Overdue" value={taskStats?.overdue || 0} status={taskStats?.overdue > 5 ? 'critical' : 'good'} trend={0} />
        <StatusIndicator label="Active Projects" value={taskStats?.inProgress || 0} status="info" trend={12} />
        <StatusIndicator label="Staff Online" value={`${staffCount || 0}`} status="good" trend={5} />
      </div>

      {/* Alerts + Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card variant="default" padding="p-5" className="lg:col-span-2">
          <CardHeader title="Revenue vs Target" subtitle="Monthly performance tracking" icon={DollarSign} color="primary" />
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="target" stroke="#10b981" strokeDasharray="5 5" fill="none" strokeWidth={2} name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Active Alerts */}
        <Card variant="default" padding="p-5">
          <CardHeader title="Active Alerts" subtitle={`${alertsBySeverity.total} active`} icon={AlertCircle} color="warning" />
          <div className="flex gap-2 mb-3">
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-medium">{alertsBySeverity.critical} Critical</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium">{alertsBySeverity.warning} Warning</span>
          </div>
          <div className="space-y-2">
            {alerts.map(a => <AlertItem key={a.id} alert={a} />)}
          </div>
        </Card>
      </div>

      {/* Department Health */}
      <Card variant="default" padding="p-5">
        <CardHeader title="Department Health" subtitle="Real-time health scores across departments" icon={Activity} color="primary" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {deptHealth.map(d => (
            <div key={d.dept} className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors text-center">
              <p className="text-xs text-slate-500 mb-2">{d.dept}</p>
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="2" />
                  <circle cx="18" cy="18" r="16" fill="none"
                    stroke={d.health >= 85 ? '#10b981' : d.health >= 70 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="2" strokeDasharray={`${d.health * 1.005} 100.5}`} strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{d.health}</span>
              </div>
              <p className="text-[10px] text-slate-400">{d.tasks} tasks</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all">
          <Zap size={16} /> Generate Executive Report
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all">
          <Eye size={16} /> View All Metrics
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all">
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>
    </div>
  );
}
