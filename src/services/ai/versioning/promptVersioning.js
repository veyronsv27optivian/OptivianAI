/**
 * ─── AI Prompt Versioning (Item 60) ─────────────────────────────
 * Tracks changes to AI prompts over time, allowing users to
 * view, restore, and compare different versions of prompts.
 *
 * Dev mode uses localStorage. Supabase mode uses prompt_versions table.
 */

import { supabase } from '../../supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;
const DEV_KEY = 'optivian_prompt_versions';

function devGet() {
  try { return JSON.parse(localStorage.getItem(DEV_KEY) || '[]'); }
  catch { return []; }
}

function devSet(data) {
  localStorage.setItem(DEV_KEY, JSON.stringify(data));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Save a new version of a prompt.
 *
 * @param {object} params
 * @param {string} params.promptId - Unique identifier for the prompt (stable across versions).
 * @param {string} params.name - Human-readable name for the prompt.
 * @param {string} params.content - The actual prompt text/template.
 * @param {string} params.toolType - The AI tool type this prompt is for.
 * @param {string} [params.description] - What changed in this version.
 * @param {string} [params.createdBy] - User ID who created this version.
 * @returns {Promise<{version: number, id: string}>}
 */
export async function savePromptVersion({ promptId, name, content, toolType, description = '', createdBy = null }) {
  if (!promptId || !name || !content) {
    throw new Error('promptId, name, and content are required');
  }

  if (DEV_MODE) {
    const versions = devGet();
    const existingVersions = versions.filter(v => v.prompt_id === promptId);
    const versionNumber = existingVersions.length + 1;

    const entry = {
      id: uid(),
      prompt_id: promptId,
      version: versionNumber,
      name,
      content,
      tool_type: toolType || '*',
      description: description || `Version ${versionNumber}`,
      created_by: createdBy,
      created_at: new Date().toISOString(),
    };

    versions.push(entry);
    devSet(versions);

    // Keep max 50 versions per prompt
    const allForPrompt = versions.filter(v => v.prompt_id === promptId);
    if (allForPrompt.length > 50) {
      const toRemove = allForPrompt.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).slice(0, allForPrompt.length - 50);
      const idsToRemove = new Set(toRemove.map(v => v.id));
      devSet(versions.filter(v => !idsToRemove.has(v.id)));
    }

    return { version: versionNumber, id: entry.id };
  }

  // Supabase mode
  const existingVersions = await getPromptVersions(promptId);
  const versionNumber = existingVersions.length + 1;

  const { data, error } = await supabase
    .from('prompt_versions')
    .insert({
      prompt_id: promptId,
      version: versionNumber,
      name,
      content,
      tool_type: toolType || '*',
      description: description || `Version ${versionNumber}`,
      created_by: createdBy,
    })
    .select('id, version')
    .single();

  if (error) throw error;
  return { version: data.version, id: data.id };
}

/**
 * Get all versions of a prompt, ordered by version number descending.
 *
 * @param {string} promptId
 * @returns {Promise<Array>}
 */
export async function getPromptVersions(promptId) {
  if (!promptId) return [];

  if (DEV_MODE) {
    return devGet()
      .filter(v => v.prompt_id === promptId)
      .sort((a, b) => b.version - a.version);
  }

  const { data, error } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('prompt_id', promptId)
    .order('version', { ascending: false });

  if (error) {
    console.error('[PromptVersioning] Failed to get versions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a specific version of a prompt.
 *
 * @param {string} promptId
 * @param {number} version
 * @returns {Promise<object|null>}
 */
export async function getPromptVersion(promptId, version) {
  if (!promptId || !version) return null;

  if (DEV_MODE) {
    return devGet().find(v => v.prompt_id === promptId && v.version === version) || null;
  }

  const { data, error } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('prompt_id', promptId)
    .eq('version', version)
    .single();

  if (error) return null;
  return data;
}

/**
 * Restore a previous version of a prompt (creates a NEW version with the old content).
 *
 * @param {string} promptId
 * @param {number} versionToRestore
 * @param {string} [restoredBy] - User ID
 * @returns {Promise<{version: number}>}
 */
export async function restorePromptVersion(promptId, versionToRestore, restoredBy = null) {
  const versionData = await getPromptVersion(promptId, versionToRestore);
  if (!versionData) throw new Error(`Version ${versionToRestore} not found`);

  return savePromptVersion({
    promptId,
    name: versionData.name,
    content: versionData.content,
    toolType: versionData.tool_type,
    description: `Restored from version ${versionToRestore}`,
    createdBy: restoredBy,
  });
}

/**
 * Get the latest version of a prompt.
 *
 * @param {string} promptId
 * @returns {Promise<object|null>}
 */
export async function getLatestPromptVersion(promptId) {
  const versions = await getPromptVersions(promptId);
  return versions[0] || null;
}

/**
 * Compare two versions of a prompt and return the diff.
 *
 * @param {string} promptId
 * @param {number} versionA
 * @param {number} versionB
 * @returns {Promise<{versionA: object, versionB: object, changes: string[]}>}
 */
export async function comparePromptVersions(promptId, versionA, versionB) {
  const [a, b] = await Promise.all([
    getPromptVersion(promptId, versionA),
    getPromptVersion(promptId, versionB),
  ]);

  if (!a || !b) throw new Error('One or both versions not found');

  const changes = [];

  if (a.name !== b.name) changes.push(`Name changed from "${a.name}" to "${b.name}"`);
  if (a.content !== b.content) changes.push('Content changed');
  if (a.tool_type !== b.tool_type) changes.push(`Tool type changed from "${a.tool_type}" to "${b.tool_type}"`);

  // Content diff (simple line-based)
  const aLines = (a.content || '').split('\n');
  const bLines = (b.content || '').split('\n');
  if (aLines.length !== bLines.length) {
    changes.push(`Line count changed from ${aLines.length} to ${bLines.length}`);
  }

  return {
    versionA: a,
    versionB: b,
    changes: changes.length > 0 ? changes : ['No significant changes detected'],
  };
}

/**
 * Get all unique prompt IDs with their latest version info.
 *
 * @returns {Promise<Array<{prompt_id: string, name: string, latestVersion: number, toolType: string}>>}
 */
export async function getAllPrompts() {
  if (DEV_MODE) {
    const versions = devGet();
    const promptMap = {};
    for (const v of versions) {
      if (!promptMap[v.prompt_id] || promptMap[v.prompt_id].version < v.version) {
        promptMap[v.prompt_id] = v;
      }
    }
    return Object.values(promptMap).map(v => ({
      prompt_id: v.prompt_id,
      name: v.name,
      latestVersion: v.version,
      toolType: v.tool_type,
      updatedAt: v.created_at,
    }));
  }

  // Get distinct prompt IDs with latest version
  const { data, error } = await supabase
    .from('prompt_versions')
    .select('prompt_id, name, version, tool_type, created_at')
    .order('version', { ascending: false });

  if (error) return [];

  const promptMap = {};
  for (const v of data || []) {
    if (!promptMap[v.prompt_id]) {
      promptMap[v.prompt_id] = {
        prompt_id: v.prompt_id,
        name: v.name,
        latestVersion: v.version,
        toolType: v.tool_type,
        updatedAt: v.created_at,
      };
    }
  }

  return Object.values(promptMap);
}
