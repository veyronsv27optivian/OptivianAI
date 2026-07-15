import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, MessageSquare, Target, Shield, BarChart3, TrendingUp,
  Lightbulb, ArrowRight, Zap,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function AIDashboard({
  aiAnalytics,
  taskStats,
  loading,
}) {
  const navigate = useNavigate();

  // Generate strategic AI tool suggestions based on business context
  const toolSuggestions = useMemo(() => {
    const items = [
      {
        icon: Brain,
        label: 'Business Advisor',
        desc: 'Strategic guidance for your organization',
        color: 'from-blue-500 to-blue-600',
        path: '/app/ai?tool=business_advisor',
      },
      {
        icon: Target,
        label: 'SWOT Analysis',
        desc: 'Evaluate strengths & opportunities',
        color: 'from-violet-500 to-violet-600',
        path: '/app/ai?tool=strategy_report',
      },
      {
        icon: BarChart3,
        label: 'Decision Simulator',
        desc: 'Model business scenarios',
        color: 'from-cyan-500 to-cyan-600',
        path: '/app/ai?tool=decision_simulation',
      },
      {
        icon: Shield,
        label: 'Risk Assessment',
        desc: 'Identify & mitigate risks',
        color: 'from-rose-500 to-rose-600',
        path: '/app/ai?tool=risk_detection',
      },
      {
        icon: TrendingUp,
        label: 'Financial Forecast',
        desc: 'Project revenue & expenses',
        color: 'from-emerald-500 to-emerald-600',
        path: '/app/ai?tool=performance_analysis',
      },
      {
        icon: Lightbulb,
        label: 'Future Lab',
        desc: 'Explore market trends',
        color: 'from-amber-500 to-amber-600',
        path: '/app/ai?tool=predictive_analytics',
      },
    ];
    return items;
  }, []);

  const summaryMetrics = useMemo(() => {
    if (!taskStats) return [];
    return [
      { label: 'Tools Available', value: toolSuggestions.length, color: 'violet' },
      { label: 'Completion Rate', value: taskStats.completionRate ? `${taskStats.completionRate}%` : 'N/A', color: 'emerald' },
      { label: 'Active Projects', value: taskStats.inProgress, color: 'blue' },
    ];
  }, [taskStats, toolSuggestions]);

  return (
    <Card variant="default" padding="p-5">
      <CardHeader
        title="AI Strategy Tools"
        subtitle="Leverage AI for better decisions"
        icon={Brain}
        color="violet"
        action={
          <button onClick={() => navigate('/app/ai')}
            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1">
            All Tools <ArrowRight size={12} />
          </button>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {summaryMetrics.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-2.5 rounded-lg bg-${stat.color}-50 dark:bg-slate-800/60`}
          >
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
            <p className={`text-xs font-bold text-${stat.color}-600 tabular-nums`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {toolSuggestions.map((tool, i) => (
          <motion.button
            key={tool.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => navigate(tool.path)}
            className="relative flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all overflow-hidden group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${tool.color}`}>
              <tool.icon size={12} className="text-white" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{tool.label}</p>
              <p className="text-[9px] text-slate-400 truncate">{tool.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
        <button onClick={() => navigate('/app/ai')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors">
          <MessageSquare size={12} /> Open AI Platform
        </button>
        <button onClick={() => navigate('/app/ai/history')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-medium hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors">
          <BarChart3 size={12} /> AI History
        </button>
      </div>
    </Card>
  );
}
