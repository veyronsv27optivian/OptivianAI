import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Users, CheckSquare, Brain, MessageSquare, FileText,
  BarChart3, Settings, Upload, Building2, Shield, Target,
  Calendar, ClipboardList, UserPlus, Video,
  TrendingUp, PieChart,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';

const actionGroups = [
  {
    label: 'Management',
    actions: [
      { icon: Users, label: 'Manage Users', color: 'text-blue-600', bg: 'bg-blue-50', to: '/app/users' },
      { icon: UserPlus, label: 'Invite Staff', color: 'text-emerald-600', bg: 'bg-emerald-50', to: '/app/users' },
      { icon: Building2, label: 'Org Settings', color: 'text-teal-600', bg: 'bg-teal-50', to: '/app/org' },
      { icon: Shield, label: 'Admin Panel', color: 'text-violet-600', bg: 'bg-violet-50', to: '/app/admin' },
    ],
  },
  {
    label: 'Tasks & Projects',
    actions: [
      { icon: CheckSquare, label: 'Create Task', color: 'text-emerald-600', bg: 'bg-emerald-50', to: '/app/tasks' },
      { icon: Target, label: 'Create Project', color: 'text-indigo-600', bg: 'bg-indigo-50', to: '/app/tasks' },
      { icon: ClipboardList, label: 'My Tasks', color: 'text-amber-600', bg: 'bg-amber-50', to: '/app/tasks' },
      { icon: Calendar, label: 'Schedule', color: 'text-rose-600', bg: 'bg-rose-50', to: '/app/tasks' },
    ],
  },
  {
    label: 'AI & Analytics',
    actions: [
      { icon: Brain, label: 'AI Advisor', color: 'text-violet-600', bg: 'bg-violet-50', to: '/app/ai' },
      { icon: TrendingUp, label: 'Org Analytics', color: 'text-cyan-600', bg: 'bg-cyan-50', to: '/app/org/analytics' },
      { icon: PieChart, label: 'AI History', color: 'text-indigo-600', bg: 'bg-indigo-50', to: '/app/ai/history' },
      { icon: BarChart3, label: 'Reports', color: 'text-amber-600', bg: 'bg-amber-50', to: '/app/ai' },
    ],
  },
  {
    label: 'Communication',
    actions: [
      { icon: MessageSquare, label: 'Chat', color: 'text-cyan-600', bg: 'bg-cyan-50', to: '/app/chat' },
      { icon: Video, label: 'Meeting', color: 'text-rose-600', bg: 'bg-rose-50', to: '/app/chat' },
      { icon: FileText, label: 'Documents', color: 'text-blue-600', bg: 'bg-blue-50', to: '/app/chat' },
      { icon: Upload, label: 'Upload File', color: 'text-orange-600', bg: 'bg-orange-50', to: '/app/chat' },
    ],
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card variant="default" padding="p-5">
      <CardHeader title="Quick Actions" subtitle="Frequently used tools" icon={Zap} color="primary" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actionGroups.map((group) => (
          <div key={group.label}>
            <h4 className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-wider">
              {group.label}
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {group.actions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(action.to)}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm transition-all"
                  >
                    <div className={`p-1.5 rounded-md ${action.bg} ${action.color} dark:bg-slate-800/80`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{action.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick action footer */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-[10px] text-slate-400">16 quick actions available</span>
        <button onClick={() => navigate('/app/settings')}
          className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium">
          <Settings size={10} /> Customize
        </button>
      </div>
    </Card>
  );
}
