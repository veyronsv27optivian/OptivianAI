/**
 * ─── Prompt Template Service — Items 59 & 65 ──────────────────────
 *
 * Manages saved AI prompt templates and custom persona presets.
 * Users can save, load, share, and manage their custom AI prompts.
 *
 * Templates include:
 *   - System prompt (the AI's behavior instructions)
 *   - User prompt template (with {{variable}} placeholders)
 *   - Tool type association
 *   - Tags and categories
 *
 * Persona presets (Item 65):
 *   - Pre-configured advisor types with specific system prompts
 *   - Industry, company size, and role settings
 *   - Reusable across the Business Advisor tool
 */

import { supabase } from './supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;

// ─── Dev mode helpers ─────────────────────────────────────────────

function devGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}

function devSet(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Prompt Templates (Item 59) ──────────────────────────────────

const TEMPLATES_KEY = 'optivian_prompt_templates';

/**
 * Save a prompt template.
 */
export async function saveTemplate(template) {
  if (!template.name || !template.systemPrompt) {
    return { error: { message: 'Template name and system prompt are required' } };
  }

  const entry = {
    id: template.id || uid(),
    name: template.name,
    description: template.description || '',
    systemPrompt: template.systemPrompt,
    userPromptTemplate: template.userPromptTemplate || '',
    toolType: template.toolType || '*',
    tags: template.tags || [],
    category: template.category || 'Custom',
    isPreset: template.isPreset || false,
    variables: template.variables || [],
    updatedAt: new Date().toISOString(),
    createdAt: template.createdAt || new Date().toISOString(),
  };

  if (DEV_MODE) {
    const templates = devGet(TEMPLATES_KEY);
    const existingIdx = templates.findIndex(t => t.id === entry.id);
    if (existingIdx >= 0) {
      templates[existingIdx] = entry;
    } else {
      templates.push(entry);
    }
    devSet(TEMPLATES_KEY, templates);
    return { data: entry, error: null };
  }

  const { data, error } = await supabase
    .from('prompt_templates')
    .upsert(entry, { onConflict: 'id' })
    .select()
    .single();

  return { data, error };
}

/**
 * Load all templates, optionally filtered by tool type.
 */
export async function loadTemplates(toolType) {
  if (DEV_MODE) {
    let templates = devGet(TEMPLATES_KEY);
    if (toolType) {
      templates = templates.filter(t => t.toolType === toolType || t.toolType === '*');
    }
    return templates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  // Fetch all templates and filter in JS to avoid Supabase wildcard limitations
  const { data } = await supabase
    .from('prompt_templates')
    .select('*')
    .order('updatedAt', { ascending: false });

  let templates = data || [];
  if (toolType) {
    templates = templates.filter(t => t.toolType === toolType || t.toolType === '*');
  }
  return templates;
}

/**
 * Delete a template by ID.
 */
export async function deleteTemplate(templateId) {
  if (DEV_MODE) {
    const templates = devGet(TEMPLATES_KEY).filter(t => t.id !== templateId);
    devSet(TEMPLATES_KEY, templates);
    return { error: null };
  }
  const { error } = await supabase.from('prompt_templates').delete().eq('id', templateId);
  return { error };
}

/**
 * Apply a template to build a full prompt.
 * Replaces {{variable}} placeholders with provided values.
 */
export function applyTemplate(template, variableValues = {}) {
  let prompt = template.userPromptTemplate || '';
  for (const [key, value] of Object.entries(variableValues)) {
    prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return {
    systemPrompt: template.systemPrompt,
    prompt: prompt || template.description || '',
  };
}

/**
 * Extract {{variable}} placeholders from a template string.
 */
export function extractVariables(templateString) {
  const regex = /\{\{(\w+)\}\}/g;
  const variables = [];
  let match;
  while ((match = regex.exec(templateString)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  return variables;
}

// ─── Persona Presets (Item 65) ──────────────────────────────────

const PRESETS_KEY = 'optivian_persona_presets';

const DEFAULT_PERSONAS = [
  {
    id: 'persona_strategic',
    name: 'Strategic Advisor',
    description: 'High-level business strategy and competitive positioning',
    systemPrompt: 'You are a seasoned strategic advisor with 20+ years of experience helping companies scale. Focus on competitive positioning, market differentiation, and long-term strategy.',
    industry: '*',
    companySize: '*',
    stage: '*',
    isBuiltIn: true,
  },
  {
    id: 'persona_startup',
    name: 'Startup Coach',
    description: 'Early-stage startup validation, product-market fit, and growth',
    systemPrompt: 'You are a startup coach who has helped launch 50+ companies. Focus on lean methodology, product-market fit, MVP definition, and capital-efficient growth.',
    industry: 'technology',
    companySize: '1-10',
    stage: 'early',
    isBuiltIn: true,
  },
  {
    id: 'persona_financial',
    name: 'Financial Analyst',
    description: 'Financial planning, budgeting, and investment analysis',
    systemPrompt: 'You are a CFA-level financial analyst. Focus on financial modeling, cash flow analysis, ROI calculations, and risk-adjusted decision making.',
    industry: '*',
    companySize: '*',
    stage: '*',
    isBuiltIn: true,
  },
  {
    id: 'persona_marketing',
    name: 'Marketing Director',
    description: 'Marketing strategy, campaign planning, and brand growth',
    systemPrompt: 'You are a marketing director with expertise in digital marketing, brand strategy, and growth hacking. Focus on channel strategy, audience targeting, and measurable ROI.',
    industry: '*',
    companySize: '*',
    stage: '*',
    isBuiltIn: true,
  },
  {
    id: 'persona_operations',
    name: 'Operations Expert',
    description: 'Process optimization, workflow design, and operational efficiency',
    systemPrompt: 'You are an operations expert specializing in workflow optimization, process automation, and resource allocation. Focus on efficiency gains and bottleneck resolution.',
    industry: '*',
    companySize: '*',
    stage: '*',
    isBuiltIn: true,
  },
];

/**
 * Get all available persona presets (sync — returns cached + built-in).
 * Use loadPersonaPresets() for async Supabase loading.
 */
export function getPersonaPresets() {
  if (DEV_MODE) {
    const custom = devGet(PRESETS_KEY);
    return [...DEFAULT_PERSONAS, ...custom];
  }
  return DEFAULT_PERSONAS;
}

/**
 * Load custom persona presets from Supabase (async).
 * Merges built-in + custom presets.
 */
export async function loadPersonaPresets() {
  if (DEV_MODE) {
    const custom = devGet(PRESETS_KEY);
    return [...DEFAULT_PERSONAS, ...custom];
  }

  try {
    const { data: customPresets } = await supabase
      .from('persona_presets')
      .select('*')
      .eq('isBuiltIn', false)
      .order('createdAt', { ascending: false });

    return [...DEFAULT_PERSONAS, ...(customPresets || [])];
  } catch {
    return DEFAULT_PERSONAS;
  }
}

/**
 * Save a custom persona preset.
 */
export async function savePersonaPreset(preset) {
  if (!preset.name || !preset.systemPrompt) {
    return { error: { message: 'Preset name and system prompt are required' } };
  }

  const entry = {
    id: preset.id || uid(),
    name: preset.name,
    description: preset.description || '',
    systemPrompt: preset.systemPrompt,
    industry: preset.industry || '*',
    companySize: preset.companySize || '*',
    stage: preset.stage || '*',
    isBuiltIn: false,
    createdAt: new Date().toISOString(),
  };

  if (DEV_MODE) {
    const presets = devGet(PRESETS_KEY);
    const idx = presets.findIndex(p => p.id === entry.id);
    if (idx >= 0) presets[idx] = entry;
    else presets.push(entry);
    devSet(PRESETS_KEY, presets);
    return { data: entry, error: null };
  }

  const { data, error } = await supabase.from('persona_presets').upsert(entry).select().single();
  return { data, error };
}

/**
 * Delete a custom persona preset.
 */
export async function deletePersonaPreset(presetId) {
  if (DEV_MODE) {
    const presets = devGet(PRESETS_KEY).filter(p => p.id !== presetId);
    devSet(PRESETS_KEY, presets);
    return { error: null };
  }
  const { error } = await supabase.from('persona_presets').delete().eq('id', presetId);
  return { error };
}

/**
 * Get system prompt from a persona preset (async — loads custom presets from Supabase).
 */
export async function getPersonaPrompt(personaId) {
  const presets = await loadPersonaPresets();
  const persona = presets.find(p => p.id === personaId);
  return persona?.systemPrompt || '';
}
