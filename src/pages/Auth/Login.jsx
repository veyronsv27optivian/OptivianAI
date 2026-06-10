import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ArrowLeft, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../../services/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, updatePassword } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await signIn({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;

      // Check if user has a temp password and needs to change it
      if (data?.user?.user_metadata?.temp_password) {
        setNeedsPasswordChange(true);
      } else {
        navigate('/app');
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await updatePassword({
        password: newPassword,
        metadata: { temp_password: false },
      });

      if (error) throw error;
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  // If user needs to change password after temp password login
  if (needsPasswordChange) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-orange-500/15 rounded-full blur-[120px] animate-float-delayed" />
          <div className="absolute top-1/3 left-1/2 w-[300px] h-[300px] bg-amber-400/10 rounded-full blur-[100px] animate-float" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 w-full max-w-md mx-4 animate-scale-in">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg shadow-amber-500/25">
                <KeyRound size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Change Password</h1>
              <p className="text-slate-400">Set a new password to secure your account</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 animate-fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                <div className="relative group">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all"
                    placeholder="Choose a strong password (min 6 chars)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || newPassword.length < 6}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Update & Continue
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-[120px] animate-float-delayed" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[100px] animate-float" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Back button */}
      <button
        onClick={() => navigate('/onboarding')}
        className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 z-10"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-scale-in">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/25">
              <Lock size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Sign In</h1>
            <p className="text-slate-400">Use your email and password to access your workspace</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors duration-200" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all duration-200"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors duration-200" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-slate-500">
            New here?{' '}
            <button
              onClick={() => navigate('/onboarding/create')}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Create an organization
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
