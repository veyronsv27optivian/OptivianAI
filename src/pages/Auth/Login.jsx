import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { isEmailMfaEnabled } from '../../services/emailOtpService';
import { isDeviceTrusted } from '../../services/deviceFingerprint';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, updatePassword, signInWithOAuth, rememberMe, setRememberMe } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  const handleOAuth = async (provider) => {
    setError('');
    setIsLoading(true);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) throw error;
      // OAuth redirects the browser — no need to navigate
    } catch (err) {
      setError(err.message || `Failed to sign in with ${provider}`);
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { data, error } = await signIn({ email: formData.email, password: formData.password });
      console.log('[Login] signIn result:', { data, error });
      
      if (error) throw error;
      
      if (data?.user?.user_metadata?.temp_password) {
        console.log('[Login] User needs to change temp password');
        setNeedsPasswordChange(true);
        return;
      }

      // Check MFA status — skip if already verified within the last 24h
      const userId = data?.user?.id;
      const mfaCacheKey = `optivian_mfa_verified_${userId}`;
      let mfaRecentlyVerified = false;
      try {
        const cached = JSON.parse(localStorage.getItem(mfaCacheKey) || '{}');
        mfaRecentlyVerified = cached.expiresAt && Date.now() < cached.expiresAt;
      } catch {}

      if (!mfaRecentlyVerified) {
        const mfaEnabled = await isEmailMfaEnabled(userId);
        if (mfaEnabled) {
          // Item 69: Check if this device is trusted (fingerprint match)
          const deviceTrusted = await isDeviceTrusted(userId);
          if (!deviceTrusted) {
            console.log('[Login] Navigating to MFA verify');
            navigate('/onboarding/mfa-verify', { replace: true });
            return;
          }
        }
      }
      
      console.log('[Login] Navigating to /app');
      navigate('/app');
    } catch (err) {
      console.error('[Login] Error caught:', err);
      setError(err.message || 'Failed to login');
    } finally { setIsLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { data, error } = await updatePassword({ password: newPassword, metadata: { temp_password: false } });
      if (error) throw error;
      const mfaEnabled = await isEmailMfaEnabled(data?.user?.id);
      if (mfaEnabled) {
        // Item 69: Check if this device is trusted
        const deviceTrusted = await isDeviceTrusted(data?.user?.id);
        if (!deviceTrusted) {
          navigate('/onboarding/mfa-verify', { replace: true });
          return;
        }
      }
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally { setIsLoading(false); }
  };

  if (needsPasswordChange) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center py-12 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="w-full max-w-md mx-4 relative z-10">
          <div className="glass dark:glass-dark rounded-2xl p-8 shadow-glass-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg mb-4">
                <KeyRound size={28} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground dark:text-slate-100 mb-1">Change Password</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Set a new password to secure your account</p>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showNewPassword ? 'text' : 'password'} required minLength={6} maxLength={128}
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pr-12 pl-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                    placeholder="Choose a strong password (min 6 chars)" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading || newPassword.length < 6}
                className="btn-apple w-full disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
                ) : ('Update & Continue')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center py-12 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />

      <button onClick={() => navigate('/onboarding')}
        className="absolute top-8 left-8 flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5 transition-all z-10">
        <ArrowLeft size={18} />
        <span className="font-medium">Back</span>
      </button>

      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="glass dark:glass-dark rounded-2xl p-8 shadow-glass-lg animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-premium shadow-premium-lg mb-4">
              <Lock size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground dark:text-slate-100 mb-1">Sign In</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Use your email and password or continue with a provider</p>
          </div>

          {/* OAuth Buttons Removed as requested */}

          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-slate-400" />
                  </div>
                  <input type="email" required value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                    placeholder="you@company.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <input type={showPassword ? 'text' : 'password'} required maxLength={128}
                    value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-11 pr-12 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                    placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
              </label>
              <Link to="/onboarding/reset-password"
                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="btn-apple w-full disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : ('Sign In')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            New here?{' '}
            <Link to="/onboarding/signup" className="text-primary hover:text-primary-dark font-medium transition-colors">Create an account</Link>
            {' '}or{' '}
            <Link to="/onboarding/create" className="text-primary hover:text-primary-dark font-medium transition-colors">create an organization</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
