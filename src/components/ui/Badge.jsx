import { motion } from 'framer-motion';

const colors = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  rose: 'bg-rose-100 text-rose-700 border-rose-200',
  violet: 'bg-violet-100 text-violet-700 border-violet-200',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const sizes = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({
  children,
  color = 'primary',
  size = 'sm',
  dot = false,
  pulse = false,
  className = '',
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        ${colors[color] || colors.primary}
        ${sizes[size] || sizes.sm}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </motion.span>
  );
}

export function StatusDot({ status, size = 'md' }) {
  const statusMap = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    away: 'bg-amber-500',
    busy: 'bg-rose-500',
    active: 'bg-emerald-500',
    inactive: 'bg-slate-400',
    pending: 'bg-amber-500',
    completed: 'bg-emerald-500',
    in_progress: 'bg-blue-500',
    overdue: 'bg-rose-500',
    done: 'bg-emerald-500',
    cancelled: 'bg-slate-400',
    high: 'bg-rose-500',
    medium: 'bg-amber-500',
    low: 'bg-slate-400',
    urgent: 'bg-rose-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    info: 'bg-blue-500',
  };

  const sizeMap = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-block rounded-full ${statusMap[status] || 'bg-slate-400'} ${sizeMap[size] || sizeMap.md}`}
    />
  );
}
