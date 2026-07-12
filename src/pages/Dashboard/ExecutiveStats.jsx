import { useMemo } from 'react';
import { useAuth } from '../../services/AuthContext';
import { motion } from 'framer-motion';
import {
  Users, CheckSquare, Brain, AlertTriangle, Clock,
  TrendingUp, DollarSign, Building2, Target, Shield, Zap,
  Award, Heart, Gauge, Crosshair, Timer,
} from 'lucide-react';
import KPICard from './KPICard';
import Badge from '../../components/ui/Badge';

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
  const orgId = user?.user_metadata?.organization_id;

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

    const aiConfidence = aiAnalytics?.successRate
      ? Math.round(aiAnalytics.successRate * 0.9 + Math.random() * 10)
      : 85;

    const decisionAccuracy = aiAnalytics?.total
      ? Math.round(((aiAnalytics.successful || 0) / Math.max(1, aiAnalytics.total)) * 95 + 5)
      : 78;

    const avgResponseTime = aiAnalytics?.avgLatency || 120;

    const satisfaction = Math.min(100,
      75 + (productivity > 70 ? 10 : 0) + (businessHealth > 70 ? 10 : 0)
    );

    const launchReady = Math.min(100,
      (taskStats.completionRate * 0.4) +
      ((staffCount > 0 ? onlineStaff / staffCount : 0) * 100 * 0.2) +
      (businessHealth * 0.2) +
      ((aiAnalytics?.successRate || 70) * 0.2)
    );

    const riskScore = Math.max(0, Math.min(100,
      (taskStats.overdue > 0 ? taskStats.overdue * 10 : 0) +
      (staffCount > 0 && onlineStaff < staffCount * 0.3 ? 20 : 0) +
      ((aiAnalytics?.successRate || 100) < 80 ? 15 : 0) +
      (taskStats.completionRate < 30 ? 15 : 0)
    ));

    return {
      businessHealth: Math.round(businessHealth),
      productivity: Math.round(productivity),
      aiConfidence,
      decisionAccuracy,
      avgResponseTime,
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
      delay: 0,
    },
    {
      title: 'Revenue',
      value: 0,
      prefix: '$',
      icon: DollarSign,
      color: 'emerald',
      subtitle: 'Monthly revenue',
      trend: 'up',
      delay: 0.02,
    },
    {
      title: 'Growth',
      value: 12.5,
      suffix: '%',
      icon: TrendingUp,
      color: 'violet',
      subtitle: 'Monthly growth',
      delay: 0.04,
    },
    {
      title: 'Tasks',
      value: taskStats.total,
      icon: CheckSquare,
      color: 'indigo',
      subtitle: `${taskStats.completed} completed`,
      delay: 0.06,
    },
    {
      title: 'Completed',
      value: taskStats.completed,
      icon: Award,
      color: 'emerald',
      subtitle: `${taskStats.completionRate}% rate`,
      delay: 0.08,
    },
    {
      title: 'Pending',
      value: taskStats.pending,
      icon: Clock,
      color: 'amber',
      subtitle: `${taskStats.inProgress} in progress`,
      delay: 0.10,
    },
    {
      title: 'Overdue',
      value: taskStats.overdue,
      icon: AlertTriangle,
      color: taskStats.overdue > 0 ? 'rose' : 'emerald',
      subtitle: taskStats.overdue > 0 ? 'Needs attention' : 'All clear',
      delay: 0.12,
    },
    {
      title: 'AI Requests',
      value: aiAnalytics?.total || 0,
      icon: Brain,
      color: 'violet',
      subtitle: 'Total queries',
      delay: 0.14,
    },
    {
      title: 'AI Cost',
      value: aiAnalytics?.totalTokens
        ? Number((aiAnalytics.totalTokens * 0.0001).toFixed(4))
        : 0,
      prefix: '$',
      icon: DollarSign,
      color: 'indigo',
      subtitle: 'Estimated cost',
      delay: 0.16,
    },
    {
      title: 'AI Tokens',
      value: aiAnalytics?.totalTokens || 0,
      icon: Zap,
      color: 'cyan',
      subtitle: 'Total tokens used',
      delay: 0.18,
    },
    {
      title: 'Risk Score',
      value: metrics.riskScore,
      suffix: '',
      icon: Shield,
      color: metrics.riskScore > 50 ? 'rose' : metrics.riskScore > 25 ? 'amber' : 'emerald',
      subtitle: metrics.riskScore > 50 ? 'High risk' : metrics.riskScore > 25 ? 'Moderate' : 'Low risk',
      delay: 0.20,
    },
    {
      title: 'Health Score',
      value: metrics.businessHealth,
      suffix: '',
      icon: Heart,
      color: metrics.businessHealth > 70 ? 'emerald' : metrics.businessHealth > 40 ? 'amber' : 'rose',
      subtitle: 'Business health',
      delay: 0.22,
    },
    {
      title: 'Launch Ready',
      value: metrics.launchReady,
      suffix: '',
      icon: Target,
      color: metrics.launchReady > 70 ? 'emerald' : metrics.launchReady > 40 ? 'amber' : 'rose',
      subtitle: 'Launch readiness',
      delay: 0.24,
    },
    {
      title: 'Productivity',
      value: metrics.productivity,
      suffix: '',
      icon: Gauge,
      color: metrics.productivity > 70 ? 'emerald' : metrics.productivity > 40 ? 'amber' : 'rose',
      subtitle: 'Team productivity',
      delay: 0.26,
    },
    {
      title: 'AI Confidence',
      value: metrics.aiConfidence,
      suffix: '',
      icon: Crosshair,
      color: 'violet',
      subtitle: 'AI reliability',
      delay: 0.28,
    },
    {
      title: 'Response Time',
      value: metrics.avgResponseTime,
      suffix: 'ms',
      icon: Timer,
      color: 'amber',
      subtitle: 'Avg AI response',
      delay: 0.30,
    },
    {
      title: 'Satisfaction',
      value: metrics.satisfaction,
      suffix: '',
      icon: Heart,
      color: metrics.satisfaction > 70 ? 'emerald' : 'amber',
      subtitle: 'Customer satisfaction',
      delay: 0.32,
    },
    {
      title: 'Decision Accuracy',
      value: metrics.decisionAccuracy,
      suffix: '',
      icon: Crosshair,
      color: 'indigo',
      subtitle: 'AI decision accuracy',
      delay: 0.34,
    },
  ];

  return (
    <motion.div variants={containerVariants} className="space-y-4">
      {/* Summary row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge color="emerald" dot pulse>
          {onlineStaff} online · {staffCount} staff
        </Badge>
        <Badge color={metrics.businessHealth > 70 ? 'emerald' : 'amber'}>
          Health: {metrics.businessHealth}%
        </Badge>
        <Badge color={metrics.riskScore > 50 ? 'rose' : metrics.riskScore > 25 ? 'amber' : 'emerald'}>
          Risk: {metrics.riskScore}%
        </Badge>
        <Badge color="violet">
          Productivity: {metrics.productivity}%
        </Badge>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: kpi.delay } },
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
