import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Globe, Link, ArrowLeft, ArrowRight, Check, Sparkles, Camera, MessageCircle, Send, Eye, EyeOff, SkipForward } from 'lucide-react';
import { useAuth } from '../../services/AuthContext';

const steps = [
  { id: 1, title: 'Admin Account', icon: User },
  { id: 2, title: 'Business Details', icon: Building2 },
  { id: 3, title: 'Platform Info', icon: Globe },
];

export default function CreateOrganization() {
  const navigate = useNavigate();
  const { signUp, createOrganization } = useAuth();
  const formRef = useRef(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    adminEmail: '',
    adminPassword: '',
    orgName: '',
    orgType: '',
    businessExplanation: '',
    website: '',
    socialInsta: '',
    socialTwitter: '',
    socialTelegram: '',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const canProceed = () => {
    if (step === 1) return formData.adminEmail.length > 0 && formData.adminEmail.includes('@') && formData.adminPassword.length >= 6;
    if (step === 2) return formData.orgName.length > 0 && formData.orgType.length > 0;
    return true;
  };

  const handleSkip = () => {
    setFormData(prev => ({
      ...prev,
      website: '',
      socialInsta: '',
      socialTwitter: '',
      socialTelegram: '',
    }));
    // Trigger form submit programmatically
    if (formRef.current) formRef.current.requestSubmit();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(s => s + 1);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Create the admin user
      const { data: authData, error: authError } = await signUp({
        email: formData.adminEmail,
        password: formData.adminPassword,
        role: 'admin',
      });

      if (authError) throw new Error(authError.message);

      // Use the user from the signUp response directly (avoids React state timing issues)
      const sessionUser = authData?.session?.user || authData?.user;

      // Step 2: Store organization details and create profile
      const { error: orgError } = await createOrganization({
        name: formData.orgName,
        type: formData.orgType,
        explanation: formData.businessExplanation,
        website: formData.website,
        instagram: formData.socialInsta,
        twitter: formData.socialTwitter,
        telegram: formData.socialTelegram,
      }, sessionUser);

      if (orgError) throw new Error(orgError.message);

      navigate('/app');
    } catch (err) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center py-12">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-[120px] animate-float-delayed" />
        <div className="absolute top-1/3 left-1/2 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] animate-float" />
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

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-2xl mx-4 animate-scale-in">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/25">
              <Building2 size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Organization</h1>
            <p className="text-slate-400">Set up your workspace in just a few steps</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-10">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isComplete = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                      isComplete
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25'
                        : isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25'
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      {isComplete ? (
                        <Check size={18} className="text-white" />
                      ) : (
                        <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500'} />
                      )}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${
                      isComplete ? 'text-emerald-400' : isActive ? 'text-white' : 'text-slate-500'
                    }`}>
                      {s.title}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-12 h-0.5 rounded-full transition-colors duration-300 ${
                      isComplete ? 'bg-emerald-500/50' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Step 1: Admin Account */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in-up">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => updateField('adminEmail', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                    placeholder="admin@company.com"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">You'll use this to sign in with your password</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Password</label>
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.adminPassword}
                      onChange={(e) => updateField('adminPassword', e.target.value)}
                      className="w-full pr-12 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">Minimum 6 characters for security</p>
                </div>
              </div>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Organization Name</label>
                    <input
                      type="text"
                      required
                      value={formData.orgName}
                      onChange={(e) => updateField('orgName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Organization Type</label>
                    <input
                      type="text"
                      required
                      value={formData.orgType}
                      onChange={(e) => updateField('orgType', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                      placeholder="e.g. Tech Startup"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Business Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.businessExplanation}
                    onChange={(e) => updateField('businessExplanation', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all resize-none"
                    placeholder="Briefly explain what your business does..."
                  />
                </div>
              </div>
            )}

            {/* Step 3: Platform Info */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">Optional — Fill in or skip</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Website URL</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Link size={16} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Camera size={14} className="text-pink-400" /> Instagram
                    </label>
                    <input
                      type="text"
                      value={formData.socialInsta}
                      onChange={(e) => updateField('socialInsta', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                      placeholder="@handle"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <MessageCircle size={14} className="text-blue-400" /> Twitter (X)
                    </label>
                    <input
                      type="text"
                      value={formData.socialTwitter}
                      onChange={(e) => updateField('socialTwitter', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                      placeholder="@handle"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Send size={14} className="text-sky-400" /> Telegram
                    </label>
                    <input
                      type="text"
                      value={formData.socialTelegram}
                      onChange={(e) => updateField('socialTelegram', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                      placeholder="@handle"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 pt-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all duration-200"
                >
                  <ArrowLeft size={18} />
                  Previous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/onboarding')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all duration-200"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
              )}

              {/* Skip button — only on step 3 */}
              {step === 3 && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold bg-white/5 border border-dashed border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 active:scale-[0.98] transition-all duration-200 text-sm"
                >
                  <SkipForward size={16} />
                  Skip
                </button>
              )}

              <button
                type="submit"
                disabled={!canProceed() || loading}
                className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-base"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : step < 3 ? (
                  <>
                    Continue
                    <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Complete Setup
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
