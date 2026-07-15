import { motion } from 'framer-motion';

const variants = {
  default: 'bg-white dark:dark-card-metallic border border-border/80 dark:border-white/5 shadow-card hover:shadow-card-hover',
  glass: 'glass-card dark:dark-card-metallic backdrop-blur-lg',
  gradient: 'bg-gradient-to-br from-white to-slate-50 dark:from-surface-raised/90 dark:to-surface/95 dark:border-white/5',
  elevated: 'bg-white dark:dark-card-metallic border border-border/80 dark:border-white/5 shadow-card hover:shadow-card-hover',
  premium: 'premium-card border border-border/80 dark:border-white/5',
  'gradient-border': 'premium-card gradient-border',
  flat: 'bg-slate-50/80 dark:bg-surface-raised/60 border border-slate-100 dark:border-white/5',
  metallic: 'dark-card-metallic border border-white/5 cursor-pointer hover:-translate-y-0.5',
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
    ? 'hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/20 dark:hover:border-primary/20 hover-glow'
    : '';

  return (
    <Component
      {...motionProps}
      className={`
        rounded-2xl overflow-hidden transition-all duration-300
        ${variants[variant] || variants.default}
        ${gradient ? `${gradient} ` : ''}
        ${padding}
        ${hoverClasses}
        ${onClick ? 'cursor-pointer active:scale-[0.97]' : ''}
        ${animate ? 'animate-fade-in-up' : ''}
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
          <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.primary}`}>
            <Icon size={16} />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-text-primary dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-text-tertiary dark:text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-3 border-t border-border/80 dark:border-white/5 ${className}`}>
      {children}
    </div>
  );
}
