/**
 * AICacheManager — Phase 6 (#63)
 *
 * Admin page to view and manage cached AI responses.
 * Shows cache statistics, allows clearing entries, and pruning old data.
 *
 * Integrates with the existing AiCache system via aiService.
 */

import { useState, useEffect } from 'react';
import {
  Database, Trash2, RefreshCw, Clock, AlertTriangle,
  Layers, ChevronRight, Search, X, Zap,
} from 'lucide-react';
import { getCacheStats, clearCache } from '../../services/ai';

export default function AICacheManager({ onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const refresh = () => {
    setLoading(true);
    try {
      const s = getCacheStats();
      setStats(s);
    } catch (err) {
      console.error('Failed to get cache stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleClear = () => {
    setClearing(true);
    try {
      clearCache();
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
      refresh();
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setClearing(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const formatCount = (count) => {
    if (!count) return '0';
    return count.toLocaleString();
  };

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div className="p-2 rounded-lg bg-amber-50">
            <Database size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">AI Cache Manager</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">View and manage cached AI responses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleClear}
            disabled={clearing || (stats?.size === 0)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {clearing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Clear Cache
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* ── Clear confirmation ────────────────────────────── */}
        {cleared && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <Zap size={16} />
            Cache cleared successfully. All cached AI responses have been removed.
          </div>
        )}

        {/* ── Loading state ─────────────────────────────────── */}
        {loading && !stats && (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={24} className="text-blue-500 animate-spin" />
          </div>
        )}

        {/* ── Stats Grid ────────────────────────────────────── */}
        {stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon={Layers}
                label="Cached Entries"
                value={formatCount(stats.size)}
                sub={`Max: ${formatCount(stats.maxEntries)}`}
                color="blue"
              />
              <StatCard
                icon={Database}
                label="Cache Usage"
                value={`${formatCount(stats.size)} / ${formatCount(stats.maxEntries)}`}
                sub="entries stored"
                color="amber"
              />
              <StatCard
                icon={Clock}
                label="Oldest Entry"
                value={stats.oldestEntry ? formatDate(stats.oldestEntry) : 'Empty'}
                sub={stats.oldestEntry ? `${Math.round((Date.now() - stats.oldestEntry) / 60000)} min ago` : ''}
                color="purple"
              />
              <StatCard
                icon={Clock}
                label="Newest Entry"
                value={stats.newestEntry ? formatDate(stats.newestEntry) : 'Empty'}
                sub={stats.newestEntry ? `${Math.round((Date.now() - stats.newestEntry) / 60000)} min ago` : ''}
                color="emerald"
              />
            </div>

            {/* ── Usage gauge ───────────────────────────────── */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Cache Capacity</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>{formatCount(stats.size)} entries used</span>
                  <span>{formatCount(stats.maxEntries)} max entries</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stats.size / stats.maxEntries > 0.8
                        ? 'bg-red-500'
                        : stats.size / stats.maxEntries > 0.5
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min((stats.size / stats.maxEntries) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {stats.size === 0
                    ? 'Cache is empty. Run some AI analyses to populate it.'
                    : stats.size / stats.maxEntries > 0.8
                      ? '⚠️ Cache is nearly full. Consider clearing or increasing max entries.'
                      : 'Cache has available capacity.'}
                </p>
              </div>
            </div>

            {/* ── Info Panel ────────────────────────────────── */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                About AI Caching
              </h3>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p>
                  AI responses are cached to reduce latency and API costs. Identical prompts
                  within the cache TTL (default: 5 minutes) will return cached results instead of
                  calling the AI provider.
                </p>
                <p>
                  <strong>When to clear the cache:</strong>
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>After updating system prompts or tool configurations</li>
                  <li>When testing prompt changes and need fresh responses</li>
                  <li>If cache entries are consuming too much localStorage space</li>
                </ul>
                <p className="mt-2 text-amber-600">
                  ⚠️ Clearing the cache is irreversible. Cached responses will need to be
                  re-fetched from the AI provider.
                </p>
              </div>
            </div>

            {/* ── Empty state ────────────────────────────────── */}
            {stats.size === 0 && (
              <div className="text-center py-8">
                <Database size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Cache is empty</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cached entries will appear here after you run AI analyses.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Stat Card Component ──────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="p-4 rounded-lg bg-white border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-md ${colorMap[color] || colorMap.blue}`}>
          <Icon size={14} />
        </div>
        <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-800 truncate" title={value}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
