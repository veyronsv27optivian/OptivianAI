import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User } from 'lucide-react';
import { useAuth } from '../../services/AuthContext';

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, signInWithOAuth } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      const { error } = await signUp({ email: formData.email, password: formData.password, name: formData.name });
      if (error) throw error;
      setSuccessMessage('Account created! Redirecting to setup...');
      setTimeout(() => navigate('/onboarding/premium'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally { setIsLoading(false); }
  };

  const handleOAuth = async (provider) => {
    setError('');
    setIsLoading(true);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Failed to sign in with ' + provider);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center py-12 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />

      <button onClick={() => navigate('/onboarding')}
        className="absolute top-8 left-8 flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5 transition-all z-10">
        <ArrowLeft size={18} />
        <span className="font-medium">Back</span>
      </button>

      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="glass dark:glass-dark rounded-2xl p-8 shadow-glass-lg animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-premium shadow-premium-lg mb-4">
              <Mail size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground dark:text-slate-100 mb-1">Create Account</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Join OptivianAI and start your journey</p>
          </div>

          {/* OAuth Buttons Removed as requested */}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                placeholder="you@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required minLength={6} maxLength={128}
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pr-12 pl-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                  placeholder="At least 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} required minLength={6} maxLength={128}
                  value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pr-12 pl-4 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                  placeholder="Re-enter password" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">{successMessage}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading || formData.password !== formData.confirmPassword}
              className="btn-apple w-full disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
              ) : ('Create Account')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/onboarding/login" className="text-primary hover:text-primary-dark font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
