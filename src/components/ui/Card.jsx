import { motion } from 'framer-motion';

const variants = {
  default: 'bg-white border border-border',
  glass: 'bg-white/80 backdrop-blur-xl border border-white/20',
  gradient: 'bg-gradient-to-br',
  elevated: 'bg-white border border-border shadow-lg shadow-slate-200/50',
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

  return (
    <Component
      {...motionProps}
      className={`
        rounded-xl overflow-hidden transition-all duration-300
        ${variants[variant] || variants.default}
        ${gradient ? `${gradient} ` : ''}
        ${padding}
        ${hover ? 'hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5' : ''}
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
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-100 text-emerald-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    slate: 'bg-slate-100 text-slate-600',
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
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
