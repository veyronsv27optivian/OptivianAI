import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Puzzle, ToggleLeft, ToggleRight, Settings, ExternalLink,
  Mail, Calendar, MessageSquare, Globe, Download, Webhook,
  ChevronRight, Search,
} from 'lucide-react';
import { getInstalledPlugins, togglePlugin, getPluginConfig, savePluginConfig } from '../../services/pluginService';

const ICON_MAP = {
  mail: Mail, calendar: Calendar, 'message-square': MessageSquare,
  globe: Globe, download: Download, webhook: Webhook,
};

export default function PluginManager({ onClose }) {
  const [plugins, setPlugins] = useState(() => getInstalledPlugins());
  const [searchQuery, setSearchQuery] = useState('');
  const [configuring, setConfiguring] = useState(null);

  const filtered = plugins.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (id) => {
    const plugin = plugins.find(p => p.id === id);
    if (!plugin) return;
    togglePlugin(id, !plugin.enabled);
    setPlugins(getInstalledPlugins());
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-50"><Puzzle size={20} className="text-violet-600" /></div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Plugin Manager</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{plugins.filter(p => p.enabled).length} of {plugins.length} active</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
            <ChevronRight size={20} className="rotate-180" />
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search plugins..." className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div className="space-y-2">
        {filtered.map(plugin => {
          const Icon = ICON_MAP[plugin.icon] || Puzzle;
          return (
            <motion.div key={plugin.id} layout className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className={`p-2 rounded-lg ${plugin.enabled ? 'bg-violet-50' : 'bg-slate-100'}`}>
                <Icon size={20} className={plugin.enabled ? 'text-violet-600' : 'text-slate-500 dark:text-slate-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{plugin.name}</p>
                  {plugin.builtIn && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-medium">Built-in</span>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{plugin.description}</p>
                {plugin.version && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">v{plugin.version}</p>}
              </div>
              <button onClick={() => handleToggle(plugin.id)}
                className={`p-1.5 rounded-lg transition-all ${plugin.enabled ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                title={plugin.enabled ? 'Disable' : 'Enable'}
              >
                {plugin.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
              <button onClick={() => setConfiguring(configuring === plugin.id ? null : plugin.id)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                title="Configure"
              >
                <Settings size={16} />
              </button>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Puzzle size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No plugins match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
