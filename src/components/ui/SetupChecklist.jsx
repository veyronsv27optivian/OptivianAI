/**
 * SetupChecklist — Getting Started guide for new organizations.
 *
 * Shows a step-by-step checklist that guides the user through
 * essential setup tasks. Progress is persisted in localStorage
 * so users can resume later.
 *
 * Steps:
 *   1. ✅ Create your organization (auto-completed if they see this)
 *   2. Set up AI API keys (VITE_GEMINI_API_KEY, VITE_OPENROUTER_API_KEY)
 *   3. Invite team members
 *   4. Create your first task
 *   5. Explore AI tools
 *   6. Configure organization settings
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Circle, ArrowRight, Rocket, Users, Key,
  CheckSquare, Brain, Settings, Sparkles, X, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import Card from './Card';

const SETUP_KEY = 'optivian_setup_progress';
const DISMISS_KEY = 'optivian_setup_dismissed';

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(SETUP_KEY) || 'null');
  } catch { return null; }
}

function saveProgress(progress) {
  localStorage.setItem(SETUP_KEY, JSON.stringify(progress));
}

function isDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'true';
  } catch { return false; }
}

function dismiss() {
  localStorage.setItem(DISMISS_KEY, 'true');
}

const ALL_STEPS = [
  {
    id: 'org_created',
    label: 'Organization Created',
    description: 'Your workspace is ready. Time to set things up!',
    icon: Rocket,
    link: null,
    autoComplete: true, // Completed when they see the dashboard
  },
  {
    id: 'ai_keys',
    label: 'Configure AI Providers',
    description: 'Set your Gemini and OpenRouter API keys to unlock all AI features',
    icon: Key,
    link: '/onboarding/setup',
    action: 'Configure',
  },
  {
    id: 'invite_team',
    label: 'Invite Team Members',
    description: 'Add your team to collaborate on tasks and projects',
    icon: Users,
    link: '/app/users',
    action: 'Invite',
  },
  {
    id: 'first_task',
    label: 'Create Your First Task',
    description: 'Start organizing work by creating your first task',
    icon: CheckSquare,
    link: '/app/tasks',
    action: 'Create Task',
  },
  {
    id: 'explore_ai',
    label: 'Explore AI Platform',
    description: 'Try the AI Business Advisor, SWOT Analysis, and other tools',
    icon: Brain,
    link: '/app/ai',
    action: 'Explore',
  },
  {
    id: 'org_settings',
    label: 'Configure Organization',
    description: 'Set up your organization profile, branding, and preferences',
    icon: Settings,
    link: '/app/org',
    action: 'Configure',
  },
];

export default function SetupChecklist({ onClose }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(() => loadProgress());
  const [expanded, setExpanded] = useState(true);

  // Determine which steps are completed
  const steps = useMemo(() => {
    return ALL_STEPS.map((step) => {
      const saved = progress?.[step.id];
      const completed = saved === true ||
        (step.autoComplete && !!profile?.organization_id);
      return { ...step, completed };
    });
  }, [progress, profile]);

  const completedCount = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const percentComplete = Math.round((completedCount / totalSteps) * 100);
  const allDone = completedCount === totalSteps;

  // Auto-dismiss if dismissed before
  if (isDismissed() && !allDone) return null;
  if (allDone) return null;

  const handleStepClick = (step) => {
    if (step.link) {
      navigate(step.link);
    }
    // Mark step as "in progress"
    const newProgress = { ...progress, [`${step.id}_clicked`]: true };
    saveProgress(newProgress);
    setProgress(newProgress);
  };

  const handleComplete = (stepId) => {
    const newProgress = { ...progress, [stepId]: true };
    saveProgress(newProgress);
    setProgress(newProgress);
  };

  const handleDismiss = () => {
    dismiss();
    onClose?.();
  };

  const containerClass = 'premium-card dark:dark-card-metallic overflow-hidden';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200/80 dark:border-white/5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-violet-500 shadow-glow-primary">
              <Rocket size={16} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-text-primary">Getting Started</h3>
            <span className="text-[10px] font-medium text-primary dark:text-primary-light bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-full">
              {percentComplete}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg text-slate-400 dark:text-text-tertiary hover:text-slate-600 dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              <ChevronDown size={16} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} />
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 dark:text-text-tertiary hover:text-slate-600 dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        {!expanded && (
          <p className="text-[10px] text-slate-400 dark:text-text-tertiary mt-1.5">
            {completedCount} of {totalSteps} steps complete
          </p>
        )}
      </div>

      {/* Steps */}
      {expanded && (
        <div className="px-5 py-3 space-y-1">
          {steps.map((step, i) => {
            const StepIcon = step.icon;
            const isCompleted = step.completed;
            const isLast = i === steps.length - 1;

            return (
              <div key={step.id} className="relative flex gap-3 py-2">
                {/* Connector line */}
                {!isLast && (
                  <div className={`absolute left-[15px] top-8 w-0.5 h-full -z-0 rounded-full ${
                    isCompleted ? 'bg-emerald-300 dark:bg-emerald-700/50' : 'bg-slate-200 dark:bg-white/10'
                  }`} />
                )}

                {/* Icon */}
                <div className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-full shrink-0 transition-all ${
                  isCompleted
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-surface-raised/80 text-slate-400 dark:text-text-tertiary'
                }`}>
                  {isCompleted ? (
                    <CheckCircle size={14} />
                  ) : (
                    <Circle size={14} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-medium ${
                      isCompleted
                        ? 'text-emerald-700 dark:text-emerald-300 line-through'
                        : 'text-slate-800 dark:text-text-primary'
                    }`}>
                      {step.label}
                    </span>
                    {isCompleted ? (
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-300 font-medium">Done</span>
                    ) : step.link ? (
                      <button
                        onClick={() => handleStepClick(step)}
                        className="flex items-center gap-0.5 text-[9px] font-medium text-primary dark:text-primary-light hover:text-primary-dark dark:hover:text-primary transition-colors shrink-0"
                      >
                        {step.action || 'Go'}
                        <ArrowRight size={10} />
                      </button>
                    ) : null}
                  </div>
                  <p className={`text-[10px] mt-0.5 leading-relaxed ${
                    isCompleted
                      ? 'text-slate-400 dark:text-text-tertiary'
                      : 'text-slate-500 dark:text-text-secondary'
                  }`}>
                    {step.description}
                  </p>

                  {/* Manual complete button (for steps that can't auto-detect) */}
                  {!isCompleted && step.id !== 'org_created' && (
                    <button
                      onClick={() => handleComplete(step.id)}
                      className="mt-1 text-[9px] text-slate-400 dark:text-text-tertiary hover:text-slate-600 dark:hover:text-text-primary underline transition-colors"
                    >
                      Mark as done
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {expanded && (
        <div className="px-5 py-2.5 border-t border-slate-200/80 dark:border-white/5">
          <button
            onClick={handleDismiss}
            className="w-full text-[10px] text-slate-400 dark:text-text-tertiary hover:text-slate-600 dark:hover:text-text-primary transition-colors"
          >
            {allDone ? '🎉 All done! Dismiss' : 'Dismiss this checklist'}
          </button>
        </div>
      )}
    </div>
  );
}
