import { motion } from 'framer-motion';

const colors = {
  primary: 'bg-primary',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  cyan: 'bg-cyan-500',
  slate: 'bg-slate-500',
  indigo: 'bg-indigo-500',
  gradient: 'bg-gradient-to-r from-primary to-violet-500',
};

const sizes = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export default function ProgressBar({
  value = 0,
  max = 100,
  color = 'primary',
  size = 'md',
  label,
  showValue = false,
  animated = true,
  className = '',
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs font-medium text-slate-600 dark:text-text-secondary">{label}</span>}
          {showValue && (
            <span className="text-xs font-semibold text-slate-900 dark:text-text-primary">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-200/60 dark:bg-white/5 rounded-full overflow-hidden ${sizes[size] || sizes.md}`}>
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className={`h-full rounded-full ${colors[color] || colors.primary} transition-all duration-500`}
          style={{
            boxShadow: pct > 0 ? `0 0 8px ${color === 'emerald' ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.3)'}` : 'none',
          }}
        />
      </div>
    </div>
  );
}

export function MultiProgressBar({ segments = [], size = 'md', className = '' }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  const colorMap = {
    primary: 'bg-primary',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
    cyan: 'bg-cyan-500',
    slate: 'bg-slate-500',
    indigo: 'bg-indigo-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-slate-200/60 dark:bg-white/5 rounded-full overflow-hidden flex ${sizes[size] || sizes.md}`}>
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          if (pct < 1) return null;
          return (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
              className={`h-full ${colorMap[seg.color] || seg.color || 'bg-primary'} first:rounded-l-full last:rounded-r-full`}
              title={`${seg.label}: ${Math.round(pct)}%`}
            />
          );
        })}
      </div>
      {segments.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-2">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${colorMap[seg.color] || seg.color || 'bg-primary'}`} />
              <span className="text-[10px] text-slate-500 dark:text-text-secondary">
                {seg.label} ({Math.round((seg.value / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
