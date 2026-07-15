import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Link2, Link2Off, ExternalLink, Settings, Check, X,
  MessageSquare, Folder, Calendar, Target, Zap, Globe,
  ChevronRight, Search, Loader2,
} from 'lucide-react';
import { getIntegrationDefs, getConnectedIntegrations, connectIntegration, disconnectIntegration } from '../../services/thirdPartyIntegrations';

const ICON_MAP = {
  'message-square': MessageSquare, folder: Folder, calendar: Calendar,
  target: Target, zap: Zap, globe: Globe,
};

function IntegrationCard({ def, connected, onConnect, onDisconnect }) {
  const Icon = ICON_MAP[def.icon] || Link2;
  const [connecting, setConnecting] = useState(false);

  const handleToggle = async () => {
    if (connected) {
      await onDisconnect(def.id);
    } else {
      setConnecting(true);
      await onConnect(def.id, def.config);
      setConnecting(false);
    }
  };

  return (
    <motion.div layout className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className="p-2.5 rounded-lg" style={{ backgroundColor: def.color + '15' }}>
        <Icon size={20} style={{ color: def.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-900">{def.name}</p>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
            connected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {connected ? 'Connected' : 'Not connected'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{def.description}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{def.category}</p>
      </div>
      <a href={def.docs} target="_blank" rel="noopener noreferrer"
        className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
        title="Documentation">
        <ExternalLink size={14} />
      </a>
      <button onClick={handleToggle} disabled={connecting}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          connected
            ? 'bg-red-50 text-red-700 hover:bg-red-100'
            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
        } disabled:opacity-50`}
      >
        {connecting ? <Loader2 size={12} className="animate-spin" /> : connected ? <X size={12} /> : <Link2 size={12} />}
        {connecting ? 'Connecting...' : connected ? 'Disconnect' : 'Connect'}
      </button>
    </motion.div>
  );
}

export default function IntegrationsPage({ onClose }) {
  const [connected, setConnected] = useState(() => getConnectedIntegrations());
  const defs = getIntegrationDefs();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = defs.filter(d =>
    !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConnect = async (id, config) => {
    await connectIntegration(id, config);
    setConnected(getConnectedIntegrations());
  };

  const handleDisconnect = async (id) => {
    await disconnectIntegration(id);
    setConnected(getConnectedIntegrations());
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50"><Link2 size={20} className="text-indigo-600" /></div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Third-Party Integrations</h2>
            <p className="text-xs text-slate-400">{connected.length} of {defs.length} connected</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <ChevronRight size={20} className="rotate-180" />
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search integrations..." className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="space-y-2">
        {filtered.map(def => (
          <IntegrationCard
            key={def.id} def={def}
            connected={connected.some(c => c.id === def.id)}
            onConnect={handleConnect} onDisconnect={handleDisconnect}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Link2 size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No integrations match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
