import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Globe, ArrowLeft, ArrowRight, Check, Camera, MessageCircle, Send, Eye, EyeOff } from 'lucide-react';
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
      const { data: authData, error: authError } = await signUp({
        email: formData.adminEmail,
        password: formData.adminPassword,
        role: 'admin',
      });

      if (authError) throw new Error(authError.message);

      const sessionUser = authData?.session?.user || authData?.user;

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12">
      <button
        onClick={() => navigate('/onboarding')}
        className="absolute top-8 left-8 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="font-medium">Back</span>
      </button>

      <div className="w-full max-w-2xl mx-4">
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-blue-600 mb-4">
              <Building2 size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">Create Organization</h1>
            <p className="text-sm text-slate-500">Set up your workspace in just a few steps</p>
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
                    <div className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 ${
                      isComplete
                        ? 'bg-emerald-600'
                        : isActive
                        ? 'bg-blue-600'
                        : 'bg-slate-100 border border-slate-300'
                    }`}>
                      {isComplete ? (
                        <Check size={16} className="text-white" />
                      ) : (
                        <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                      )}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${
                      isComplete ? 'text-emerald-700' : isActive ? 'text-slate-900 font-semibold' : 'text-slate-500'
                    }`}>
                      {s.title}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-12 h-0.5 rounded-full transition-colors duration-300 ${
                      isComplete ? 'bg-emerald-300' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Step 1: Admin Account */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => updateField('adminEmail', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    placeholder="admin@company.com"
                  />
                  <p className="mt-1.5 text-xs text-slate-500">You'll use this to sign in with your password</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Admin Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.adminPassword}
                      onChange={(e) => updateField('adminPassword', e.target.value)}
                      className="w-full pr-12 pl-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Organization Name</label>
                    <input
                      type="text"
                      required
                      value={formData.orgName}
                      onChange={(e) => updateField('orgName', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Organization Type</label>
                    <input
                      type="text"
                      required
                      value={formData.orgType}
                      onChange={(e) => updateField('orgType', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      placeholder="e.g. Tech Startup"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.businessExplanation}
                    onChange={(e) => updateField('businessExplanation', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm"
                    placeholder="Briefly explain what your business does..."
                  />
                </div>
              </div>
            )}

            {/* Step 3: Platform Info */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-500 font-medium uppercase">Optional</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Website URL</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Camera size={14} className="text-pink-500" /> Instagram
                    </label>
                    <input
                      type="text"
                      value={formData.socialInsta}
                      onChange={(e) => updateField('socialInsta', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      placeholder="@handle"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <MessageCircle size={14} className="text-sky-500" /> Twitter (X)
                    </label>
                    <input
                      type="text"
                        value={formData.socialTwitter}
                        onChange={(e) => updateField('socialTwitter', e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      placeholder="@handle"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Send size={14} className="text-blue-500" /> Telegram
                    </label>
                    <input
                      type="text"
                      value={formData.socialTelegram}
                      onChange={(e) => updateField('socialTelegram', e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
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
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 transition-all text-sm"
                >
                  <ArrowLeft size={18} />
                  Previous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/onboarding')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 transition-all text-sm"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
              )}

              <button
                type="submit"
                disabled={!canProceed() || loading}
                className="flex-[2] flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : step < 3 ? (
                  <>
                    Continue
                    <ArrowRight size={18} />
                  </>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
