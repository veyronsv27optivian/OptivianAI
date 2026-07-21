/**
 * ─── Session Timeout Modal (Item 66) ───────────────────────────
 * Warning modal shown when the user's session is about to expire
 * due to inactivity.
 */

import { Clock } from 'lucide-react';

export default function SessionTimeoutModal({ onExtend, onLogout }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md glass-panel dark:bg-surface-raised/95 rounded-2xl shadow-glass-xl overflow-hidden animate-fade-in-up">
        <div className="p-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <Clock size={28} className="text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-text-primary mb-2">
            Session Expiring Soon
          </h2>
          <p className="text-sm text-slate-600 dark:text-text-secondary mb-1">
            Your session will expire in less than 1 minute due to inactivity.
          </p>
          <p className="text-xs text-slate-500 dark:text-text-tertiary">
            Click "Stay Signed In" to continue your session.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-text-secondary bg-white/50 dark:bg-white/[0.04] border border-white/20 dark:border-white/[0.06] hover:bg-white/80 dark:hover:bg-white/[0.08] transition-all text-sm"
          >
            Sign Out
          </button>
          <button
            onClick={onExtend}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-gradient-premium hover:shadow-premium-lg transition-all text-sm shadow-glow-primary"
          >
            Stay Signed In
          </button>
        </div>
      </div>
    </div>
  );
}
