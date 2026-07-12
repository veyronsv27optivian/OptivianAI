import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Key, ArrowLeft, Eye, EyeOff, Check, Lock } from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { supabase } from '../../services/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, updatePassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // ── Update password state (for callback from Supabase) ──
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Check if we're in "update password" mode (redirected from email)
  const isUpdateMode = searchParams.get('type') === 'recovery' || window.location.hash.includes('type=recovery');

  useEffect(() => {
    if (isUpdateMode) {
      // Verify the session is valid (Supabase auto-refreshes with recovery token)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          setError('Invalid or expired password reset link. Please request a new one.');
        }
      });
    }
  }, [isUpdateMode]);

  const handleSendReset = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await updatePassword({
        password: newPassword,
        metadata: { temp_password: false },
      });
      if (error) throw error;
      setUpdateSuccess(true);
      setTimeout(() => navigate('/app'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Update Password View ──
  if (isUpdateMode || updateSuccess) {
    if (updateSuccess) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12">
          <div className="w-full max-w-md mx-4">
            <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-emerald-600 mb-4">
                <Check size={24} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Password Updated</h1>
              <p className="text-sm text-slate-500 mb-6">Your password has been successfully updated.</p>
              <p className="text-sm text-slate-400">Redirecting to your workspace...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-amber-600 mb-4">
                <Key size={24} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Set New Password</h1>
              <p className="text-sm text-slate-500">Choose a strong password for your account</p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pr-12 pl-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pr-12 pl-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 text-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Key size={18} />
                    Update Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Send Reset Email View ──
  if (sent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-emerald-600 mb-4">
              <Check size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">Check Your Email</h1>
            <p className="text-sm text-slate-500 mb-6">
              We've sent a password reset link to <strong>{email}</strong>. Click the link in the email to reset your password.
            </p>
            <button
              onClick={() => navigate('/onboarding/login')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12">
      <button
        onClick={() => navigate('/onboarding/login')}
        className="absolute top-8 left-8 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="font-medium">Back</span>
      </button>

      <div className="w-full max-w-md mx-4">
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-blue-600 mb-4">
              <Lock size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">Reset Password</h1>
            <p className="text-sm text-slate-500">Enter your email and we'll send you a reset link</p>
          </div>

          <form onSubmit={handleSendReset} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Remember your password?{' '}
            <Link to="/onboarding/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
