/**
 * ─── Sessions Page — Item 67 ──────────────────────────────────────
 *
 * Shows active user sessions and allows remote logout of other sessions.
 */

import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Globe, XCircle, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { supabase } from '../../services/supabase';

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revoking, setRevoking] = useState(null);

  const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;

  const loadSessions = async () => {
    if (!user || DEV_MODE) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setSessions(data || []);
    } catch (err) {
      setError('Could not load sessions. The user_sessions table may not be populated yet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, [user]);

  const handleRevoke = async (sessionId) => {
    setRevoking(sessionId);
    setError('');
    setSuccess('');

    try {
      // Sign out all other sessions via Supabase
      const { error: err } = await supabase.auth.signOut({ scope: 'others' });
      if (err) throw err;

      setSuccess('Other sessions have been terminated.');
      loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to revoke sessions');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevoking('all');
    setError('');
    setSuccess('');

    try {
      const { error: err } = await supabase.auth.signOut({ scope: 'global' });
      if (err) throw err;
      setSuccess('All sessions (including this one) will be terminated shortly.');
    } catch (err) {
      setError(err.message || 'Failed to revoke all sessions');
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <Monitor size={16} />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return <Smartphone size={16} />;
    return <Monitor size={16} />;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  if (DEV_MODE) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Active Sessions</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Session tracking is available in production mode with Supabase.
          </p>
        </div>
        <div className="p-8 text-center bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg">
          <Globe size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Dev Mode</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Connect to Supabase to view active sessions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Active Sessions</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your active login sessions. You can log out of sessions on other devices.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg">
          <Globe size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No active sessions found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Sessions will appear here once you sign in with Supabase.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {/* Header */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                <div className="sm:col-span-4">Device</div>
                <div className="sm:col-span-3">IP Address</div>
                <div className="sm:col-span-3">Last Active</div>
                <div className="sm:col-span-2 text-right">Action</div>
              </div>

              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors items-center"
                >
                  <div className="sm:col-span-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                      {getDeviceIcon(session.user_agent)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {session.user_agent?.split('/')[0]?.split(' ')[0] || 'Unknown device'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {session.user_agent?.slice(0, 50) || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {session.ip_address || '—'}
                    </p>
                  </div>

                  <div className="sm:col-span-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-xs">
                      {formatTime(session.last_active || session.created_at)}
                    </p>
                  </div>

                  <div className="sm:col-span-2 text-right">
                    <button
                      onClick={() => handleRevoke(session.id)}
                      disabled={revoking === session.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50 ml-auto"
                      title="Terminate this session"
                    >
                      {revoking === session.id ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : (
                        <XCircle size={12} />
                      )}
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revoke all button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={handleRevokeAll}
              disabled={revoking === 'all'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
            >
              {revoking === 'all' ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <XCircle size={14} />
              )}
              Sign Out of All Sessions
            </button>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>Note:</strong> Session data is available when using Supabase authentication.
              The current session displays your IP and device information. Revoking will invalidate
              the session tokens and force re-authentication.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
