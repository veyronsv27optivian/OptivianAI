import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Check, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../services/AuthContext';

export default function CreateOrganization() {
  const navigate = useNavigate();
  const { signUp, createOrganization } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    orgName: '',
    orgType: '',
    businessExplanation: '',
    website: '',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const canProceed = () => {
    if (step === 1) return formData.adminEmail.length > 0 && formData.adminEmail.includes('@') && formData.adminPassword.length >= 6 && formData.adminName.length > 0;
    if (step === 2) return formData.orgName.length > 0 && formData.orgType.length > 0;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 2) {
      setStep(s => s + 1);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use 'staff' role for signup so the DB trigger creates the profile
      // successfully (the original CHECK constraint only allows 'staff', 'admin', 'manager').
      // The createOrganization call below will upgrade the role to 'administrator'.
      const { data: authData, error: authError } = await signUp({
        email: formData.adminEmail,
        password: formData.adminPassword,
        name: formData.adminName,
        role: 'staff',
      });

      if (authError) throw new Error(authError.message);

      const sessionUser = authData?.session?.user || authData?.user;

      const { error: orgError } = await createOrganization({
        name: formData.orgName,
        type: formData.orgType,
        explanation: formData.businessExplanation,
        website: formData.website,
      }, sessionUser);

      if (orgError) throw new Error(orgError.message);

      // Mark this user as the org creator so only they see the Getting Started checklist
      localStorage.setItem('optivian_org_creator', sessionUser.id);
      localStorage.removeItem('optivian_setup_dismissed');
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
            <p className="text-sm text-slate-500">Set up your workspace. You'll be the owner.</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  step > s
                    ? 'bg-emerald-600 text-white'
                    : step === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {step > s ? <Check size={16} /> : s}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${
                  step === s ? 'text-slate-900' : 'text-slate-500'
                }`}>
                  {s === 1 ? 'Your Account' : 'Organization'}
                </span>
                {s < 2 && <div className={`w-10 h-0.5 rounded-full ${step > s ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.adminName}
                    onChange={(e) => updateField('adminName', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    placeholder="John Doe"
                  />
                </div>
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
                  <p className="mt-1.5 text-xs text-slate-500">You'll use this to sign in</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={formData.adminPassword}
                      onChange={(e) => updateField('adminPassword', e.target.value)}
                      className="w-full pr-12 pl-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                <div className="pt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Website (optional)</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all text-sm"
                >
                  <ArrowLeft size={18} />
                  Previous
                </button>
              )}

              <button
                type="submit"
                disabled={!canProceed() || loading}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                  step === 1 ? 'w-full' : 'flex-[2]'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : step === 1 ? (
                  <>
                    Continue
                    <ArrowRight size={18} />
                  </>
                ) : (
                  'Create Organization'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
