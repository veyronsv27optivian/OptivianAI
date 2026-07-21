import { useState, useEffect } from 'react';
import {
  Shield, ShieldCheck, Mail, Check, AlertCircle,
  Smartphone, KeyRound,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { isEmailMfaEnabled, toggleEmailMfa } from '../../services/emailOtpService';

export default function MfaSetup() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.id) {
      isEmailMfaEnabled(user.id).then(setEnabled).finally(() => setLoading(false));
    }
  }, [user?.id]);

  const handleToggle = async () => {
    if (!user?.id) return;
    setToggling(true);
    setError('');
    setSuccess('');

    try {
      const result = await toggleEmailMfa(user.id, !enabled);
      if (result.error) throw new Error(result.error);
      setEnabled(!enabled);
      setSuccess(enabled
        ? 'Two-factor authentication has been disabled.'
        : 'Two-factor authentication is now enabled. You\'ll receive a verification code via email on your next login.'
      );
    } catch (err) {
      setError(err.message || 'Failed to update 2FA settings');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Two-Factor Authentication (2FA)</h2>
        <p className="text-sm text-slate-500 mt-1">
          Add an extra layer of security to your account. A verification code will be sent to your email each time you sign in.
        </p>
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-4 p-5 rounded-lg border ${
        enabled
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-slate-50 border-slate-200'
      }`}>
        {enabled ? (
          <ShieldCheck size={28} className="text-emerald-600 shrink-0" />
        ) : (
          <Shield size={28} className="text-slate-500 dark:text-slate-400 shrink-0" />
        )}
        <div className="flex-1">
          <p className={`text-sm font-medium ${enabled ? 'text-emerald-800' : 'text-slate-700'}`}>
            {enabled ? 'Email 2FA is active' : 'Email 2FA is not set up'}
          </p>
          <p className={`text-xs mt-1 ${enabled ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`}>
            {enabled
              ? 'You\'ll receive a 6-digit code via email on every sign-in.'
              : 'No additional app needed — codes arrive in your inbox.'}
          </p>
        </div>

        {/* Toggle switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            disabled={toggling}
            className="sr-only peer"
          />
          <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
            enabled
              ? 'bg-emerald-600'
              : 'bg-slate-300'
          } ${toggling ? 'opacity-50' : ''}`} />
        </label>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      {/* How it works */}
      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        <div className="flex items-start gap-4 p-5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Mail size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Code sent to your email</p>
            <p className="text-xs text-slate-500 mt-0.5">
              After signing in with your password, a 6-digit code is sent to <strong>{user?.email}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <KeyRound size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Enter the code</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter the code on the verification screen to complete your sign-in
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">No extra app needed</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Unlike traditional 2FA, you don't need to install an authenticator app. Everything works through your email.
            </p>
          </div>
        </div>
      </div>

      {/* Email info */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <Smartphone size={18} className="text-amber-600 shrink-0" />
        <p className="text-xs text-amber-700">
          Make sure you have access to <strong>{user?.email}</strong> to receive verification codes.
          Update your email in Profile settings if needed.
        </p>
      </div>
    </div>
  );
}
