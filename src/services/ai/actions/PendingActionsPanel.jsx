/**
 * PendingActionsPanel — Phase B2/B4
 *
 * UI component that displays AI-proposed actions awaiting user approval.
 * Users can approve, reject, or dismiss each proposed action.
 *
 * This panel is rendered within the AI tool view and the main layout
 * to provide visibility into pending actions from any page.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, EyeOff, Clock,
  Zap, User, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import {
  getPendingIntents,
  approveAndExecute,
  rejectAction,
  dismissAction,
  getExecutionLog,
} from './executionEngine';
import { useAuth } from '../../AuthContext';

const SAFETY_COLORS = {
  low: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
};

export default function PendingActionsPanel({ onActionComplete, compact = false }) {
  const { user } = useAuth();
  const [pendingActions, setPendingActions] = useState([]);
  const [executing, setExecuting] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Refresh pending actions every 5 seconds
  const refresh = useCallback(() => {
    if (!user?.id) return;
    const actions = getPendingIntents(user.id);
    setPendingActions(actions);
  }, [user?.id]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleApprove = async (intentId) => {
    setExecuting(intentId);
    const result = await approveAndExecute(intentId, user);
    setExecuting(null);
    if (result.success) {
      refresh();
      onActionComplete?.({ type: 'approved', intentId, result: result.data });
    }
  };

  const handleReject = (intentId) => {
    rejectAction(intentId, 'Rejected by user');
    refresh();
    onActionComplete?.({ type: 'rejected', intentId });
  };

  const handleDismiss = (intentId) => {
    dismissAction(intentId);
    refresh();
    onActionComplete?.({ type: 'dismissed', intentId });
  };

  if (pendingActions.length === 0 && !expanded) return null;

  if (compact && pendingActions.length === 0) return null;

  // ── Compact badge mode ──────────────────────────────────────
  if (compact) {
    return (
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-all"
      >
        <Zap size={14} />
        <span>{pendingActions.length} pending</span>
        {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>
    );
  }

  // ── Full panel mode ─────────────────────────────────────────
  return (
    <div className="space-y-2">
      {pendingActions.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              {pendingActions.length} AI action{pendingActions.length > 1 ? 's' : ''} awaiting approval
            </span>
          </div>
          <span className="text-[10px] text-amber-500">Click to review</span>
        </div>
      )}

      {pendingActions.map((action) => {
        const colors = SAFETY_COLORS[action.safetyLevel] || SAFETY_COLORS.medium;
        return (
          <div
            key={action.id}
            className={`rounded-lg border ${colors.border} ${colors.bg} p-4 transition-all`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                    {action.safetyLevel}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {action.confidence} confidence
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-800">{action.label}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{action.description}</p>

                {/* Params preview */}
                {Object.keys(action.params).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(action.params).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 border border-slate-200 text-slate-600"
                      >
                        {key}: {String(value).slice(0, 30)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(action.proposedAt).toLocaleTimeString()}
                  </span>
                  {action.proposedByEmail && (
                    <span className="flex items-center gap-1">
                      <User size={10} />
                      {action.proposedByEmail}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleApprove(action.id)}
                  disabled={executing === action.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {executing === action.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle size={14} />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleReject(action.id)}
                  disabled={executing === action.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  <XCircle size={14} />
                  Reject
                </button>
                <button
                  onClick={() => handleDismiss(action.id)}
                  disabled={executing === action.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-all"
                  title="Dismiss"
                >
                  <EyeOff size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
