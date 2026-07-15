import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, TrendingUp, Shield, AlertTriangle, Lightbulb,
  Target, ArrowRight, BarChart3, MessageSquare, Zap,
  CheckCircle, Clock, Award, Crosshair,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';

const STRATEGIC_INSIGHTS = [
  {
    type: 'opportunity',
    icon: Lightbulb,
    title: 'Growth Opportunity',
    description: 'Task completion rate indicates strong execution capacity. Consider new strategic initiatives to leverage this momentum.',
    action: 'Explore AI Tools',
    actionTo: '/app/ai',
    color: 'emerald',
    priority: 'high',
  },
  {
    type: 'advisory',
    icon: Target,
    title: 'Strategic Focus',
    description: 'Your team has high pending workload. Recommend reviewing priorities and reallocating resources to critical path items.',
    action: 'View Tasks',
    actionTo: '/app/tasks',
    color: 'blue',
    priority: 'medium',
  },
  {
    type: 'insight',
    icon: TrendingUp,
    title: 'Performance Trend',
    description: 'Team productivity and completion rates are key indicators of organizational health. Use AI analytics to identify improvement areas.',
    action: 'Run Analysis',
    actionTo: '/app/ai',
    color: 'violet',
    priority: 'low',
  },
];

export default function AIPanel({
  aiAnalytics,
  taskStats,
  staffCount,
  onlineStaff,
  loading,
}) {
  const navigate = useNavigate();

  // Generate dynamic strategic recommendations based on real data
  const dynamicInsights = useMemo(() => {
    const items = [];
    if (!taskStats) return STRATEGIC_INSIGHTS;

    // Overdue task insight
    if (taskStats.overdue > 0) {
      items.push({
        type: 'risk',
        icon: AlertTriangle,
        title: `${taskStats.overdue} Overdue Tasks`,
        description: `Delayed tasks may impact project timelines. Consider reassigning or reprioritizing to maintain momentum.`,
        action: 'Review Overdue',
        actionTo: '/app/tasks',
        color: 'rose',
        priority: 'high',
      });
    }

    // High completion rate insight
    if (taskStats.completionRate > 70) {
      items.push({
        type: 'success',
        icon: Award,
        title: `Strong Output: ${taskStats.completionRate}% Completion`,
        description: `Your team is performing well with ${taskStats.completed} tasks completed. Keep up the momentum.`,
        action: 'View Dashboard',
        actionTo: '/app',
        color: 'emerald',
        priority: 'medium',
      });
    }

    // Low completion rate
    if (taskStats.completionRate < 30 && taskStats.total > 5) {
      items.push({
        type: 'risk',
        icon: Shield,
        title: 'Low Task Completion Rate',
        description: `Only ${taskStats.completionRate}% of tasks are completed. Consider identifying blockers and providing support.`,
        action: 'View Tasks',
        actionTo: '/app/tasks',
        color: 'amber',
        priority: 'high',
      });
    }

    // Staff online ratio insight
    if (staffCount > 0 && onlineStaff) {
      const ratio = (onlineStaff / staffCount) * 100;
      if (ratio < 40) {
        items.push({
          type: 'insight',
          icon: Clock,
          title: `${onlineStaff}/${staffCount} Staff Online`,
          description: `Less than half your team is currently active. Consider flexible scheduling or async collaboration tools.`,
          action: 'View Staff',
          actionTo: '/app/users',
          color: 'blue',
          priority: 'medium',
        });
      }
    }

    // Business health recommendation
    const healthScore = Math.min(100,
      (taskStats.completionRate * 0.3) +
      ((taskStats.total > 0 ? ((taskStats.total - taskStats.overdue) / taskStats.total) * 100 : 70) * 0.2) +
      (staffCount > 0 ? ((onlineStaff || 0) / staffCount) * 100 * 0.2 : 50) + 15
    );
    if (healthScore > 70) {
      items.push({
        type: 'advisory',
        icon: Brain,
        title: 'AI Suggestion: Strategic Planning',
        description: 'Your organization shows strong health. Use AI to run scenario simulations and explore growth strategies.',
        action: 'Try Decision Simulator',
        actionTo: '/app/ai',
        color: 'violet',
        priority: 'low',
      });
    }

    // Add default strategic items if none computed
    if (items.length === 0) {
      items.push(...STRATEGIC_INSIGHTS.slice(0, 2));
    }

    return items.sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return (p[a.priority] || 1) - (p[b.priority] || 1);
    });
  }, [taskStats, staffCount, onlineStaff]);

  // Compute business health summary for the AI Advisor card
  const advisorSummary = useMemo(() => {
    if (!taskStats) return null;
    const healthScore = Math.min(100,
      (taskStats.completionRate * 0.3) +
      ((taskStats.total > 0 ? ((taskStats.total - taskStats.overdue) / taskStats.total) * 100 : 70) * 0.2) +
      (staffCount > 0 ? ((onlineStaff || 0) / staffCount) * 100 * 0.2 : 50) + 15
    );
    return {
      healthScore: Math.round(healthScore),
      status: healthScore > 70 ? 'Strong' : healthScore > 40 ? 'Moderate' : 'Needs Attention',
      statusColor: healthScore > 70 ? 'emerald' : healthScore > 40 ? 'amber' : 'rose',
    };
  }, [taskStats, staffCount, onlineStaff]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
        <div className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Executive Summary Card */}
      {advisorSummary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 p-5 text-white"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={18} className="text-blue-200" />
              <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">AI Executive Advisor</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm opacity-90">Organization Health</p>
                <p className="text-3xl font-bold mt-1">{advisorSummary.healthScore}%</p>
                <span className={`inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  advisorSummary.statusColor === 'emerald' ? 'bg-emerald-500/30 text-emerald-100' :
                  advisorSummary.statusColor === 'amber' ? 'bg-amber-500/30 text-amber-100' :
                  'bg-rose-500/30 text-rose-100'
                }`}>
                  {advisorSummary.status}
                </span>
              </div>
              <button
                onClick={() => navigate('/app/ai')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition-all text-xs font-medium"
              >
                <MessageSquare size={12} /> Consult AI
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Key Metrics (outcome-focused, not technical) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Completion Rate', value: taskStats?.completionRate ? `${taskStats.completionRate}%` : 'N/A', icon: CheckCircle, color: 'emerald' },
          { label: 'Active Projects', value: taskStats?.inProgress || 0, icon: Target, color: 'blue' },
          { label: 'Overdue Tasks', value: taskStats?.overdue || 0, icon: Clock, color: taskStats?.overdue > 0 ? 'rose' : 'emerald' },
          { label: 'Team Online', value: `${onlineStaff || 0}/${staffCount || 0}`, icon: Crosshair, color: 'violet' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <stat.icon size={12} className={`text-${stat.color}-500`} />
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">{stat.label}</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Top Priority Risks & Opportunities */}
      <Card variant="default" padding="p-4">
        <CardHeader
          title="Executive AI Insights"
          subtitle={`${dynamicInsights.length} strategic recommendations`}
          icon={Brain}
          color="primary"
        />
        <div className="space-y-2">
          {dynamicInsights.slice(0, 4).map((insight, i) => {
            const Ic = insight.icon;
            const borderColor = insight.type === 'risk' ? 'border-l-rose-500' :
              insight.type === 'success' ? 'border-l-emerald-500' :
              insight.type === 'advisory' ? 'border-l-violet-500' : 'border-l-blue-500';
            const badgeColor = insight.color === 'rose' ? 'rose' :
              insight.color === 'emerald' ? 'emerald' :
              insight.color === 'violet' ? 'violet' : 'blue';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 border-l-2 ${borderColor} hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors`}
              >
                <div className="flex items-start gap-2.5">
                  <Ic size={14} className={`shrink-0 mt-0.5 ${
                    insight.type === 'risk' ? 'text-rose-500' :
                    insight.type === 'success' ? 'text-emerald-500' :
                    insight.type === 'advisory' ? 'text-violet-500' : 'text-blue-500'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{insight.title}</p>
                      <Badge color={badgeColor} size="xs">
                        {insight.priority === 'high' ? 'Priority' : insight.priority}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{insight.description}</p>
                  </div>
                  <button
                    onClick={() => navigate(insight.actionTo)}
                    className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 mt-0.5"
                  >
                    {insight.action} <ArrowRight size={10} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Quick AI Strategy Actions */}
      <Card variant="default" padding="p-4">
        <CardHeader
          title="AI Strategy Tools"
          subtitle="Leverage AI for strategic decisions"
          icon={Zap}
          color="violet"
        />
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Business Advisor', icon: Brain, desc: 'Get strategic advice', path: '/app/ai', toolType: 'business_advisor' },
            { label: 'Decision Simulator', icon: BarChart3, desc: 'Run scenario analysis', path: '/app/ai', toolType: 'decision_simulation' },
            { label: 'Risk Assessment', icon: Shield, desc: 'Evaluate risks', path: '/app/ai', toolType: 'risk_detection' },
            { label: 'SWOT Analysis', icon: Target, desc: 'Analyze strengths/weaknesses', path: '/app/ai', toolType: 'strategy_report' },
          ].map((tool, i) => (
            <motion.button
              key={tool.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`${tool.path}?tool=${tool.toolType}`)}
              className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left"
            >
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 shrink-0">
                <tool.icon size={14} className="text-slate-600 dark:text-slate-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{tool.label}</p>
                <p className="text-[10px] text-slate-400 truncate">{tool.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </Card>
    </div>
  );
}
