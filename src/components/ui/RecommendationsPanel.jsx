/**
 * ─── RecommendationsPanel — Phase C4 ──────────────────────────────
 *
 * Displays proactive AI recommendations and health scores from the
 * monitoring engine. Users can view, dismiss, or act on recommendations.
 */

import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, AlertTriangle, X, ChevronRight, TrendingUp, RefreshCw, Activity } from 'lucide-react';
import { monitoringEngine } from '../../services/ai/actions/monitoring';
import { useAuth } from '../../services/AuthContext';

const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm', border: 'border-red-200 dark:border-red-800/30', text: 'text-red-700 dark:text-red-300', icon: 'text-red-500 dark:text-red-400' },
  high: { bg: 'bg-orange-50/80 dark:bg-orange-900/20 backdrop-blur-sm', border: 'border-orange-200 dark:border-orange-800/30', text: 'text-orange-700 dark:text-orange-300', icon: 'text-orange-500 dark:text-orange-400' },
  medium: { bg: 'bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm', border: 'border-amber-200 dark:border-amber-800/30', text: 'text-amber-700 dark:text-amber-300', icon: 'text-amber-500 dark:text-amber-400' },
  low: { bg: 'bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm', border: 'border-blue-200 dark:border-blue-800/30', text: 'text-blue-700 dark:text-blue-300', icon: 'text-blue-500 dark:text-blue-400' },
};

export default function RecommendationsPanel({ compact = false }) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [healthScore, setHealthScore] = useState(null); // null = not yet computed
  const [dismissed, setDismissed] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = await monitoringEngine.runOnce(user);
    setRecommendations(result.recommendations || []);
    // Only set health score if real data was processed
    setHealthScore(result.results?.length > 0 ? (result.healthScore ?? null) : null);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const visibleRecs = recommendations.filter(r => !dismissed.has(`${r.type}-${r.message}`));

  if (compact) {
    return (
      <button
        onClick={refresh}
        className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card dark:bg-surface-raised/60 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-sm"
        title="Refresh health check"
      >
        <Activity size={16} className={healthScore === null ? 'text-slate-400' : healthScore < 50 ? 'text-red-400' : healthScore < 80 ? 'text-amber-400' : 'text-emerald-400'} />
        <span className="text-xs font-medium text-slate-600 dark:text-text-secondary">
          {healthScore !== null ? `Health: ${healthScore}%` : 'Health: —'}
        </span>
        {visibleRecs.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 text-[10px] font-bold text-amber-700 dark:text-amber-300">
            {visibleRecs.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Health Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className={healthScore === null ? 'text-slate-400' : healthScore < 50 ? 'text-red-400' : healthScore < 80 ? 'text-amber-400' : 'text-emerald-400'} />
          <span className="text-sm font-medium text-slate-700 dark:text-text-primary">Organization Health</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${healthScore === null ? 'text-slate-400' : healthScore < 50 ? 'text-red-400' : healthScore < 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {healthScore !== null ? `${healthScore}%` : '—'}
          </span>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1 rounded text-slate-400 dark:text-text-tertiary hover:text-slate-600 dark:hover:text-text-primary transition-all"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Health bar */}
      <div className="w-full h-2 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            healthScore === null ? 'bg-slate-300 dark:bg-slate-600' : healthScore < 50 ? 'bg-red-500' : healthScore < 80 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: healthScore !== null ? `${healthScore}%` : '0%' }}
        />
      </div>

      {/* Recommendations */}
      {visibleRecs.length === 0 ? (
        <div className="p-4 text-center">
          <Lightbulb size={24} className="text-slate-300 dark:text-text-tertiary/40 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-text-secondary">No recommendations right now</p>
          <p className="text-xs text-slate-400 dark:text-text-tertiary mt-1">Everything looks good!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleRecs.map((rec, idx) => {
            const colors = SEVERITY_COLORS[rec.severity] || SEVERITY_COLORS.medium;
            const key = `${rec.type}-${rec.message}`;
            return (
              <div
                key={key}
                className={`flex items-start gap-3 p-3 rounded-lg border ${colors.bg} ${colors.border} transition-all`}
              >
                <AlertTriangle size={16} className={`shrink-0 mt-0.5 ${colors.icon}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${colors.text}`}>{rec.message}</p>
                  {rec.details?.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {rec.details.slice(0, 3).map((d, i) => (
                        <li key={i} className="text-xs text-slate-500 dark:text-text-secondary truncate">
                          • {d.title}
                        </li>
                      ))}
                    </ul>
                  )}
                  {rec.action && (
                    <button
                      onClick={() => {
                        if (rec.actionType === 'navigate' && rec.actionTarget) {
                          window.location.hash = rec.actionTarget;
                        }
                      }}
                      className="mt-1.5 flex items-center gap-1 text-xs font-medium text-primary dark:text-primary-light hover:text-primary-dark transition-all"
                    >
                      <ChevronRight size={12} />
                      {rec.action}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setDismissed(prev => new Set([...prev, key]))}
                  className="p-0.5 rounded text-slate-400 dark:text-text-tertiary hover:text-slate-600 dark:hover:text-text-primary transition-all shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
