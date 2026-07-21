/**
 * ─── Premium Onboarding Flow ────────────────────────────────────
 * Beautiful 3-step onboarding for newly registered users.
 * Step 1: Welcome screen
 * Step 2: Profile form with personal details
 * Step 3: Role selection via animated popup
 * Saves data to Supabase and redirects to role-based dashboard.
 */

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, ArrowLeft, Check, User, Mail, Phone,
  Camera, Building2, Globe, Clock, Hash, Users, Shield,
  ChevronRight, Loader2, BarChart3,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import RolePickerModal, { getRoleIcon } from '../../components/ui/RolePickerModal';

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
  'Australia', 'Japan', 'India', 'Brazil', 'Singapore',
  'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland',
  'Spain', 'Italy', 'South Korea', 'New Zealand', 'UAE',
];

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
  'Australia/Sydney', 'Pacific/Auckland', 'UTC',
];

const DEPARTMENTS = [
  'Executive', 'Engineering', 'Design', 'Marketing', 'Sales',
  'Finance', 'Human Resources', 'Operations', 'Customer Support',
  'Product', 'Data', 'Legal', 'Other',
];

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'profile', title: 'Your Profile', icon: User },
  { id: 'role', title: 'Your Role', icon: Shield },
];

export default function PremiumOnboarding() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, isDevMode } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: profile?.full_name || user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: '',
    organizationName: user?.user_metadata?.organization_name || '',
    department: '',
    employeeId: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    avatarUrl: profile?.avatar_url || '',
  });

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAvatarUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateField('avatarUrl', ev.target?.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [updateField]);

  const handleRoleSelect = useCallback((role) => {
    setSelectedRole(role);
  }, []);

  const canProceed = useCallback(() => {
    if (currentStep === 0) return true;
    if (currentStep === 1) return formData.fullName.trim().length > 0 && formData.email.trim().length > 0;
    if (currentStep === 2) return selectedRole !== null;
    return true;
  }, [currentStep, formData, selectedRole]);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
      // Auto-open role picker on step 3
      if (currentStep === 1) {
        setTimeout(() => setShowRolePicker(true), 400);
      }
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      // Map onboarding role ID to our system role ID
      const ONBOARDING_ROLE_MAP = {
        ceo: 'administrator', coo: 'director', cfo: 'finance', cto: 'administrator',
        hr_manager: 'hr', operations_manager: 'operations',
        project_manager: 'manager', department_manager: 'manager',
        team_lead: 'team_lead', senior_developer: 'developer',
        developer: 'developer', ui_ux_designer: 'designer',
        marketing_executive: 'marketing', sales_executive: 'sales',
        finance_executive: 'finance', business_analyst: 'staff',
        data_analyst: 'staff', customer_support: 'support',
        employee: 'staff', intern: 'intern', administrator: 'administrator',
        custom: 'staff',
      };
      const roleId = ONBOARDING_ROLE_MAP[selectedRole?.id] || 'staff';

      // Save profile updates
      const profileUpdates = {
        full_name: formData.fullName,
        phone: formData.phone,
        avatar_url: formData.avatarUrl,
        role: roleId,
        ...(formData.organizationName ? { organization_name: formData.organizationName } : {}),
      };

      const { error } = await updateProfile(profileUpdates);

      if (error) {
        console.error('Failed to save onboarding data:', error);
      }

      // Navigate to dashboard
      navigate('/app');
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  }, [formData, selectedRole, updateProfile, navigate]);

  const handleSkip = useCallback(() => {
    navigate('/app');
  }, [navigate]);

  const step = STEPS[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all"
      >
        Skip for now
      </button>

      <div className="w-full max-w-2xl mx-auto relative z-10">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <motion.div
                animate={{
                  scale: i === currentStep ? 1.1 : 1,
                  backgroundColor: i <= currentStep ? 'var(--step-color, #6366F1)' : undefined,
                }}
                className={`flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold transition-all duration-300 ${
                  i < currentStep
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : i === currentStep
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/20'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {i < currentStep ? <Check size={16} /> : i + 1}
              </motion.div>
              <span className={`text-sm font-medium hidden sm:block transition-colors ${
                i === currentStep
                  ? 'text-slate-900 dark:text-slate-100'
                  : i < currentStep
                  ? 'text-primary'
                  : 'text-slate-400 dark:text-slate-500'
              }`}>
                {s.title}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 rounded-full transition-colors duration-500 ${
                  i < currentStep ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Main card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/20 dark:border-white/10 shadow-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          <div className="absolute inset-0 dark:bg-slate-900/90 dark:backdrop-blur-2xl pointer-events-none" />

          <div className="relative z-10">
            {/* Step header with gradient */}
            <div className={`px-8 py-6 bg-gradient-to-r ${
              currentStep === 0 ? 'from-violet-500/20 to-blue-500/20 dark:from-violet-500/10 dark:to-blue-500/10' :
              currentStep === 1 ? 'from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 dark:to-cyan-500/10' :
              'from-primary/20 to-violet-500/20 dark:from-primary/10 dark:to-violet-500/10'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                  currentStep === 0 ? 'from-violet-500 to-blue-600' :
                  currentStep === 1 ? 'from-blue-500 to-cyan-600' :
                  'from-primary to-violet-600'
                } flex items-center justify-center shadow-lg`}>
                  <step.icon size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {currentStep === 0 && 'Welcome to OptivianAI'}
                    {currentStep === 1 && 'Complete Your Profile'}
                    {currentStep === 2 && 'Choose Your Role'}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentStep === 0 && "Let's personalize your workspace"}
                    {currentStep === 1 && 'Tell us about yourself'}
                    {currentStep === 2 && 'Select the role that best fits your position'}
                  </p>
                </div>
              </div>
              {/* Step counter */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-gradient-to-r ${
                      currentStep === 0 ? 'from-violet-500 to-blue-500' :
                      currentStep === 1 ? 'from-blue-500 to-cyan-500' :
                      'from-primary to-violet-500'
                    }`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0">
                  Step {currentStep + 1} of {STEPS.length}
                </span>
              </div>
            </div>

            {/* Step content */}
            <div className="px-8 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {/* ═══ STEP 1: WELCOME ═══ */}
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <div className="text-center py-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30"
                        >
                          <Sparkles size={36} className="text-white" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                          You're almost there!
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                          Just a few quick steps to personalize your workspace.
                          We'll set up your profile and choose the right role so your dashboard is perfectly tailored to you.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                        {[
                          { icon: User, label: 'Your Profile', desc: 'Name & details' },
                          { icon: Shield, label: 'Your Role', desc: 'Permissions & access' },
                          { icon: Sparkles, label: 'AI Workspace', desc: 'Personalized dashboard' },
                        ].map((item, i) => {
                          const ItemIcon = item.icon;
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + i * 0.1 }}
                              className="text-center p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/30"
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-2">
                                <ItemIcon size={16} className="text-primary" />
                              </div>
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.label}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.desc}</p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ═══ STEP 2: PROFILE FORM ═══ */}
                  {currentStep === 1 && (
                    <div className="space-y-5">
                      {/* Avatar upload */}
                      <div className="flex flex-col items-center mb-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          {formData.avatarUrl ? (
                            <img
                              src={formData.avatarUrl}
                              alt="Avatar"
                              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-slate-100 dark:ring-slate-700"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center ring-4 ring-slate-100 dark:ring-slate-700 shadow-lg">
                              <User size={32} className="text-white" />
                            </div>
                          )}
                          <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={20} className="text-white" />
                          </div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Click to upload photo (optional)</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <User size={12} /> Full Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => updateField('fullName', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                            placeholder="John Doe"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <Mail size={12} /> Email <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            readOnly
                            className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <Phone size={12} /> Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <Building2 size={12} /> Organization Name
                          </label>
                          <input
                            type="text"
                            value={formData.organizationName}
                            onChange={(e) => updateField('organizationName', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                            placeholder="Your Company Inc."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <Users size={12} /> Department
                          </label>
                          <select
                            value={formData.department}
                            onChange={(e) => updateField('department', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                          >
                            <option value="">Select department...</option>
                            {DEPARTMENTS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <Hash size={12} /> Employee ID
                          </label>
                          <input
                            type="text"
                            value={formData.employeeId}
                            onChange={(e) => updateField('employeeId', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                            placeholder="EMP-001"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <Globe size={12} /> Country
                          </label>
                          <select
                            value={formData.country}
                            onChange={(e) => updateField('country', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                          >
                            <option value="">Select country...</option>
                            {COUNTRIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <Clock size={12} /> Timezone
                          </label>
                          <select
                            value={formData.timezone}
                            onChange={(e) => updateField('timezone', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                          >
                            {TIMEZONES.map(tz => (
                              <option key={tz} value={tz}>{tz}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ═══ STEP 3: ROLE SELECTION ═══ */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      {selectedRole ? (
                        /* Role already selected - show confirmation */
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-5"
                        >
                          <div className={`p-6 rounded-2xl border-2 ${selectedRole.border} ${selectedRole.bg}`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${selectedRole.color} flex items-center justify-center shadow-lg`}>
                                {(() => {
                                  const Icon = getRoleIcon(selectedRole.id);
                                  return <Icon size={28} className="text-white" />;
                                })()}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedRole.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedRole.description}</p>
                              </div>
                              <div className="ml-auto">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                                  <Check size={12} />
                                  Selected
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/30">
                              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Permissions</h4>
                              <div className="space-y-1">
                                {selectedRole.permissions.slice(0, 4).map((perm, i) => (
                                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
                                    <Check size={10} className="text-emerald-500 shrink-0" />
                                    {perm}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/30">
                              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Dashboard Modules</h4>
                              <div className="space-y-1">
                                {selectedRole.modules.slice(0, 4).map((mod, i) => (
                                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
                                    <BarChart3 size={10} className="text-primary shrink-0" />
                                    {mod}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setShowRolePicker(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-primary bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all"
                          >
                            Change Role
                          </button>
                        </motion.div>
                      ) : (
                        /* No role selected - prompt to open picker */
                        <div className="text-center py-8">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                            <Shield size={28} className="text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            Select Your Role
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                            Choose the role that best describes your position. This determines your dashboard, permissions, and AI workspace.
                          </p>
                          <button
                            onClick={() => setShowRolePicker(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-violet-600 hover:from-primary-dark hover:to-violet-700 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                          >
                            Browse Roles
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer with navigation buttons */}
            <div className="px-8 py-4 border-t border-slate-200/60 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <button
                onClick={currentStep === 0 ? handleSkip : handleBack}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  currentStep === 0
                    ? 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    : 'text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                {currentStep === 0 ? (
                  <>Skip for now</>
                ) : (
                  <><ArrowLeft size={14} /> Back</>
                )}
              </button>

              <div className="flex items-center gap-2">
                {currentStep < STEPS.length - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-primary to-violet-600 hover:from-primary-dark hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 active:scale-[0.98]"
                  >
                    {currentStep === 0 ? 'Get Started' : 'Continue'}
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!canProceed() || loading}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                  >
                    {loading ? (
                      <><Loader2 size={14} className="animate-spin" /> Saving...</>
                    ) : (
                      <><Check size={14} /> Complete Setup</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Role Picker Modal */}
      <RolePickerModal
        isOpen={showRolePicker}
        onClose={() => setShowRolePicker(false)}
        onSelect={handleRoleSelect}
        selectedRole={selectedRole?.id}
      />
    </div>
  );
}
