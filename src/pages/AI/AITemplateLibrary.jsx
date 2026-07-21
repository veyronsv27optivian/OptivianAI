/**
 * AITemplateLibrary — Phase 6 (#59)
 *
 * Save, browse, and reuse custom AI prompts.
 * Templates are organized by tool type and can be loaded into any AI tool.
 *
 * Persists to localStorage in DEV_MODE, Supabase in production.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Save, Search, Plus, Trash2, Copy, Check, Clock, Star,
  FileText, FolderOpen, Tag, ChevronRight, Sparkles, Bookmark,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { getAvailableTools, AI_TOOL_TYPES } from '../../services/ai';

// ─── Local Storage ────────────────────────────────────────────────
const STORAGE_KEY = 'optivian_prompt_templates';

function loadTemplates() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveTemplates(templates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Template categories ──────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  'Strategy', 'Analysis', 'Content', 'Planning', 'HR', 'Sales', 'Finance', 'Custom',
];

const TOOL_CATEGORY_MAP = {
  business_advisor: 'Strategy',
  requirement_analyzer: 'Analysis',
  swot_analysis: 'Strategy',
  decision_simulation: 'Planning',
  risk_detection: 'Analysis',
  launch_readiness: 'Strategy',
  marketing_strategy: 'Content',
  financial_forecast: 'Finance',
  competitor_analysis: 'Analysis',
  social_analysis: 'Analysis',
  sales_advisor: 'Sales',
  hr_advisor: 'HR',
  startup_validator: 'Planning',
  custom_assistant: 'Custom',
};

export default function AITemplateLibrary({ onSelectTemplate, onClose }) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // ── Save form state ────────────────────────────────────────────
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    category: 'Custom',
    toolType: '',
    prompt: '',
    tags: '',
    isFavorite: false,
  });

  const tools = useMemo(() => getAvailableTools(), []);

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  // ── Filtering ──────────────────────────────────────────────────
  const filteredTemplates = useMemo(() => {
    let items = [...templates];

    if (selectedCategory !== 'all') {
      items = items.filter(t => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.prompt.toLowerCase().includes(q) ||
        (t.tags || '').toLowerCase().includes(q)
      );
    }

    // Sort: favorites first, then by name
    items.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });

    return items;
  }, [templates, searchQuery, selectedCategory]);

  // ── Categories with counts ──────────────────────────────────────
  const categories = useMemo(() => {
    const counts = { all: templates.length };
    for (const t of templates) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return DEFAULT_CATEGORIES.map(c => ({ name: c, count: counts[c] || 0 }));
  }, [templates]);

  // ── Actions ─────────────────────────────────────────────────────
  const handleSave = () => {
    if (!saveForm.name.trim() || !saveForm.prompt.trim()) return;

    const template = {
      id: uid(),
      name: saveForm.name.trim(),
      description: saveForm.description.trim(),
      category: saveForm.category,
      toolType: saveForm.toolType || '*',
      prompt: saveForm.prompt.trim(),
      tags: saveForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      isFavorite: saveForm.isFavorite,
      createdBy: user?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    const updated = [...templates, template];
    setTemplates(updated);
    saveTemplates(updated);
    setShowSaveForm(false);
    resetSaveForm();
  };

  const handleDelete = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  const handleToggleFavorite = (id) => {
    const updated = templates.map(t =>
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    );
    setTemplates(updated);
    saveTemplates(updated);
  };

  const handleUse = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate({
        prompt: template.prompt,
        toolType: template.toolType,
        name: template.name,
      });
    }
  };

  const handleCopy = async (template) => {
    try {
      await navigator.clipboard.writeText(template.prompt);
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }

    // Increment usage count
    const updated = templates.map(t =>
      t.id === template.id ? { ...t, usageCount: (t.usageCount || 0) + 1 } : t
    );
    setTemplates(updated);
    saveTemplates(updated);
  };

  const resetSaveForm = () => {
    setSaveForm({
      name: '', description: '', category: 'Custom', toolType: '',
      prompt: '', tags: '', isFavorite: false,
    });
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const getToolLabel = (type) => {
    if (!type || type === '*') return 'Any tool';
    const tool = tools.find(t => t.id === type);
    return tool?.label || type;
  };

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div className="p-2 rounded-lg bg-violet-50">
            <Bookmark size={20} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Prompt Templates</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{templates.length} saved templates</p>
          </div>
        </div>
        <button
          onClick={() => setShowSaveForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-all"
        >
          <Plus size={16} />
          New Template
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* ── Save Form ─────────────────────────────────────── */}
        {showSaveForm && (
          <div className="mb-6 p-5 rounded-xl bg-violet-50 border border-violet-200 space-y-4">
            <h3 className="text-sm font-semibold text-violet-800">Save New Template</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={saveForm.name}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Market Entry Strategy"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={saveForm.description}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this template"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
                <select
                  value={saveForm.category}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {DEFAULT_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tool Type</label>
                <select
                  value={saveForm.toolType}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, toolType: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Any tool</option>
                  {tools.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={saveForm.tags}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., strategy, growth, market"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Prompt Content *</label>
                <textarea
                  value={saveForm.prompt}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, prompt: e.target.value }))}
                  rows={5}
                  placeholder="Enter the prompt template content. Use {{variable}} for dynamic values."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <input
                  type="checkbox"
                  id="save-fav"
                  checked={saveForm.isFavorite}
                  onChange={(e) => setSaveForm(prev => ({ ...prev, isFavorite: e.target.checked }))}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="save-fav" className="text-xs text-slate-600">Mark as favorite</label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={!saveForm.name.trim() || !saveForm.prompt.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-all disabled:opacity-50"
              >
                <Save size={16} />
                Save Template
              </button>
              <button
                onClick={() => { setShowSaveForm(false); resetSaveForm(); }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Filters ───────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* ── Category pills ────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name === 'all' ? 'all' : cat.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === (cat.name === 'all' ? 'all' : cat.name)
                  ? 'bg-violet-100 text-violet-700 border border-violet-200'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent'
              }`}
            >
              <FolderOpen size={12} />
              {cat.name === 'all' ? 'All' : cat.name}
              <span className="text-[10px] opacity-60">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* ── Template Grid ─────────────────────────────────── */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">No templates found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try a different search or category'
                : 'Save your first prompt template to reuse it later'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <button
                onClick={() => setShowSaveForm(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-all mx-auto"
              >
                <Plus size={16} />
                Create First Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group relative bg-white border border-slate-200 rounded-lg p-4 hover:border-violet-200 hover:shadow-sm transition-all"
              >
                {/* Favorite star */}
                <button
                  onClick={() => handleToggleFavorite(template.id)}
                  className={`absolute top-3 right-3 p-1 rounded transition-all ${
                    template.isFavorite ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'
                  }`}
                >
                  <Star size={14} fill={template.isFavorite ? 'currentColor' : 'none'} />
                </button>

                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-violet-50">
                    <FileText size={14} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 truncate">{template.name}</h4>
                  </div>
                </div>

                {template.description && (
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{template.description}</p>
                )}

                {/* Tags */}
                {template.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {template.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Tag size={10} />
                    {template.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {getTimeAgo(template.updatedAt)}
                  </span>
                </div>

                {/* Prompt preview */}
                <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 rounded p-2 line-clamp-2 font-mono">
                  {template.prompt.slice(0, 100)}{template.prompt.length > 100 ? '...' : ''}
                </p>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(template)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-50 text-violet-600 text-xs font-medium hover:bg-violet-100 transition-all"
                  >
                    {copiedId === template.id ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === template.id ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleUse(template)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-all"
                  >
                    <Sparkles size={12} />
                    Use
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
