import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

// KPI accent color system — used for icons and top accent line only (not background)
const accentColorMap = {
  blue:     'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400',
  emerald:  'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  violet:   'bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400',
  amber:    'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
  rose:     'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400',
  cyan:     'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  indigo:   'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  green:    'bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400',
};

// Accent border colors for the top accent line
const accentBorderMap = {
  blue:     'bg-blue-500/30',
  emerald:  'bg-emerald-500/30',
  violet:   'bg-violet-500/30',
  amber:    'bg-amber-500/30',
  rose:     'bg-rose-500/30',
  cyan:     'bg-cyan-500/30',
  indigo:   'bg-indigo-500/30',
  green:    'bg-green-500/30',
};

// Mini trend sparkline (simulated)
function MiniSparkline({ trend, color }) {
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#94A3B8';
  // Generate a deterministic-ish sparkline path
  const points = [10, 8, 14, 11, 16, 13, 18, 15, 20].map((v, i) => ({
    x: i * 8,
    y: 24 - (v * (trend === 'up' ? 1.2 : trend === 'down' ? 0.8 : 1)),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return (
    <svg width="72" height="24" viewBox="0 0 72 24" className="shrink-0 opacity-40">
      <defs>
        <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={trendColor} stopOpacity={0.4} />
          <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${pathD} L${points[points.length-1].x},24 L${points[0].x},24 Z`} fill={`url(#sparkGrad-${color})`} />
      <path d={pathD} fill="none" stroke={trendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

  // Auto-calculate trend
  let trendDirection = trend;
  let trendPercent = null;
  if (trend === null && previousValue !== undefined && previousValue !== 0) {
    trendDirection = value >= previousValue ? 'up' : 'down';
    trendPercent = Math.abs(((value - previousValue) / previousValue) * 100).toFixed(1);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 p-5 animate-pulse">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
      </div>
    );
  }

  const route = kpiRouteMap[title];
  const iconAccent = accentColorMap[color] || accentColorMap.blue;
  const topBorderAccent = accentBorderMap[color] || accentBorderMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.2 } }}
      onClick={route ? () => navigate(route) : undefined}
      className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 p-5 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 group ${route ? 'cursor-pointer' : ''}`}
    >
      {/* Colored accent line at top */}
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${topBorderAccent}`} />

      <div className="relative z-10">
        {/* Header row: title + icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em]">{title}</span>
          {Icon && (
            <div className={`p-2 rounded-xl ${iconAccent} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
              <Icon size={16} />
            </div>
          )}
        </div>

        {/* Value with animated counter */}
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1 font-display tracking-tight">
          <AnimatedCounter
            to={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
          />
        </div>

        {/* Trend + subtitle row */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-1.5">
            {trendDirection && (
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                trendDirection === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trendDirection === 'down' ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {trendDirection === 'up' ? (
                  <TrendingUp size={12} />
                ) : trendDirection === 'down' ? (
                  <TrendingDown size={12} />
                ) : (
                  <Minus size={12} />
                )}
                {trendPercent ? `${trendPercent}%` : ''}
              </span>
            )}
            {subtitle && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{subtitle}</span>
            )}
          </div>
          {/* Mini trend sparkline */}
          {trendDirection && (
            <MiniSparkline trend={trendDirection} color={color} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
