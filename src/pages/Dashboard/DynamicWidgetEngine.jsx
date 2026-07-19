import { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  GripVertical, Eye, EyeOff, Settings, Save, X,
  LayoutDashboard, Users, CheckSquare, Bell, BarChart3,
  Calendar, Activity, Brain, Zap,
} from 'lucide-react';

const ALL_WIDGETS = [
  { id: 'executive-stats', label: 'Executive Statistics', icon: BarChart3, defaultVisible: true, roles: ['admin', 'executive', 'manager', 'staff'] },
  { id: 'advanced-analytics', label: 'Advanced Analytics', icon: Activity, defaultVisible: true, roles: ['admin', 'executive', 'manager'] },
  { id: 'org-overview', label: 'Organization Overview', icon: Users, defaultVisible: true, roles: ['admin', 'executive', 'manager', 'staff'] },
  { id: 'staff-overview', label: 'Staff Overview', icon: Users, defaultVisible: true, roles: ['admin', 'executive', 'manager'] },
  { id: 'task-center', label: 'Task Center', icon: CheckSquare, defaultVisible: true, roles: ['admin', 'executive', 'manager', 'staff'] },
  { id: 'calendar', label: 'Calendar', icon: Calendar, defaultVisible: true, roles: ['admin', 'executive', 'manager', 'staff'] },
  { id: 'notifications', label: 'Notifications', icon: Bell, defaultVisible: true, roles: ['admin', 'executive', 'manager', 'staff'] },
  { id: 'ai-dashboard', label: 'AI Dashboard', icon: Brain, defaultVisible: true, roles: ['admin', 'executive', 'manager'] },
  { id: 'ai-panel', label: 'AI Advisor Panel', icon: Zap, defaultVisible: true, roles: ['admin', 'executive', 'manager'] },
  { id: 'quick-actions', label: 'Quick Actions', icon: LayoutDashboard, defaultVisible: true, roles: ['admin', 'executive', 'manager', 'staff'] },
];

const WIDGET_LAYOUTS = {
  grid: { cols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3', gap: 'gap-5' },
  compact: { cols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4', gap: 'gap-3' },
};

export function loadWidgetConfig(userRole = 'staff') {
  try {
    const stored = JSON.parse(localStorage.getItem('optivian_widget_config') || '{}');
    const defaults = ALL_WIDGETS
      .filter(w => w.roles.includes(userRole))
      .map(w => ({ id: w.id, visible: stored[w.id]?.visible ?? w.defaultVisible, order: stored[w.id]?.order ?? ALL_WIDGETS.indexOf(w) }));
    return defaults;
  } catch { return ALL_WIDGETS.map(w => ({ id: w.id, visible: w.defaultVisible, order: ALL_WIDGETS.indexOf(w) })); }
}

export function saveWidgetConfig(config) {
  const obj = {};
  config.forEach(c => { obj[c.id] = { visible: c.visible, order: c.order }; });
  localStorage.setItem('optivian_widget_config', JSON.stringify(obj));
}

export default function DynamicWidgetEngine({ userRole = 'staff', onClose, currentConfig, onSave }) {
  const [config, setConfig] = useState(() => currentConfig || loadWidgetConfig(userRole));
  const [layoutMode, setLayoutMode] = useState('grid');

  const available = useMemo(() =>
    ALL_WIDGETS.filter(w => w.roles.includes(userRole)),
    [userRole]
  );

  const toggleWidget = (id) => {
    setConfig(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };

  const handleSave = () => {
    saveWidgetConfig(config);
    if (onSave) onSave(config);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600"><LayoutDashboard size={18} className="text-white" /></div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Customize Dashboard</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Toggle widgets on/off and reorder by dragging.</p>

          {/* Layout mode toggle */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
            <button onClick={() => setLayoutMode('grid')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${layoutMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
              Grid
            </button>
            <button onClick={() => setLayoutMode('compact')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${layoutMode === 'compact' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
              Compact
            </button>
          </div>

          {/* Widget list */}
          <AnimatePresence>
            <Reorder.Group axis="y" values={config} onReorder={setConfig} className="space-y-2">
              {config.map(item => {
                const widget = available.find(w => w.id === item.id);
                if (!widget) return null;
                const Icon = widget.icon;
                return (
                  <Reorder.Item key={item.id} value={item} as="div">
                    <motion.div layout className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-grab active:cursor-grabbing">
                      <GripVertical size={16} className="text-slate-300 shrink-0" />
                      <div className={`p-1.5 rounded ${item.visible ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-700/50'}`}>
                        <Icon size={16} className={item.visible ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${item.visible ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>{widget.label}</p>
                        <p className="text-[10px] text-slate-400">{widget.id}</p>
                      </div>
                      <button onClick={() => toggleWidget(item.id)}
                        className={`p-2 rounded-lg transition-all ${
                          item.visible
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                            : 'bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600/50'
                        }`}
                        title={item.visible ? 'Hide widget' : 'Show widget'}
                      >
                        {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </motion.div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between p-5 border-t border-slate-200 dark:border-slate-700/50">
          <span className="text-xs text-slate-400">{config.filter(c => c.visible).length} widgets visible</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all">Cancel</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all">
              <Save size={14} /> Save Layout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
