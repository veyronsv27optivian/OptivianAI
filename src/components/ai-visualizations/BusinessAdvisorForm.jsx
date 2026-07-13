import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Building2, Users, Target, TrendingUp, AlertCircle, Send, X } from 'lucide-react';

const INDUSTRIES = [
  'Technology / SaaS', 'E-commerce / Retail', 'Healthcare', 'Finance / Fintech',
  'Education', 'Manufacturing', 'Real Estate', 'Hospitality',
  'Consulting', 'Media / Entertainment', 'Non-profit', 'Other',
];

const COMPANY_SIZES = [
  { value: 'solo', label: 'Solo (1)', icon: '👤' },
  { value: 'startup', label: 'Startup (2-10)', icon: '🚀' },
  { value: 'small', label: 'Small (11-50)', icon: '🏢' },
  { value: 'medium', label: 'Medium (51-200)', icon: '🏛️' },
  { value: 'large', label: 'Large (200+)', icon: '🌆' },
];

const STAGES = [
  { value: 'idea', label: 'Idea / Concept', icon: '💡' },
  { value: 'mvp', label: 'MVP / Early', icon: '🔧' },
  { value: 'growth', label: 'Growth Stage', icon: '📈' },
  { value: 'established', label: 'Established', icon: '🏆' },
  { value: 'enterprise', label: 'Enterprise', icon: '🏰' },
];

export default function BusinessAdvisorForm({ onSubmit, onClose, initialData }) {
  const [formData, setFormData] = useState({
    businessContext: initialData?.businessContext || '',
    challenge: initialData?.challenge || '',
    industry: initialData?.industry || '',
    companySize: initialData?.companySize || '',
    stage: initialData?.stage || '',
    goals: initialData?.goals || '',
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.businessContext.trim()) newErrors.businessContext = 'Describe your business';
    if (!formData.challenge.trim()) newErrors.challenge = 'What challenge are you facing?';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Build a comprehensive prompt from the form data
    const contextParts = [formData.businessContext];
    if (formData.industry) contextParts.push(`Industry: ${formData.industry}`);
    if (formData.companySize) {
      const size = COMPANY_SIZES.find(s => s.value === formData.companySize);
      if (size) contextParts.push(`Company Size: ${size.label}`);
    }
    if (formData.stage) {
      const stage = STAGES.find(s => s.value === formData.stage);
      if (stage) contextParts.push(`Stage: ${stage.label}`);
    }
    if (formData.goals) contextParts.push(`Goals: ${formData.goals}`);

    onSubmit({
      businessContext: contextParts.join('\n'),
      challenge: formData.challenge,
      industry: formData.industry,
      goals: formData.goals,
    });
  };

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100">
            <Brain size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Business Advisor</h3>
            <p className="text-xs text-slate-500">Fill in the details below for tailored advice</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                step === s ? 'bg-blue-600 text-white shadow-sm' :
                s < step ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {s}
            </button>
          ))}
          <span className="text-[10px] text-slate-400 ml-1">
            Step {step} of 3
          </span>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1.5">
                  <Building2 size={12} className="text-slate-400" />
                  Business Context
                </label>
                <textarea
                  value={formData.businessContext}
                  onChange={(e) => updateField('businessContext', e.target.value)}
                  placeholder="Describe your business, what you do, your target market..."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all ${
                    errors.businessContext ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {errors.businessContext && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {errors.businessContext}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="ml-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Industry & Size */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1.5">
                  <TrendingUp size={12} className="text-slate-400" />
                  Industry
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {INDUSTRIES.slice(0, 6).map(ind => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => updateField('industry', ind)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] text-left border transition-all ${
                        formData.industry === ind
                          ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1.5">
                  <Users size={12} className="text-slate-400" />
                  Company Size
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMPANY_SIZES.map(size => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => updateField('companySize', size.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] border transition-all ${
                        formData.companySize === size.value
                          ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {size.icon} {size.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="ml-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Challenge & Goals */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1.5">
                  <Target size={12} className="text-slate-400" />
                  Business Stage
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map(stage => (
                    <button
                      key={stage.value}
                      type="button"
                      onClick={() => updateField('stage', stage.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] border transition-all ${
                        formData.stage === stage.value
                          ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {stage.icon} {stage.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1.5">
                  <AlertCircle size={12} className="text-slate-400" />
                  Your Challenge / Question *
                </label>
                <textarea
                  value={formData.challenge}
                  onChange={(e) => updateField('challenge', e.target.value)}
                  placeholder="What specific challenge are you facing? E.g., How to increase customer retention, enter a new market, reduce churn..."
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all ${
                    errors.challenge ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {errors.challenge && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {errors.challenge}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1.5">
                  <Target size={12} className="text-slate-400" />
                  Business Goals (optional)
                </label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => updateField('goals', e.target.value)}
                  placeholder="Your key business goals and objectives..."
                  rows={1}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="ml-auto flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all shadow-sm"
                >
                  <Send size={12} />
                  Get Advice
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
