import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Activity, Shield, Award,
  UserCheck, ArrowRight,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge, { StatusDot } from '../../components/ui/Badge';

export default function StaffOverview({
  staffCount,
  onlineStaff,
  loading,
}) {
  const navigate = useNavigate();

  const roleDistribution = useMemo(() => [
    { name: 'Admin', count: 1, color: 'bg-violet-500', textColor: 'text-violet-600' },
    { name: 'Manager', count: 2, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { name: 'Staff', count: Math.max(0, staffCount - 3), color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  ].filter(r => r.count > 0), [staffCount]);

  const statusData = useMemo(() => [
    { label: 'Online', value: onlineStaff, total: staffCount, color: 'bg-emerald-500' },
    { label: 'Away', value: Math.max(0, Math.round(staffCount * 0.15)), total: staffCount, color: 'bg-amber-500' },
    { label: 'Offline', value: Math.max(0, staffCount - onlineStaff - Math.round(staffCount * 0.15)), total: staffCount, color: 'bg-slate-400' },
  ], [staffCount, onlineStaff]);

  if (loading) {
    return (
      <Card variant="default" padding="p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-1/3" />
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700/50" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-1/2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-1/3" />
            </div>
          </div>
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-16" />
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700/30 rounded-full" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-8" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="p-5">
      <CardHeader
        title="Staff Overview"
        subtitle="Team status"
        icon={Users}
        color="primary"
        action={
          <button onClick={() => navigate('/app/users')}
            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1">
            View All <ArrowRight size={12} />
          </button>
        }
      />

      {/* Online Status */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/50">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <Users size={20} className="text-emerald-600" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{onlineStaff} Online Now</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">out of {staffCount} total staff</p>
        </div>
      </div>

      {/* Staff Status Distribution */}
      <div className="space-y-2 mb-4">
        {statusData.map((s, i) => {
          const pct = s.total > 0 ? (s.value / s.total) * 100 : 0;
          return (
            <div key={s.label} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-14">{s.label}</span>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={`h-full rounded-full ${s.color}`}
                />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-8 text-right">{s.value}</span>
            </div>
          );
        })}
      </div>

      {/* Role Distribution */}
      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
        <Shield size={12} /> Role Distribution
      </h4>
      <div className="space-y-1.5 mb-4">
        {roleDistribution.map((role, i) => (
          <motion.div
            key={role.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${role.color}`} />
              <span className="text-xs text-slate-600 dark:text-slate-300">{role.name}</span>
            </div>
            <span className={`text-xs font-semibold ${role.textColor}`}>{role.count}</span>
          </motion.div>
        ))}
      </div>

      {/* Staff Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigate('/app/users')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors">
          <UserCheck size={12} /> Manage Staff
        </button>
        <button onClick={() => navigate('/app/admin')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-medium hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors">
          <Award size={12} /> Admin Panel
        </button>
        <button onClick={() => navigate('/app/settings/login-history')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-medium hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors">
          <Activity size={12} /> Login History
        </button>
      </div>
    </Card>
  );
}
