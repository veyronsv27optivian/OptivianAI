import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnimatedCounter from './AnimatedCounter';

// Map KPI titles to navigation routes
const kpiRouteMap = {
  Staff: '/app/users',
  Revenue: '/app/org/analytics',
  Tasks: '/app/tasks',
  Completed: '/app/tasks',
  Pending: '/app/tasks',
  Overdue: '/app/tasks',
  'AI Requests': '/app/ai',
  'AI Cost': '/app/ai/history',
  'AI Tokens': '/app/ai/history',
  'Risk Score': '/app/org/analytics',
  'Health Score': '/app/org/analytics',
  Growth: '/app/org/analytics',
  'Launch Ready': '/app/ai',
  Productivity: '/app/tasks',
  'AI Confidence': '/app/ai/settings',
  'Response Time': '/app/ai/providers',
  Satisfaction: '/app/org/analytics',
  'Decision Accuracy': '/app/ai',
};

export default function KPICard({
  title,
  value,
  previousValue,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon: Icon,
  color = 'blue',
  trend = null,
  subtitle,
  loading = false,
  delay = 0,
}) {
  const navigate = useNavigate();
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', card: 'border-blue-100', gradient: 'from-blue-500/10' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', card: 'border-emerald-100', gradient: 'from-emerald-500/10' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', card: 'border-violet-100', gradient: 'from-violet-500/10' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', card: 'border-amber-100', gradient: 'from-amber-500/10' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', card: 'border-rose-100', gradient: 'from-rose-500/10' },
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', card: 'border-cyan-100', gradient: 'from-cyan-500/10' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', card: 'border-indigo-100', gradient: 'from-indigo-500/10' },
    slate: { bg: 'bg-slate-50', icon: 'text-slate-600', card: 'border-slate-200', gradient: 'from-slate-500/10' },
  };

  const c = colorMap[color] || colorMap.blue;

  // Auto-calculate trend
  let trendDirection = trend;
  let trendPercent = null;
  if (trend === null && previousValue !== undefined && previousValue !== 0) {
    trendDirection = value >= previousValue ? 'up' : 'down';
    trendPercent = Math.abs(((value - previousValue) / previousValue) * 100).toFixed(1);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
        <div className="h-8 bg-slate-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-1/3" />
      </div>
    );
  }

  const route = kpiRouteMap[title];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={route ? () => navigate(route) : undefined}
      className={`relative overflow-hidden rounded-xl border ${c.card} bg-white p-5 hover:shadow-lg transition-all duration-300 group ${route ? 'cursor-pointer' : ''}`}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
          {Icon && (
            <div className={`p-2 rounded-lg ${c.bg} ${c.icon} transition-transform group-hover:scale-110 duration-300`}>
              <Icon size={18} />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="text-2xl font-bold text-slate-900 mb-1">
          <AnimatedCounter
            to={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
          />
        </div>

        {/* Trend */}
        <div className="flex items-center gap-1.5">
          {trendDirection && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              trendDirection === 'up' ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {trendDirection === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trendPercent ? `${trendPercent}%` : ''}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-slate-400">{subtitle}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
