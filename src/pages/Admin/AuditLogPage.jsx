import { useState, useEffect } from 'react';
import {
  Activity, RefreshCw,
  AlertCircle, AlertTriangle, Info,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { getActivityLog, getActivityStats } from '../../services/auditLogService';

const SEVERITY_CONFIG = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', icon: AlertCircle },
  error: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', icon: AlertTriangle },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', icon: AlertTriangle },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', icon: Info },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatAction(action) {
  return action?.replace(/\./g, ' · ').replace(/_/g, ' ') || 'Unknown action';
}

export default function AuditLogPage() {
  const { user } = useAuth();
  const orgId = user?.user_metadata?.organization_id;
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, bySeverity: {}, recentActivity: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ severity: '', action: '', search: '' });
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const fetchLogs = async () => {
    if (!orgId) return;
    setLoading(true);
    const [logData, statData] = await Promise.all([
      getActivityLog(orgId, { limit: PAGE_SIZE, offset: page * PAGE_SIZE, severity: filter.severity || undefined }),
      getActivityStats(orgId),
    ]);
    setLogs(logData || []);
    setStats(statData);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [orgId, page, filter.severity]);

  const severityCounts = stats.bySeverity || {};
  const severities = [
    { key: 'critical', label: 'Critical', count: severityCounts.critical || 0 },
    { key: 'error', label: 'Error', count: severityCounts.error || 0 },
    { key: 'warning', label: 'Warning', count: severityCounts.warning || 0 },
    { key: 'info', label: 'Info', count: severityCounts.info || 0 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100"><Activity size={20} className="text-slate-600" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Audit Log</h1>
            <p className="text-xs text-slate-400">{stats.total} events · {stats.recentActivity} in last 30 days</p>
          </div>
        </div>
        <button onClick={fetchLogs} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {severities.map(s => {
          const cfg = SEVERITY_CONFIG[s.key] || SEVERITY_CONFIG.info;
          const Icon = cfg.icon;
          return (
            <button key={s.key} onClick={() => setFilter(prev => ({ ...prev, severity: prev.severity === s.key ? '' : s.key }))}
              className={`p-3 rounded-lg border text-left transition-all ${
                filter.severity === s.key ? `${cfg.bg} border-current ring-2 ring-current` : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={cfg.text} />
                <span className={`text-xs font-medium ${cfg.text}`}>{s.label}</span>
              </div>
              <p className="text-lg font-bold text-slate-900">{s.count}</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12"><Activity size={32} className="text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-500">No log entries yet</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map(log => {
              const cfg = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.info;
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className={`p-1.5 rounded-lg mt-0.5 ${cfg.bg}`}><Icon size={14} className={cfg.text} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{formatAction(log.action)}</p>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">{log.resource_type}{log.resource_id ? ` #${log.resource_id.slice(0, 8)}` : ''}</p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5">{JSON.stringify(log.details).slice(0, 120)}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-xs text-slate-500">{timeAgo(log.created_at)}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {stats.total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Page {page + 1} of {Math.ceil(stats.total / PAGE_SIZE)}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-all">Previous</button>
            <button disabled={(page + 1) * PAGE_SIZE >= stats.total} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-all">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
