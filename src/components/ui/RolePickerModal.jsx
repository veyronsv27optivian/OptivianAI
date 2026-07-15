/**
 * ─── Role Picker Modal (Premium Onboarding) ──────────────────────
 * A stunning glassmorphism popup for selecting user roles.
 * Features search, animated role cards, permission preview, and
 * smooth animations. Apple-style design.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';import { createElement } from 'react';
import { Search, X, Check, ChevronRight, Users, Shield, Cpu,
  BarChart3, MessageSquare, FileText, Settings, Globe,
  Briefcase, UserCheck, Eye, Edit3, Lock, Star,
  Target, Clock, Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Role Icons ──────────────────────────────────────────────────
function getRoleIcon(roleId) {
  const iconMap = {
    ceo: Star,
    cto: Cpu,
    cfo: BarChart3,
    coo: Target,
    hr: Users,
    hr_manager: Users,
    operations: Activity,
    operations_manager: Activity,
    project_manager: Briefcase,
    department_manager: Briefcase,
    team_lead: UserCheck,
    senior_developer: Cpu,
    developer: Cpu,
    ui_ux_designer: Eye,
    marketing: Globe,
    marketing_executive: Globe,
    sales: MessageSquare,
    sales_executive: MessageSquare,
    finance: BarChart3,
    finance_executive: BarChart3,
    business_analyst: BarChart3,
    data_analyst: BarChart3,
    customer_support: MessageSquare,
    employee: Users,
    intern: Users,
    administrator: Shield,
    custom: Settings,
  };
  return iconMap[roleId] || Users;
}

// ─── Extended Role Definitions ──────────────────────────────────
const ROLE_DEFINITIONS = [
  {
    id: 'ceo',
    name: 'CEO',
    description: 'Chief Executive Officer',
    longDesc: 'Full strategic control over the organization. Access to all dashboards, AI insights, financial data, and team management.',
    permissions: ['Full dashboard access', 'AI Executive Advisor', 'All financial data', 'Team management', 'Organization settings'],
    modules: ['Executive Dashboard', 'Advanced Analytics', 'AI Strategic Advisor', 'Org Management', 'All Reports'],
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-300',
    rank: 100,
  },
  {
    id: 'coo',
    name: 'COO',
    description: 'Chief Operating Officer',
    longDesc: 'Oversees daily operations. Manages departments, workflows, and operational efficiency.',
    permissions: ['Operations dashboard', 'Department management', 'Task analytics', 'Staff overview', 'Workflow tools'],
    modules: ['Operations Dashboard', 'Department View', 'Task Management', 'Staff Overview', 'Calendar'],
    color: 'from-teal-500 to-emerald-600',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-700',
    text: 'text-teal-700 dark:text-teal-300',
    rank: 95,
  },
  {
    id: 'cfo',
    name: 'CFO',
    description: 'Chief Financial Officer',
    longDesc: 'Manages financial planning, budgeting, and financial analytics.',
    permissions: ['Financial dashboard', 'Budget tools', 'Revenue analytics', 'Cost tracking', 'Financial reports'],
    modules: ['Finance Dashboard', 'Budget Management', 'Revenue Analytics', 'Cost Reports', 'AI Financial Advisor'],
    color: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-300',
    rank: 95,
  },
  {
    id: 'cto',
    name: 'CTO',
    description: 'Chief Technology Officer',
    longDesc: 'Leads technology strategy, AI implementation, and technical infrastructure.',
    permissions: ['AI Platform access', 'Technical dashboard', 'Provider management', 'Developer tools', 'System settings'],
    modules: ['AI Dashboard', 'Technical Console', 'AI Manager', 'Provider Settings', 'Developer Tools'],
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
    rank: 95,
  },
  {
    id: 'hr_manager',
    name: 'HR Manager',
    description: 'Human Resources',
    longDesc: 'Manages people operations, recruitment, employee data, and HR analytics.',
    permissions: ['Staff management', 'Employee profiles', 'HR dashboard', 'Role management', 'Onboarding tools'],
    modules: ['HR Dashboard', 'Staff Overview', 'Employee Profiles', 'Role Manager', 'HR Reports'],
    color: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-700',
    text: 'text-pink-700 dark:text-pink-300',
    rank: 75,
  },
  {
    id: 'operations_manager',
    name: 'Operations Manager',
    description: 'Operations Management',
    longDesc: 'Manages workflows, processes, and operational tasks across the organization.',
    permissions: ['Operations dashboard', 'Task management', 'Process workflows', 'Team coordination', 'Reports'],
    modules: ['Operations Dashboard', 'Task Center', 'Workflow Tools', 'Team View', 'Analytics'],
    color: 'from-cyan-500 to-teal-600',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-700',
    text: 'text-cyan-700 dark:text-cyan-300',
    rank: 70,
  },
  {
    id: 'project_manager',
    name: 'Project Manager',
    description: 'Project Management',
    longDesc: 'Leads projects, tracks milestones, manages task assignments and deadlines.',
    permissions: ['Task management', 'Project tracking', 'Team assignment', 'Deadline management', 'Progress reports'],
    modules: ['Task Dashboard', 'Project View', 'Calendar', 'Team Tasks', 'Progress Tracking'],
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-700',
    text: 'text-violet-700 dark:text-violet-300',
    rank: 65,
  },
  {
    id: 'department_manager',
    name: 'Department Manager',
    description: 'Department Management',
    longDesc: 'Oversees department operations, team performance, and departmental goals.',
    permissions: ['Department dashboard', 'Team management', 'Performance tracking', 'Department reports', 'Staff view'],
    modules: ['Department Dashboard', 'Team Overview', 'Performance Metrics', 'Staff Management'],
    color: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-700',
    text: 'text-indigo-700 dark:text-indigo-300',
    rank: 65,
  },
  {
    id: 'team_lead',
    name: 'Team Lead',
    description: 'Team Leadership',
    longDesc: 'Leads a specific team, assigns tasks, tracks progress, and reports to management.',
    permissions: ['Team tasks', 'Member overview', 'Task assignment', 'Progress tracking', 'Team chat'],
    modules: ['Team Tasks', 'Member View', 'Task Board', 'Team Chat', 'Calendar'],
    color: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-700',
    text: 'text-purple-700 dark:text-purple-300',
    rank: 55,
  },
  {
    id: 'senior_developer',
    name: 'Senior Developer',
    description: 'Senior Development',
    longDesc: 'Senior engineering role with code review, architecture decisions, and mentorship.',
    permissions: ['Code tools', 'Task management', 'AI development tools', 'Technical docs', 'Team collaboration'],
    modules: ['Developer Dashboard', 'Task Center', 'AI Code Tools', 'Documentation', 'Team Chat'],
    color: 'from-blue-500 to-sky-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
    rank: 50,
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Software Development',
    longDesc: 'Builds and maintains software. Access to development tools and technical resources.',
    permissions: ['Development tasks', 'AI coding tools', 'Technical docs', 'Code collaboration', 'Team chat'],
    modules: ['Developer Dashboard', 'Tasks', 'AI Tools', 'Documentation', 'Chat'],
    color: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    border: 'border-sky-200 dark:border-sky-700',
    text: 'text-sky-700 dark:text-sky-300',
    rank: 40,
  },
  {
    id: 'ui_ux_designer',
    name: 'UI/UX Designer',
    description: 'Design & User Experience',
    longDesc: 'Designs user interfaces and experiences. Access to design resources and collaboration tools.',
    permissions: ['Task management', 'Design collaboration', 'File sharing', 'Team chat', 'Project view'],
    modules: ['Design Dashboard', 'Tasks', 'Files', 'Team Chat', 'Projects'],
    color: 'from-fuchsia-500 to-pink-600',
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
    border: 'border-fuchsia-200 dark:border-fuchsia-700',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
    rank: 40,
  },
  {
    id: 'marketing_executive',
    name: 'Marketing Executive',
    description: 'Marketing & Growth',
    longDesc: 'Manages marketing campaigns, content strategy, and brand analytics.',
    permissions: ['Marketing dashboard', 'Campaign tools', 'Content management', 'Analytics', 'Social tools'],
    modules: ['Marketing Dashboard', 'Campaign Manager', 'Content Tools', 'Analytics', 'AI Marketing'],
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-700',
    text: 'text-rose-700 dark:text-rose-300',
    rank: 45,
  },
  {
    id: 'sales_executive',
    name: 'Sales Executive',
    description: 'Sales & CRM',
    longDesc: 'Manages sales pipeline, client relationships, and revenue tracking.',
    permissions: ['Sales dashboard', 'CRM tools', 'Client management', 'Revenue tracking', 'Reports'],
    modules: ['Sales Dashboard', 'CRM', 'Client View', 'Revenue Analytics', 'AI Sales Tools'],
    color: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-700',
    text: 'text-orange-700 dark:text-orange-300',
    rank: 45,
  },
  {
    id: 'finance_executive',
    name: 'Finance Executive',
    description: 'Financial Operations',
    longDesc: 'Handles day-to-day financial operations, invoicing, and expense tracking.',
    permissions: ['Financial tools', 'Expense tracking', 'Invoice management', 'Reports', 'Budget view'],
    modules: ['Finance Dashboard', 'Expenses', 'Invoices', 'Reports', 'Budget Tools'],
    color: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-700',
    text: 'text-green-700 dark:text-green-300',
    rank: 45,
  },
  {
    id: 'business_analyst',
    name: 'Business Analyst',
    description: 'Business Analysis',
    longDesc: 'Analyzes business data, creates reports, and provides data-driven recommendations.',
    permissions: ['Analytics dashboard', 'Data visualization', 'Report generation', 'AI analysis', 'Data export'],
    modules: ['Analytics Dashboard', 'Reports', 'Data Viz', 'AI Analysis', 'Data Export'],
    color: 'from-teal-500 to-cyan-600',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-700',
    text: 'text-teal-700 dark:text-teal-300',
    rank: 40,
  },
  {
    id: 'data_analyst',
    name: 'Data Analyst',
    description: 'Data Analysis',
    longDesc: 'Works with data analysis, visualization, and AI-powered insights.',
    permissions: ['Data dashboard', 'Analytics tools', 'AI insights', 'Chart tools', 'Data export'],
    modules: ['Data Dashboard', 'Analytics', 'AI Insights', 'Charts', 'Export'],
    color: 'from-cyan-500 to-sky-600',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-700',
    text: 'text-cyan-700 dark:text-cyan-300',
    rank: 40,
  },
  {
    id: 'customer_support',
    name: 'Customer Support',
    description: 'Customer Support',
    longDesc: 'Handles customer inquiries, support tickets, and client communication.',
    permissions: ['Support dashboard', 'Ticket management', 'Client chat', 'Knowledge base', 'Reports'],
    modules: ['Support Dashboard', 'Tickets', 'Chat', 'Knowledge Base', 'Reports'],
    color: 'from-slate-500 to-slate-600',
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-600',
    text: 'text-slate-700 dark:text-slate-300',
    rank: 35,
  },
  {
    id: 'employee',
    name: 'Employee',
    description: 'Regular Employee',
    longDesc: 'Standard employee access. View tasks, participate in chat, use AI tools.',
    permissions: ['Personal tasks', 'Team chat', 'AI assistant', 'Profile settings', 'Calendar'],
    modules: ['Employee Dashboard', 'My Tasks', 'Team Chat', 'AI Assistant', 'Calendar'],
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-300',
    rank: 25,
  },
  {
    id: 'intern',
    name: 'Intern',
    description: 'Intern / Trainee',
    longDesc: 'Limited access for training period. Basic task and communication tools.',
    permissions: ['Basic tasks', 'Team chat', 'Profile', 'Learning resources'],
    modules: ['Simple Dashboard', 'Tasks', 'Chat', 'Profile'],
    color: 'from-slate-400 to-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-800/30',
    border: 'border-slate-200 dark:border-slate-600',
    text: 'text-slate-600 dark:text-slate-400',
    rank: 20,
  },
  {
    id: 'administrator',
    name: 'Administrator',
    description: 'System Admin',
    longDesc: 'Full system access. Manage users, settings, integrations, and infrastructure.',
    permissions: ['Admin dashboard', 'User management', 'System settings', 'Integrations', 'All modules'],
    modules: ['Admin Dashboard', 'User Manager', 'Settings', 'Integrations', 'All Data'],
    color: 'from-red-500 to-rose-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700',
    text: 'text-red-700 dark:text-red-300',
    rank: 85,
  },
  {
    id: 'custom',
    name: 'Custom Role',
    description: 'Custom Configuration',
    longDesc: 'Define your own role with custom permissions. Full flexibility to choose what you can access.',
    permissions: ['Customizable', 'Select your modules', 'Choose permissions', 'Flexible access'],
    modules: ['Your Choice', 'Custom Dashboard', 'Selected Modules'],
    color: 'from-gray-500 to-slate-600',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-600',
    text: 'text-gray-700 dark:text-gray-300',
    rank: 50,
  },
];

function PermissionBadge({ label, icon: Icon }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50">
      <Icon size={10} />
      {label}
    </span>
  );
}

function ModuleTag({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light">
      {label}
    </span>
  );
}

export default function RolePickerModal({ isOpen, onClose, onSelect, selectedRole }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState(selectedRole || null);
  const [showConfirm, setShowConfirm] = useState(false);
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setShowConfirm(false);
    }
  }, [isOpen]);

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return ROLE_DEFINITIONS;
    const q = searchQuery.toLowerCase();
    return ROLE_DEFINITIONS.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleRoleClick = useCallback((roleId) => {
    setSelectedRoleId(roleId);
    setShowConfirm(true);
  }, []);

  const handleConfirm = useCallback(() => {
    const role = ROLE_DEFINITIONS.find(r => r.id === selectedRoleId);
    if (role) {
      onSelect(role);
      onClose();
    }
  }, [selectedRoleId, onSelect, onClose]);

  const handleBack = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const selectedRoleData = useMemo(
    () => ROLE_DEFINITIONS.find(r => r.id === selectedRoleId),
    [selectedRoleId]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={showConfirm ? undefined : onClose}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
            }}
          >
            {/* Dark mode overlay */}
            <div className="absolute inset-0 dark:bg-slate-900/90 dark:backdrop-blur-2xl pointer-events-none" />

            {/* Subtle gradient border */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{
              padding: '1px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2), rgba(59,130,246,0.3))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }} />

            <div className="relative z-10 flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="shrink-0 px-6 pt-6 pb-4 border-b border-slate-200/60 dark:border-slate-700/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {showConfirm ? 'Confirm Your Role' : 'Choose Your Role'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {showConfirm
                        ? 'Review your selection and confirm'
                        : 'Select the role that best describes your position'}
                    </p>
                  </div>
                  {!showConfirm && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* Search bar */}
                {!showConfirm && (
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search roles..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {showConfirm && selectedRoleData ? (
                  /* ── Confirmation Panel ── */
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    {/* Selected role badge */}
                    <div className={`p-5 rounded-2xl border ${selectedRoleData.border} ${selectedRoleData.bg}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedRoleData.color} flex items-center justify-center shadow-lg`}>
                          {createElement(getRoleIcon(selectedRoleData.id), { size: 24, className: 'text-white' })}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedRoleData.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{selectedRoleData.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">About this role</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{selectedRoleData.longDesc}</p>
                    </div>

                    {/* Permissions preview */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Shield size={14} className="text-primary" />
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Permissions</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRoleData.permissions.map((perm, i) => {
                          const icons = [Eye, Edit3, Lock, Shield, Settings, Users, Activity, Clock, BarChart3, FileText, MessageSquare, Globe];
                          const Icon = icons[i % icons.length];
                          return <PermissionBadge key={i} label={perm} icon={Icon} />;
                        })}
                      </div>
                    </div>

                    {/* Modules preview */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Cpu size={14} className="text-violet-500" />
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Dashboard Modules</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRoleData.modules.map((mod, i) => (
                          <ModuleTag key={i} label={mod} />
                        ))}
                      </div>
                    </div>

                    {/* Dashboard preview hint */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-primary/5 to-violet-500/5 border border-primary/10 dark:border-primary/20">
                      <div className="flex items-start gap-2">
                        <BarChart3 size={16} className="text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Your personalized dashboard will be configured based on this role
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            You'll see relevant widgets, analytics, and AI tools tailored to your responsibilities.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Role Grid ── */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredRoles.map((role, index) => {
                      const isSelected = selectedRoleId === role.id;
                      const Icon = getRoleIcon(role.id);
                      return (
                        <motion.button
                          key={role.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: index * 0.03 }}
                          onClick={() => handleRoleClick(role.id)}
                          className={`relative group text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                            isSelected
                              ? `${role.border} ${role.bg} shadow-lg`
                              : 'border-slate-200/60 dark:border-slate-700/30 hover:border-slate-300 dark:hover:border-slate-600/50 bg-white/50 dark:bg-slate-800/30 hover:bg-white/80 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {/* Glow effect on select */}
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`absolute inset-0 rounded-2xl ${role.bg} opacity-50`}
                            />
                          )}

                          <div className="relative z-10 flex items-start gap-3">
                            <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                              <Icon size={18} className="text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className={`text-sm font-bold ${isSelected ? role.text : 'text-slate-800 dark:text-slate-200'}`}>
                                {role.name}
                              </h3>
                              <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {role.description}
                              </p>
                            </div>
                            <ChevronRight
                              size={16}
                              className={`shrink-0 mt-1 transition-all ${
                                isSelected
                                  ? 'text-primary translate-x-0.5'
                                  : 'text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 group-hover:text-slate-400'
                              }`}
                            />
                          </div>
                        </motion.button>
                      );
                    })}

                    {filteredRoles.length === 0 && (
                      <div className="col-span-2 py-10 text-center">
                        <Search size={32} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No roles found matching "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="shrink-0 px-6 py-4 border-t border-slate-200/60 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/30">
                {showConfirm ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBack}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all"
                    >
                      Back to Roles
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-violet-600 hover:from-primary-dark hover:to-violet-700 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                    >
                      <Check size={16} />
                      Confirm {selectedRoleData?.name} Role
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-[10px] text-slate-400 dark:text-slate-500">
                    Click any role card to see details and confirm your selection
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export { ROLE_DEFINITIONS, getRoleIcon };
