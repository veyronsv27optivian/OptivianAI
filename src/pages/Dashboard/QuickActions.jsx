import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Users, CheckSquare, Brain, MessageSquare, FileText,
  BarChart3, Upload, Building2, Shield, Target,
  Calendar, ClipboardList, UserPlus, Video,
  TrendingUp, PieChart,
} from 'lucide-react';

const actionGroups = [
  {
    label: 'Management',
    actions: [
      { icon: Users, label: 'Manage Users', bg: 'bg-blue-50 dark:bg-blue-900/25', iconColor: 'text-blue-600 dark:text-blue-400', to: '/app/users' },
      { icon: UserPlus, label: 'Invite Staff', bg: 'bg-emerald-50 dark:bg-emerald-900/25', iconColor: 'text-emerald-600 dark:text-emerald-400', to: '/app/users' },
      { icon: Building2, label: 'Org Settings', bg: 'bg-teal-50 dark:bg-teal-900/25', iconColor: 'text-teal-600 dark:text-teal-400', to: '/app/org' },
      { icon: Shield, label: 'Admin Panel', bg: 'bg-violet-50 dark:bg-violet-900/25', iconColor: 'text-violet-600 dark:text-violet-400', to: '/app/admin' },
    ],
  },
  {
    label: 'Tasks & Projects',
    actions: [
      { icon: CheckSquare, label: 'Create Task', bg: 'bg-emerald-50 dark:bg-emerald-900/25', iconColor: 'text-emerald-600 dark:text-emerald-400', to: '/app/tasks' },
      { icon: Target, label: 'Create Project', bg: 'bg-indigo-50 dark:bg-indigo-900/25', iconColor: 'text-indigo-600 dark:text-indigo-400', to: '/app/tasks' },
      { icon: ClipboardList, label: 'My Tasks', bg: 'bg-amber-50 dark:bg-amber-900/25', iconColor: 'text-amber-600 dark:text-amber-400', to: '/app/tasks' },
      { icon: Calendar, label: 'Schedule', bg: 'bg-rose-50 dark:bg-rose-900/25', iconColor: 'text-rose-600 dark:text-rose-400', to: '/app/tasks' },
    ],
  },
  {
    label: 'AI & Analytics',
    actions: [
      { icon: Brain, label: 'AI Advisor', bg: 'bg-violet-50 dark:bg-violet-900/25', iconColor: 'text-violet-600 dark:text-violet-400', to: '/app/ai' },
      { icon: TrendingUp, label: 'Analytics', bg: 'bg-cyan-50 dark:bg-cyan-900/25', iconColor: 'text-cyan-600 dark:text-cyan-400', to: '/app/org/analytics' },
      { icon: PieChart, label: 'AI History', bg: 'bg-indigo-50 dark:bg-indigo-900/25', iconColor: 'text-indigo-600 dark:text-indigo-400', to: '/app/ai/history' },
      { icon: BarChart3, label: 'Reports', bg: 'bg-amber-50 dark:bg-amber-900/25', iconColor: 'text-amber-600 dark:text-amber-400', to: '/app/ai' },
    ],
  },
  {
    label: 'Communication',
    actions: [
      { icon: MessageSquare, label: 'Chat', bg: 'bg-cyan-50 dark:bg-cyan-900/25', iconColor: 'text-cyan-600 dark:text-cyan-400', to: '/app/chat' },
      { icon: Video, label: 'Meeting', bg: 'bg-rose-50 dark:bg-rose-900/25', iconColor: 'text-rose-600 dark:text-rose-400', to: '/app/chat' },
      { icon: FileText, label: 'Documents', bg: 'bg-blue-50 dark:bg-blue-900/25', iconColor: 'text-blue-600 dark:text-blue-400', to: '/app/chat' },
      { icon: Upload, label: 'Upload File', bg: 'bg-orange-50 dark:bg-orange-900/25', iconColor: 'text-orange-600 dark:text-orange-400', to: '/app/chat' },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.03, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

export default function QuickActions({ compact = false }) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto py-1 px-0.5 scrollbar-hide">
        {actionGroups.map((group) =>
          group.actions.slice(0, 2).map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.to)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all shrink-0 text-[10px] font-medium text-slate-600 dark:text-slate-300"
                title={action.label}
              >
                <Icon size={12} className={action.iconColor} />
                <span className="hidden sm:inline">{action.label}</span>
              </motion.button>
            );
          })
        )}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm"
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500" />

      <div className="p-3 sm:p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500">
              <Zap size={14} className="text-white" />
            </div>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quick Actions</h3>
          </div>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
            {actionGroups.reduce((sum, g) => sum + g.actions.length, 0)} shortcuts
          </span>
        </div>

        {/* Action buttons as a scrollable horizontal bar */}
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {actionGroups.map((group, gi) => (
            <div key={group.label} className="flex items-stretch gap-2">
              {/* Category divider */}
              {gi > 0 && (
                <div className="w-px bg-slate-200 dark:bg-slate-700/50 shrink-0 self-stretch my-1" />
              )}
              {group.actions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    variants={itemVariants}
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate(action.to)}
                    className="group flex flex-col items-center gap-1.5 min-w-[72px] sm:min-w-[80px] p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md dark:hover:shadow-lg transition-all active:shadow-inner"
                  >
                    <div className={`p-2 rounded-lg ${action.bg} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon size={16} className={action.iconColor} />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center leading-tight whitespace-nowrap">
                      {action.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
