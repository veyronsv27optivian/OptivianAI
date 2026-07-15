/**
 * SetupGuide — Onboarding setup wizard for new organizations.
 *
 * Guides users through essential configuration steps after
 * creating their organization. Provides clear instructions
 * for API keys, team invites, and first actions.
 *
 * Route: /onboarding/setup
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Circle, ArrowRight, ArrowLeft, Rocket, Users, Key,
  CheckSquare, Brain, Settings, Sparkles, Copy, ExternalLink,
  Server, Globe, Mail, BookOpen, Shield,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome!',
    subtitle: 'Your organization is ready',
    icon: Sparkles,
    gradient: 'from-blue-500 to-violet-500',
  },
  {
    id: 'ai_keys',
    title: 'AI Provider Setup',
    subtitle: 'Configure your AI models',
    icon: Key,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'team',
    title: 'Invite Your Team',
    subtitle: 'Add members to collaborate',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'first_steps',
    title: 'First Actions',
    subtitle: 'Create tasks & explore AI',
    icon: Rocket,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'done',
    title: 'All Set!',
    subtitle: 'You\'re ready to go',
    icon: CheckCircle,
    gradient: 'from-emerald-500 to-green-500',
  },
];

export default function SetupGuide() {
  const navigate = useNavigate();
  const { user, isDevMode } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      navigate('/app');
    }
  };

  const handleSkip = () => {
    navigate('/app');
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderStepContent = () => {
    switch (step.id) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Your organization has been created successfully! Let's get everything set up so you and your team can start using OptivianAI to its full potential.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Key, label: 'AI API Keys', desc: 'Unlock all AI features' },
                { icon: Users, label: 'Team Invites', desc: 'Collaborate with your team' },
                { icon: CheckSquare, label: 'Task Management', desc: 'Organize your work' },
                { icon: Brain, label: 'AI Tools', desc: 'SWOT, Forecast, Advisor' },
              ].map((item, i) => {
                const ItemIcon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-700/50">
                      <ItemIcon size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'ai_keys':
        return (
          <div className="space-y-5">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              OptivianAI supports <strong>4 AI providers</strong>. Set just <strong>2 API keys</strong> and all of them work:
            </p>

            <div className="space-y-3">
              {/* Gemini */}
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">G</div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Gemini <span className="text-[10px] font-normal text-slate-400">(Default)</span></span>
                  </div>
                  <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">Free tier</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Get a free key at aistudio.google.com</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-2 py-1 rounded bg-white dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-blue-200 dark:border-blue-800">
                    VITE_GEMINI_API_KEY=AIza...
                  </code>
                  <button
                    onClick={() => copyToClipboard('VITE_GEMINI_API_KEY=', 0)}
                    className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                  >
                    {copiedIndex === 0 ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* OpenRouter (shared) */}
              <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded bg-green-600 flex items-center justify-center text-white text-[9px] font-bold">D</div>
                      <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center text-white text-[9px] font-bold">Q</div>
                      <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center text-white text-[9px] font-bold">O</div>
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      DeepSeek + Qwen + OpenAI <span className="text-[10px] font-normal text-slate-400">(via OpenRouter)</span>
                    </span>
                  </div>
                  <span className="text-[9px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full">1 key for 3 models</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Get a free key at openrouter.ai/keys</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-2 py-1 rounded bg-white dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-violet-200 dark:border-violet-800">
                    VITE_OPENROUTER_API_KEY=sk-or-v1-...
                  </code>
                  <button
                    onClick={() => copyToClipboard('VITE_OPENROUTER_API_KEY=', 1)}
                    className="p-1.5 rounded text-slate-400 hover:text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all"
                  >
                    {copiedIndex === 1 ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded text-slate-400 hover:text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                <strong>Tip:</strong> Set these in your <code className="px-1 rounded bg-amber-100 dark:bg-amber-900/30 text-[10px]">_env</code> or <code className="px-1 rounded bg-amber-100 dark:bg-amber-900/30 text-[10px]">.env</code> file. The AI Platform will automatically use them — no restart needed.
              </p>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-5">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Add your team members so they can collaborate on tasks, chat, and use AI tools together.
            </p>

            <div className="p-5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30 text-center">
              <Users size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Go to Users & Roles to invite team members</p>
              <p className="text-[10px] text-slate-400 mb-4">You can assign roles, set permissions, and manage access</p>
              <button
                onClick={() => navigate('/app/users')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all active:scale-95"
              >
                <Users size={16} />
                Invite Team Members
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {['HR', 'Finance', 'Marketing'].map((dept, i) => (
                <div key={i} className="p-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{dept}</p>
                  <p className="text-[9px] text-slate-400">Department role</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'first_steps':
        return (
          <div className="space-y-5">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Here are some things you can do right now to start using the platform:
            </p>

            <div className="space-y-3">
              {[
                { icon: CheckSquare, label: 'Create your first task', desc: 'Organize what needs to be done', color: 'text-blue-600', bg: 'bg-blue-50', path: '/app/tasks' },
                { icon: Brain, label: 'Try the AI Business Advisor', desc: 'Get strategic advice for your business', color: 'text-violet-600', bg: 'bg-violet-50', path: '/app/ai' },
                { icon: MessageSquare, label: 'Start a team chat', desc: 'Discuss projects with your team', color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/app/chat' },
                { icon: Settings, label: 'Customize your profile', desc: 'Set your name, avatar, and preferences', color: 'text-amber-600', bg: 'bg-amber-50', path: '/app/settings' },
              ].map((item, i) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={i}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all text-left group"
                  >
                    <div className={`p-2 rounded-lg ${item.bg} group-hover:scale-110 transition-transform`}>
                      <ItemIcon size={18} className={item.color} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'done':
        return (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle size={32} className="text-white" />
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                You're all set! Your organization is configured and ready to use. Here's a quick summary of what we set up:
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm mx-auto">
              {[
                { icon: CheckCircle, label: 'Organization created', done: true },
                { icon: CheckCircle, label: 'AI providers configured', done: false },
                { icon: CheckCircle, label: 'Team ready to invite', done: false },
                { icon: CheckCircle, label: 'Tasks & AI tools available', done: true },
              ].map((item, i) => {
                const DoneIcon = item.done ? CheckCircle : Circle;
                return (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                    item.done ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-400 bg-slate-50/50'
                  }`}>
                    <DoneIcon size={12} />
                    {item.label}
                  </div>
                );
              })}
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('/app')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg active:scale-95"
              >
                <Rocket size={18} />
                Go to Dashboard
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Decorative background */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-2xl mx-auto relative z-10">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold transition-all ${
                i < currentStep
                  ? 'bg-emerald-500 text-white'
                  : i === currentStep
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
              }`}>
                {i < currentStep ? <CheckCircle size={12} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 rounded-full hidden sm:block ${
                  i < currentStep ? 'bg-emerald-300' : 'bg-slate-200 dark:bg-slate-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass dark:glass-dark rounded-2xl shadow-glass-lg overflow-hidden">
          {/* Step header */}
          <div className={`bg-gradient-to-r ${step.gradient} px-6 py-5`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <step.icon size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{step.title}</h2>
                <p className="text-sm text-white/80">{step.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {renderStepContent()}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <button
              onClick={handleSkip}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Skip guide
            </button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(s => s - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
              >
                {currentStep < STEPS.length - 1 ? (
                  <>Next <ArrowRight size={14} /></>
                ) : (
                  'Finish'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Progress text */}
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-4">
          Step {currentStep + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}
