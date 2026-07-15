import { useMemo } from 'react';
import { useAuth } from '../../services/AuthContext';
import { motion } from 'framer-motion';
import {
  Users, CheckSquare, AlertTriangle,
  TrendingUp, Shield,
  Award, Heart, Gauge, Wallet,
} from 'lucide-react';
import KPICard from './KPICard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

export default function ExecutiveStats({
  staffCount,
  onlineStaff,
  taskStats,
  aiAnalytics,
  unreadCount,
  loading,
}) {
  const { user } = useAuth();

  // Compute derived metrics
  const metrics = useMemo(() => {
    const businessHealth = Math.min(100,
      (taskStats.completionRate * 0.3) +
      ((taskStats.total > 0 ? ((taskStats.total - taskStats.overdue) / taskStats.total) * 100 : 70) * 0.2) +
      (staffCount > 0 ? (onlineStaff / staffCount) * 100 * 0.2 : 50) +
      ((aiAnalytics?.successRate || 70) * 0.15) +
      15
    );

    const productivity = Math.min(100,
      taskStats.total > 0
        ? ((taskStats.completed / taskStats.total) * 60) +
          ((taskStats.total - taskStats.overdue) / taskStats.total * 20) +
          (onlineStaff > 0 ? (onlineStaff / Math.max(1, staffCount)) * 20 : 0)
        : 50
    );

    const satisfaction = Math.min(100,
      75 + (productivity > 70 ? 10 : 0) + (businessHealth > 70 ? 10 : 0)
    );

    const launchReady = Math.min(100,
      (taskStats.completionRate * 0.4) +
      ((staffCount > 0 ? onlineStaff / staffCount : 0) * 100 * 0.2) +
      (businessHealth * 0.2)
    );

    const riskScore = Math.max(0, Math.min(100,
      (taskStats.overdue > 0 ? Math.min(taskStats.overdue * 10, 40) : 0) +
      (staffCount > 0 && onlineStaff < staffCount * 0.3 ? 20 : 0) +
      (taskStats.completionRate < 30 ? 15 : 0)
    ));

    return {
      businessHealth: Math.round(businessHealth),
      productivity: Math.round(productivity),
      satisfaction: Math.round(satisfaction),
      launchReady: Math.round(launchReady),
      riskScore: Math.round(riskScore),
    };
  }, [taskStats, staffCount, onlineStaff, aiAnalytics]);

  const kpiCards = [
    {
      title: 'Staff',
      value: staffCount,
      icon: Users,
      color: 'blue',
      subtitle: `${onlineStaff} online now`,
      trend: onlineStaff > 0 ? 'up' : 'down',
      delay: 0,
    },
    {
      title: 'Tasks',
      value: taskStats.total,
      icon: CheckSquare,
      color: 'cyan',
      subtitle: `${taskStats.completed} completed`,
      trend: taskStats.completed > 0 ? 'up' : 'down',
      delay: 0.04,
    },
    {
      title: 'Overdue',
      value: taskStats.overdue,
      icon: AlertTriangle,
      color: taskStats.overdue > 0 ? 'rose' : 'emerald',
      subtitle: taskStats.overdue > 0 ? 'Needs attention' : 'All clear',
      trend: taskStats.overdue > 0 ? 'down' : 'up',
      delay: 0.08,
    },
    {
      title: 'Completion',
      value: taskStats.completionRate,
      suffix: '%',
      icon: Award,
      color: taskStats.completionRate > 70 ? 'emerald' : 'amber',
      subtitle: `${taskStats.completed} of ${taskStats.total} done`,
      trend: taskStats.completionRate > 50 ? 'up' : 'down',
      delay: 0.12,
    },
    {
      title: 'Health Score',
      value: metrics.businessHealth,
      suffix: '',
      icon: Heart,
      color: metrics.businessHealth > 70 ? 'emerald' : metrics.businessHealth > 40 ? 'amber' : 'rose',
      subtitle: 'Business health',
      trend: metrics.businessHealth > 60 ? 'up' : 'down',
      delay: 0.16,
    },
    {
      title: 'Risk Score',
      value: metrics.riskScore,
      suffix: '',
      icon: Shield,
      color: metrics.riskScore > 50 ? 'rose' : metrics.riskScore > 25 ? 'amber' : 'emerald',
      subtitle: metrics.riskScore > 50 ? 'High risk' : metrics.riskScore > 25 ? 'Moderate' : 'Low risk',
      trend: metrics.riskScore > 30 ? 'down' : 'up',
      delay: 0.20,
    },
    {
      title: 'Productivity',
      value: metrics.productivity,
      suffix: '',
      icon: Gauge,
      color: metrics.productivity > 70 ? 'emerald' : metrics.productivity > 40 ? 'amber' : 'rose',
      subtitle: 'Team productivity',
      trend: metrics.productivity > 50 ? 'up' : 'down',
      delay: 0.24,
    },
    {
      title: 'AI Requests',
      value: aiAnalytics?.total || 0,
      icon: Wallet,
      color: 'violet',
      subtitle: 'Total AI analyses',
      trend: aiAnalytics?.total > 0 ? 'up' : 'down',
      delay: 0.28,
    },
  ];

  return (
    <motion.div variants={containerVariants} className="space-y-5">
      {/* Legacy summary badges — keep for compatibility */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: `${onlineStaff} online · ${staffCount} staff`, color: 'emerald', pulse: true },
          { label: `Health: ${metrics.businessHealth}%`, color: metrics.businessHealth > 70 ? 'emerald' : 'amber' },
          { label: `Risk: ${metrics.riskScore}%`, color: metrics.riskScore > 50 ? 'rose' : metrics.riskScore > 25 ? 'amber' : 'emerald' },
          { label: `Productivity: ${metrics.productivity}%`, color: metrics.productivity > 70 ? 'emerald' : 'amber' },
        ].map((badge, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
              badge.color === 'emerald'
                ? 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : badge.color === 'amber'
                ? 'bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400'
                : 'bg-rose-100 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'
            } ${badge.pulse ? 'animate-pulse-soft' : ''}`}
          >
            {badge.pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            {badge.label}
          </span>
        ))}
      </div>

      {/* KPI Grid — 6 columns for premium CEO view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.slice(0, 12).map((kpi, i) => (
          <motion.div
            key={kpi.title}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: kpi.delay, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            <KPICard
              title={kpi.title}
              value={kpi.value}
              prefix={kpi.prefix}
              suffix={kpi.suffix}
              icon={kpi.icon}
              color={kpi.color}
              subtitle={kpi.subtitle}
              trend={kpi.trend}
              loading={loading}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
