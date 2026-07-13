import { motion } from 'framer-motion';

const variants = {
  default: 'bg-white dark:bg-slate-800/90 border border-border dark:border-slate-700/50',
  glass: 'glass-card dark:glass-dark',
  gradient: 'bg-gradient-to-br dark:bg-gradient-to-br',
  elevated: 'bg-white dark:bg-slate-800 border border-border dark:border-slate-700/50 shadow-glass dark:shadow-glass-lg',
  premium: 'bg-white dark:bg-slate-800/90 border border-border dark:border-slate-700/50 shadow-premium dark:shadow-premium-lg',
  'gradient-border': 'bg-white dark:bg-slate-800/90 gradient-border',
  flat: 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30',
};

export default function Card({
  children,
  variant = 'default',
  gradient,
  padding = 'p-5',
  className = '',
  hover = true,
  animate = false,
  onClick,
  ...props
}) {
  const Component = onClick ? 'button' : motion.div;
  const motionProps = onClick
    ? { onClick, className: `w-full text-left ${className}` }
    : animate
      ? {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: 'easeOut' },
        }
      : {};

  const hoverClasses = hover
    ? 'hover:shadow-glass-lg dark:hover:shadow-glass-lg hover:-translate-y-0.5 dark:hover:border-slate-600/50'
    : '';

  return (
    <Component
      {...motionProps}
      className={`
        rounded-xl overflow-hidden transition-all duration-300
        ${variants[variant] || variants.default}
        ${gradient ? `${gradient} ` : ''}
        ${padding}
        ${hoverClasses}
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    slate: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400',
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.primary}`}>
            <Icon size={16} />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-foreground dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-3 border-t border-border dark:border-slate-700/50 ${className}`}>
      {children}
    </div>
  );
}
