/**
 * AIPersonaPresets — Phase 6 (#65)
 *
 * Custom persona presets for the Business Advisor tool.
 * Users can save, load, and manage pre-configured advisor types
 * (industry, company size, stage, goals, challenge).
 *
 * Persists to localStorage.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  UserCircle, Plus, Save, Trash2, Copy, Check, Edit,
  ChevronRight, Target, Users, Building2, TrendingUp,
  Lightbulb, Sparkles, Star,
} from 'lucide-react';

// ─── Storage ──────────────────────────────────────────────────────
const STORAGE_KEY = 'optivian_persona_presets';

function loadPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function savePresets(presets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Preset Icons ─────────────────────────────────────────────────
const PRESET_ICONS = {
  executive: '👔',
  startup: '🚀',
  enterprise: '🏢',
  consultant: '📊',
  investor: '💰',
  custom: '⚙️',
};

const DEFAULT_PRESETS = [
  {
    id: 'preset_startup_founder',
    name: 'Startup Founder',
    icon: '🚀',
    description: 'Early-stage startup seeking product-market fit and funding',
    isBuiltIn: true,
    persona: {
      industry: 'Technology / SaaS',
      companySize: '1-10',
      stage: 'idea',
      goals: 'Validate idea, find product-market fit, prepare for funding',
      businessContext: 'Early-stage startup with minimal revenue, seeking validation and growth strategy.',
    },
  },
  {
    id: 'preset_sme_owner',
    name: 'SME Business Owner',
    icon: '🏢',
    description: 'Small to medium business looking to scale operations',
    isBuiltIn: true,
    persona: {
      industry: 'Business Services',
      companySize: '11-50',
      stage: 'growth',
      goals: 'Scale operations, increase revenue, optimize costs',
      businessContext: 'Established SME with steady revenue seeking to scale operations and expand market reach.',
    },
  },
  {
    id: 'preset_enterprise_exec',
    name: 'Enterprise Executive',
    icon: '👔',
    description: 'Large organization leader focused on strategy and transformation',
    isBuiltIn: true,
    persona: {
      industry: 'Technology',
      companySize: '100+',
      stage: 'expansion',
      goals: 'Digital transformation, market expansion, operational efficiency',
      businessContext: 'Enterprise organization with multiple departments seeking strategic transformation and growth.',
    },
  },
  {
    id: 'preset_consultant',
    name: 'Strategy Consultant',
    icon: '📊',
    description: 'Independent consultant advising multiple clients',
    isBuiltIn: true,
    persona: {
      industry: 'Consulting',
      companySize: '1-10',
      stage: 'growth',
      goals: 'Deliver client value, grow practice, build thought leadership',
      businessContext: 'Independent consultant providing strategic advice to multiple client organizations.',
    },
  },
  {
    id: 'preset_investor',
    name: 'Investor / Venture Capital',
    icon: '💰',
    description: 'Evaluating investment opportunities and portfolio companies',
    isBuiltIn: true,
    persona: {
      industry: 'Venture Capital / Finance',
      companySize: '1-10',
      stage: 'expansion',
      goals: 'Evaluate opportunities, optimize portfolio, identify market trends',
      businessContext: 'Investment professional evaluating companies and providing strategic guidance to portfolio.',
    },
  },
];

export default function AIPersonaPresets({ onSelectPreset, onClose }) {
  const [presets, setPresets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // ── Form state ─────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    icon: '⚙️',
    description: '',
    persona: {
      industry: '',
      companySize: '1-10',
      stage: 'idea',
      goals: '',
      businessContext: '',
    },
  });

  useEffect(() => {
    const stored = loadPresets();
    // Merge built-in presets with user presets
    const builtIn = DEFAULT_PRESETS.filter(
      d => !stored.find(s => s.id === d.id)
    );
    setPresets([...builtIn, ...stored]);
  }, []);

  const persistPresets = (updated) => {
    setPresets(updated);
    savePresets(updated.filter(p => !p.isBuiltIn));
  };

  const resetForm = () => {
    setFormData({
      name: '', icon: '⚙️', description: '',
      persona: { industry: '', companySize: '1-10', stage: 'idea', goals: '', businessContext: '' },
    });
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      const updated = presets.map(p =>
        p.id === editingId ? { ...p, ...formData, updatedAt: new Date().toISOString() } : p
      );
      persistPresets(updated);
    } else {
      const newPreset = {
        id: uid(),
        ...formData,
        isBuiltIn: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      };
      persistPresets([...presets, newPreset]);
    }

    setShowForm(false);
    resetForm();
  };

  const handleEdit = (preset) => {
    setFormData({
      name: preset.name,
      icon: preset.icon || '⚙️',
      description: preset.description || '',
      persona: { ...preset.persona },
    });
    setEditingId(preset.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    const updated = presets.filter(p => p.id !== id);
    persistPresets(updated);
  };

  const handleUse = (preset) => {
    if (onSelectPreset) {
      onSelectPreset({
        name: preset.name,
        ...preset.persona,
      });
    }
    // Increment usage
    const updated = presets.map(p =>
      p.id === preset.id ? { ...p, usageCount: (p.usageCount || 0) + 1 } : p
    );
    persistPresets(updated);
  };

  const getStageLabel = (stage) => {
    const labels = {
      idea: '💡 Idea / Concept',
      validation: '🔍 Validation',
      launch: '🚀 Launch',
      growth: '📈 Growth',
      expansion: '🌍 Expansion',
      maturity: '🏆 Maturity',
    };
    return labels[stage] || stage;
  };

  const iconOptions = ['🚀', '🏢', '👔', '📊', '💰', '⚙️', '🎯', '💡', '🤖', '📈', '🌍', '🎨', '🛠️', '🔬'];

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div className="p-2 rounded-lg bg-cyan-50">
            <UserCircle size={20} className="text-cyan-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Persona Presets</h2>
            <p className="text-xs text-slate-400">{presets.length} presets available</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-all"
        >
          <Plus size={16} />
          New Preset
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* ── Save Form ─────────────────────────────────────── */}
        {showForm && (
          <div className="p-5 rounded-xl bg-cyan-50 border border-cyan-200 space-y-4">
            <h3 className="text-sm font-semibold text-cyan-800">
              {editingId ? 'Edit Preset' : 'Create New Preset'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., SaaS Founder"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-lg transition-all ${
                        formData.icon === icon
                          ? 'bg-cyan-200 border-2 border-cyan-500 scale-110'
                          : 'bg-white border border-slate-200 hover:border-cyan-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this persona"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Industry</label>
                <input
                  type="text"
                  value={formData.persona.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, persona: { ...prev.persona, industry: e.target.value } }))}
                  placeholder="e.g., Technology / SaaS"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Company Size</label>
                <select
                  value={formData.persona.companySize}
                  onChange={(e) => setFormData(prev => ({ ...prev, persona: { ...prev.persona, companySize: e.target.value } }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="1-10">1-10 (Micro)</option>
                  <option value="11-50">11-50 (Small)</option>
                  <option value="51-200">51-200 (Medium)</option>
                  <option value="201-1000">201-1000 (Large)</option>
                  <option value="1000+">1000+ (Enterprise)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Stage</label>
                <select
                  value={formData.persona.stage}
                  onChange={(e) => setFormData(prev => ({ ...prev, persona: { ...prev.persona, stage: e.target.value } }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="idea">💡 Idea / Concept</option>
                  <option value="validation">🔍 Validation</option>
                  <option value="launch">🚀 Launch</option>
                  <option value="growth">📈 Growth</option>
                  <option value="expansion">🌍 Expansion</option>
                  <option value="maturity">🏆 Maturity</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Goals</label>
                <input
                  type="text"
                  value={formData.persona.goals}
                  onChange={(e) => setFormData(prev => ({ ...prev, persona: { ...prev.persona, goals: e.target.value } }))}
                  placeholder="e.g., Scale operations, increase revenue, enter new markets"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Business Context</label>
                <textarea
                  value={formData.persona.businessContext}
                  onChange={(e) => setFormData(prev => ({ ...prev, persona: { ...prev.persona, businessContext: e.target.value } }))}
                  rows={3}
                  placeholder="Describe the business context and challenges"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={!formData.name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-all disabled:opacity-50"
              >
                <Save size={16} />
                {editingId ? 'Update Preset' : 'Save Preset'}
              </button>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Preset Grid ───────────────────────────────────── */}
        {presets.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <UserCircle size={40} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">No presets yet</h3>
            <p className="text-sm text-slate-400">Create your first persona preset for quick Business Advisor setup</p>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-all mx-auto"
            >
              <Plus size={16} />
              Create Preset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="bg-white border border-slate-200 rounded-lg p-4 hover:border-cyan-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{preset.icon || '⚙️'}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800">{preset.name}</h4>
                    {preset.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{preset.description}</p>
                    )}
                  </div>
                  {preset.isBuiltIn && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">Built-in</span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <Building2 size={12} className="text-slate-400" />
                    {preset.persona.industry || 'Any industry'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users size={12} className="text-slate-400" />
                    {preset.persona.companySize} employees
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Target size={12} className="text-slate-400" />
                    {getStageLabel(preset.persona.stage)}
                  </p>
                  {preset.persona.goals && (
                    <p className="flex items-start gap-1.5">
                      <TrendingUp size={12} className="text-slate-400 mt-0.5" />
                      <span className="line-clamp-1">{preset.persona.goals}</span>
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleUse(preset)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-cyan-50 text-cyan-600 text-xs font-medium hover:bg-cyan-100 transition-all"
                  >
                    <Sparkles size={12} />
                    Use Persona
                  </button>
                  <button
                    onClick={() => handleEdit(preset)}
                    className="p-1.5 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    <Edit size={12} />
                  </button>
                  {!preset.isBuiltIn && (
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
