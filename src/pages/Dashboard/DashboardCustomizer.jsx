import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
  LayoutDashboard, BarChart3, Building2, Users, CheckSquare,
  Calendar, Bell, Brain, Zap, GripVertical, Eye, EyeOff, X,
} from 'lucide-react';

const WIDGET_KEY = 'optivian_dashboard_widgets';

const DEFAULT_WIDGETS = [
  { id: 'executive-stats',  label: 'Executive Statistics',    icon: LayoutDashboard, color: 'blue' },
  { id: 'advanced-analytics', label: 'Advanced Analytics',    icon: BarChart3,       color: 'violet' },
  { id: 'org-overview',     label: 'Organization Overview',   icon: Building2,       color: 'teal' },
  { id: 'staff-overview',   label: 'Staff Overview',          icon: Users,           color: 'cyan' },
  { id: 'task-center',      label: 'Task Center',             icon: CheckSquare,     color: 'emerald' },
  { id: 'calendar',         label: 'Calendar',                icon: Calendar,        color: 'rose' },
  { id: 'notifications',    label: 'Notification Center',     icon: Bell,            color: 'amber' },
  { id: 'ai-dashboard',     label: 'AI Dashboard',            icon: Brain,           color: 'violet' },
  { id: 'ai-panel',         label: 'AI Insights Panel',       icon: Zap,             color: 'indigo' },
  { id: 'quick-actions',    label: 'Quick Actions',           icon: Zap,             color: 'primary' },
];

function loadWidgetConfig() {
  try {
    const saved = localStorage.getItem(WIDGET_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_WIDGETS.map((w, i) => ({ id: w.id, label: w.label, visible: true, order: i }));
}

function saveWidgetConfig(config) {
  localStorage.setItem(WIDGET_KEY, JSON.stringify(config));
}

export { loadWidgetConfig, saveWidgetConfig, WIDGET_KEY };

export default function DashboardCustomizer({ onClose }) {
  const [widgets, setWidgets] = useState(() => loadWidgetConfig());
  const [hasChanges, setHasChanges] = useState(false);

  const toggleVisibility = (id) => {
    setWidgets(prev => prev.map(w =>
      w.id === id ? { ...w, visible: !w.visible } : w
    ));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveWidgetConfig(widgets);
    onClose();
  };

  const handleReset = () => {
    const defaults = DEFAULT_WIDGETS.map((w, i) => ({
      id: w.id, label: w.label, visible: true, order: i,
    }));
    setWidgets(defaults);
    setHasChanges(true);
  };

  const visibleCount = widgets.filter(w => w.visible).length;
  const hiddenCount = widgets.length - visibleCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-glass-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <LayoutDashboard size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Customize Dashboard</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {visibleCount} visible · {hiddenCount} hidden · Drag to reorder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto p-3">
          <Reorder.Group axis="y" values={widgets} onReorder={(val) => { setWidgets(val); setHasChanges(true); }} className="space-y-1">
            {widgets.map((widget) => {
              const def = DEFAULT_WIDGETS.find(d => d.id === widget.id);
              const Icon = def?.icon || LayoutDashboard;
              const colorMap = {
                blue: 'text-blue-600 bg-blue-50', violet: 'text-violet-600 bg-violet-50',
                teal: 'text-teal-600 bg-teal-50', cyan: 'text-cyan-600 bg-cyan-50',
                emerald: 'text-emerald-600 bg-emerald-50', rose: 'text-rose-600 bg-rose-50',
                amber: 'text-amber-600 bg-amber-50', indigo: 'text-indigo-600 bg-indigo-50',
                primary: 'text-primary bg-primary/10',
              };
              const iconStyle = colorMap[def?.color] || colorMap.primary;

              return (
                <Reorder.Item
                  key={widget.id}
                  value={widget}
                  className="bg-white dark:bg-slate-800/90 rounded-lg border border-slate-100 dark:border-slate-700/30 hover:border-slate-200 dark:hover:border-slate-600/50 transition-all"
                >
                  <div className="flex items-center gap-3 px-3 py-3">
                    <div className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-400 transition-colors">
                      <GripVertical size={16} />
                    </div>
                    <div className={`p-1.5 rounded-md ${iconStyle}`}>
                      <Icon size={14} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {widget.label}
                    </span>
                    <button
                      onClick={() => toggleVisibility(widget.id)}
                      className={`p-1.5 rounded-lg transition-all ${
                        widget.visible
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100'
                          : 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100'
                      }`}
                      title={widget.visible ? 'Hide widget' : 'Show widget'}
                    >
                      {widget.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700/50 shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg text-xs font-medium text-white bg-primary hover:bg-primary/90 transition-all shadow-sm"
          >
            {hasChanges ? 'Save Layout' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
