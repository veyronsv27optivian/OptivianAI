/**
 * ─── AI Cache Manager — Admin UI (Item 63) ────────────────────────
 *
 * Shows cache statistics and allows admins to view/clear cached
 * AI responses.
 */

import { useState, useEffect } from 'react';
import { getCacheStats, clearCache } from '../../services/ai/aiService';
import { RefreshCw, Trash2, Database, AlertCircle, Check } from 'lucide-react';

export default function AiCacheManager() {
  const [stats, setStats] = useState({ size: 0, maxEntries: 0, oldestEntry: null, newestEntry: null });
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState('');

  const loadStats = () => {
    try {
      const s = getCacheStats();
      setStats(s);
    } catch (err) {
      setError('Failed to load cache stats');
    }
  };

  useEffect(() => { loadStats(); }, []);

  const handleClear = () => {
    setClearing(true);
    setError('');
    try {
      clearCache();
      setCleared(true);
      setTimeout(() => setCleared(false), 2000);
      loadStats();
    } catch (err) {
      setError(err.message || 'Failed to clear cache');
    } finally {
      setClearing(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleString();
  };

  const usagePercent = stats.maxEntries > 0
    ? Math.round((stats.size / stats.maxEntries) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Response Cache</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage cached AI responses. Clearing the cache forces fresh AI responses on next request.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:dark-card-metallic border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Database size={16} className="text-blue-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-text-secondary uppercase tracking-wider">Entries</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.size}</p>
          <p className="text-xs text-slate-400 dark:text-text-tertiary mt-1">of {stats.maxEntries} max</p>
        </div>

        <div className="bg-white dark:dark-card-metallic border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Database size={16} className="text-blue-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-text-secondary uppercase tracking-wider">Usage</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{usagePercent}%</p>
          <div className="mt-2 w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:dark-card-metallic border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw size={16} className="text-blue-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-text-secondary uppercase tracking-wider">Timeline</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <span className="text-slate-400">Oldest:</span> {formatTime(stats.oldestEntry)}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <span className="text-slate-400">Newest:</span> {formatTime(stats.newestEntry)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleClear}
          disabled={clearing || stats.size === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {clearing ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
          {clearing ? 'Clearing...' : cleared ? 'Cleared!' : 'Clear Cache'}
        </button>

        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm font-medium transition-all"
        >
          <RefreshCw size={16} />
          Refresh
        </button>

        {cleared && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <Check size={14} />
            Cache cleared successfully
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>How caching works:</strong> AI responses are cached based on provider + model + prompt + system prompt + settings.
          Identical requests within the TTL period (default: 5 minutes) return cached results instead of calling the AI provider,
          saving both time and token costs. Clearing the cache forces a fresh AI response on the next request.
        </p>
      </div>
    </div>
  );
}
