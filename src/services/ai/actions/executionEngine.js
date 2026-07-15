/**
 * Execution Engine — Phase B2
 *
 * Orchestrates the full lifecycle of AI-proposed actions:
 *
 *   1. Intent Parsing — Extract actionable intents from AI response text
 *   2. Validation — Validate intents against the action registry
 *   3. Permission Check — Verify user has permission to execute
 *   4. Approval — Send for user approval if required (B4)
 *   5. Execution — Execute the action handler
 *   6. Result Reporting — Return structured results with rollback support
 *
 * Flow:
 *   AI generates response text
 *     → parseIntent(response, toolType)
 *     → validateIntent(intent)
 *     → checkPermission(intent, user)
 *     → proposeAction(intent, user, context) [if needs approval]
 *     → executeApprovedAction(intentId) / rejectAction(intentId)
 *     → rollbackCompletedAction(intentId) [one-click undo]
 */

import {
  executeAction,
  getAction,
  getAllActions,
  requiresApproval,
  rollbackAction,
  getActionLog,
} from './actionRegistry';

import { hasPermission } from '../../auth/permissions';

// ─── Pending Intent Queue ────────────────────────────────────────
// Maps intentId → { intent, user, context, status, result }

/** @type {Map<string, PendingIntent>} */
const _pendingIntents = new Map();
let _intentCounter = 0;

// ─── Internal Helpers ────────────────────────────────────────────

function _generateIntentId() {
  _intentCounter += 1;
  return `intent_${Date.now().toString(36)}_${_intentCounter}`;
}

// ─── 1. Intent Parsing ───────────────────────────────────────────

/**
 * Parse an AI response text to extract actionable intents.
 *
 * Supports two formats:
 *   - JSON blocks: ```json { "action": "create_task", ... } ```
 *   - Inline markers: - Action: create_task — params
 *
 * @param {string}  response       The raw AI response text.
 * @param {string}  [toolType]     The AI tool type that generated this response.
 * @param {object}  [options]
 * @param {boolean} [options.parseAllActions=false] Return all found actions, not just relevant ones.
 * @returns {Array<{ actionName: string, params: object, raw: string, confidence: 'high'|'medium'|'low' }>}
 */
export function parseIntent(response, toolType, options = {}) {
  if (!response) return [];

  const intents = [];
  const jsonActionNames = new Set();

  // ── Pattern 1: JSON blocks ──────────────────────────────────
  const jsonBlockRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/g;
  let match;
  while ((match = jsonBlockRegex.exec(response)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);

      // Single action
      if (parsed.action || parsed.actionName) {
        const actionName = parsed.action || parsed.actionName;
        jsonActionNames.add(actionName);
        intents.push({
          actionName,
          params: parsed.params || parsed.parameters || {},
          raw: match[1],
          confidence: parsed.confidence || 'high',
        });
      }

      // Multiple actions (array or { actions: [...] })
      const actions = parsed.actions || (Array.isArray(parsed) ? parsed : null);
      if (actions && Array.isArray(actions)) {
        for (const act of actions) {
          if (act.action || act.actionName) {
            const actionName = act.action || act.actionName;
            jsonActionNames.add(actionName);
            intents.push({
              actionName,
              params: act.params || act.parameters || {},
              raw: JSON.stringify(act),
              confidence: act.confidence || 'high',
            });
          }
        }
      }
    } catch {
      // Skip invalid JSON blocks
    }
  }

  // ── Pattern 2: Inline action markers ────────────────────────
  const inlineRegex = /[-*]\s*(?:Action|action|Do|create|update|delete|send)\s*:\s*`?(\w+)`?(?:\s*[-–]\s*([\s\S]*?))?(?=\n\s*[-*]\s*(?:Action|action|Do|create|update|delete|send)\s*:|\n\n|$)/gi;
  while ((match = inlineRegex.exec(response)) !== null) {
    const actionName = match[1].trim();
    const paramsStr = (match[2] || '').trim();

    const params = {};
    if (paramsStr) {
      const kvRegex = /(\w+)\s*:\s*"([^"]*)"|(\w+)\s*:\s*'([^']*)'|(\w+)\s*:\s*(\S+)/g;
      let kvMatch;
      while ((kvMatch = kvRegex.exec(paramsStr)) !== null) {
        const key = kvMatch[1] || kvMatch[3] || kvMatch[5];
        let value = kvMatch[2] || kvMatch[4] || kvMatch[6];
        if (!isNaN(value) && value.trim() !== '') value = Number(value);
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        params[key] = value;
      }
    }

    // Deduplicate against JSON patterns
    if (!jsonActionNames.has(actionName)) {
      intents.push({
        actionName,
        params,
        raw: match[0],
        confidence: 'medium',
      });
    }
  }

  // ── Pattern 3: Bracketed action markers ─────────────────────
  const bracketRegex = /\[(?:Action|action):\s*(\w+)(?:\s*seed:\s*(\d+))?\]([\s\S]*?)(?=\[(?:Action|action):|\n\n|$)/gi;
  while ((match = bracketRegex.exec(response)) !== null) {
    const actionName = match[1].trim();
    const paramsStr = (match[3] || '').trim();

    // Deduplicate against JSON + inline patterns
    if (jsonActionNames.has(actionName) || intents.find(i => i.actionName === actionName)) continue;

    const params = {};
    if (paramsStr) {
      const kvRegex = /(\w+)\s*[:=]\s*"([^"]*)"|(\w+)\s*[:=]\s*'([^']*)'|(\w+)\s*[:=]\s*(\S+)/g;
      let kvMatch;
      while ((kvMatch = kvRegex.exec(paramsStr)) !== null) {
        const key = kvMatch[1] || kvMatch[3] || kvMatch[5];
        let value = kvMatch[2] || kvMatch[4] || kvMatch[6];
        if (!isNaN(value) && value.trim() !== '') value = Number(value);
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        params[key] = value;
      }
    }

    intents.push({
      actionName,
      params,
      raw: match[0],
      confidence: 'medium',
    });
  }

  return intents;
}

// ─── 2. Validation ───────────────────────────────────────────────

/**
 * Validate an intent against the action registry.
 *
 * @param {{ actionName: string, params: object }} intent
 * @returns {{ valid: boolean, action?: object, error?: string }}
 */
export function validateIntent(intent) {
  if (!intent || !intent.actionName) {
    return { valid: false, error: 'Intent missing actionName' };
  }

  const action = getAction(intent.actionName);
  if (!action) {
    return {
      valid: false,
      error: `Action "${intent.actionName}" not found in registry. Available: ${getAllActions().map(a => a.actionName).join(', ')}`,
    };
  }

  // Basic param validation — handler is responsible for deeper validation
  return { valid: true, action };
}

// ─── 3. Permission Check ─────────────────────────────────────────

/**
 * Map safety level to required permission scope.
 * 'low' → can manage own tasks
 * 'medium' → can manage team/org tasks
 * 'high' → can manage users/roles/settings
 * 'critical' → admin only
 */
const SAFETY_TO_PERMISSION = {
  low: { resource: 'tasks', action: 'edit' },
  medium: { resource: 'tasks', action: 'manage' },
  high: { resource: 'settings', action: 'manage' },
  critical: { resource: 'audit_logs', action: 'manage' },
};

/**
 * Check if a user has permission to execute an intent's action.
 *
 * @param {{ actionName: string }} intent
 * @param {object} user - User object with role/user_metadata.
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function checkPermission(intent, user) {
  if (!user) {
    return { allowed: false, reason: 'No authenticated user' };
  }

  const action = getAction(intent.actionName);
  if (!action) {
    return { allowed: false, reason: `Action "${intent.actionName}" not registered` };
  }

  const role = user.user_metadata?.role || user.role || 'staff';
  const permission = SAFETY_TO_PERMISSION[action.safetyLevel] || SAFETY_TO_PERMISSION.medium;

  const permitted = hasPermission(role, permission.resource, permission.action);

  if (!permitted) {
    return {
      allowed: false,
      reason: `Role "${role}" lacks permission "${permission.action}" on "${permission.resource}" for safety level "${action.safetyLevel}"`,
    };
  }

  return { allowed: true, role };
}

// ─── 4. Approval Workflow (B4) ───────────────────────────────────

/**
 * Propose an action to the user for approval.
 * The proposal is stored in the pending queue until approved or rejected.
 *
 * @param {{ actionName: string, params: object, confidence?: string }} intent
 * @param {object}  user
 * @param {object}  [context={}]  Additional execution context.
 * @param {string}  [context.toolType]  The AI tool type that generated this intent.
 * @param {string}  [context.conversationId]
 * @returns {PendingIntent}
 */
export function proposeAction(intent, user, context = {}) {
  const id = _generateIntentId();
  const action = getAction(intent.actionName);

  const proposal = {
    id,
    actionName: intent.actionName,
    label: action?.label || intent.actionName,
    description: action?.description || '',
    params: { ...intent.params },
    confidence: intent.confidence || 'medium',
    safetyLevel: action?.safetyLevel || 'medium',
    proposedBy: user?.id,
    proposedByEmail: user?.email || '',
    proposedAt: new Date().toISOString(),
    status: 'pending',   // pending | approved | rejected | completed | failed | rolled_back
    context: { ...context },
    result: null,
    error: null,
  };

  _pendingIntents.set(id, proposal);

  // Auto-expire pending intents after 30 minutes
  setTimeout(() => {
    const current = _pendingIntents.get(id);
    if (current && current.status === 'pending') {
      current.status = 'expired';
      current.expiredAt = new Date().toISOString();
    }
  }, 30 * 60 * 1000);

  return proposal;
}

/**
 * Approve a pending intent and execute it.
 *
 * @param {string} intentId
 * @param {object} user - The approving user.
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export async function approveAndExecute(intentId, user) {
  const proposal = _pendingIntents.get(intentId);
  if (!proposal) {
    return { success: false, error: `Intent "${intentId}" not found in pending queue` };
  }

  if (proposal.status !== 'pending') {
    return { success: false, error: `Intent "${intentId}" is not pending (status: ${proposal.status})` };
  }

  proposal.status = 'approved';
  proposal.approvedBy = user?.id;
  proposal.approvedAt = new Date().toISOString();

  try {
    const execCtx = { user, ...proposal.context };
    const result = await executeAction(proposal.actionName, proposal.params, execCtx);
    proposal.status = 'completed';
    proposal.result = result;
    proposal.completedAt = new Date().toISOString();
    return { success: true, data: result };
  } catch (err) {
    proposal.status = 'failed';
    proposal.error = err.message;
    proposal.failedAt = new Date().toISOString();
    return { success: false, error: err.message };
  }
}

/**
 * Reject a pending intent without executing it.
 *
 * @param {string} intentId
 * @param {string} [reason]
 * @returns {PendingIntent}
 */
export function rejectAction(intentId, reason = 'Rejected by user') {
  const proposal = _pendingIntents.get(intentId);
  if (!proposal) {
    throw new Error(`Intent "${intentId}" not found`);
  }

  proposal.status = 'rejected';
  proposal.rejectedAt = new Date().toISOString();
  proposal.rejectionReason = reason;
  return proposal;
}

/**
 * Dismiss a pending intent (removes from queue without rejecting).
 * @param {string} intentId
 */
export function dismissAction(intentId) {
  _pendingIntents.delete(intentId);
}

// ─── 5. Rollback ─────────────────────────────────────────────────

/**
 * Rollback a completed action using its rollback handler.
 *
 * @param {string} intentId
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export async function rollbackCompletedAction(intentId) {
  const proposal = _pendingIntents.get(intentId);
  if (!proposal) {
    return { success: false, error: `Intent "${intentId}" not found` };
  }

  if (proposal.status !== 'completed') {
    return { success: false, error: `Only completed actions can be rolled back (status: ${proposal.status})` };
  }

  try {
    const execCtx = { ...proposal.context };
    if (proposal.approvedBy) {
      execCtx.user = { id: proposal.approvedBy };
    }

    // Use top-level import (already imported at module level)
    const result = await rollbackAction(proposal.actionName, proposal.params, execCtx);
    proposal.status = 'rolled_back';
    proposal.rolledBackAt = new Date().toISOString();
    proposal.rollbackResult = result;

    return { success: true, data: result };
  } catch (err) {
    proposal.status = 'rollback_failed';
    proposal.rollbackError = err.message;
    return { success: false, error: err.message };
  }
}

// ─── 6. Complete Pipeline ────────────────────────────────────────

/**
 * Process an AI response through the full execution pipeline.
 *
 * Steps:
 *   1. Parse intents from the response
 *   2. Validate each intent
 *   3. Check permissions
 *   4. Auto-execute low-safety actions OR propose for approval
 *   5. Return proposals and auto-execution results
 *
 * @param {string}  response  The raw AI response text.
 * @param {string}  toolType  The AI tool type.
 * @param {object}  user      The current user.
 * @param {object}  [context={}]
 * @returns {Promise<{
 *   proposals: PendingIntent[],
 *   autoExecuted: Array<{ actionName: string, success: boolean, data?: any, error?: string }>,
 *   errors: Array<{ actionName: string, error: string }>
 * }>}
 */
export async function processAIResponse(response, toolType, user, context = {}) {
  const intents = parseIntent(response, toolType);
  const proposals = [];
  const autoExecuted = [];
  const errors = [];

  for (const intent of intents) {
    // Validate
    const validation = validateIntent(intent);
    if (!validation.valid) {
      errors.push({ actionName: intent.actionName, error: validation.error });
      continue;
    }

    // Check permission
    const permission = checkPermission(intent, user);
    if (!permission.allowed) {
      errors.push({ actionName: intent.actionName, error: permission.reason });
      continue;
    }

    const needsApprovalFlag = requiresApproval(intent.actionName);
    const isHighSafety = validation.action.safetyLevel === 'high' || validation.action.safetyLevel === 'critical';

    if (needsApprovalFlag || isHighSafety) {
      // Propose for user approval
      const proposal = proposeAction(intent, user, { ...context, toolType });
      proposals.push(proposal);
    } else {
      // Auto-execute low-safety actions
      try {
        const execCtx = { user, ...context, toolType };
        const result = await executeAction(intent.actionName, intent.params, execCtx);
        autoExecuted.push({
          actionName: intent.actionName,
          success: true,
          data: result.data,
        });
      } catch (err) {
        autoExecuted.push({
          actionName: intent.actionName,
          success: false,
          error: err.message,
        });
      }
    }
  }

  return { proposals, autoExecuted, errors };
}

// ─── Query Methods ───────────────────────────────────────────────

/**
 * Get all pending intents for a given user.
 *
 * @param {string} userId
 * @returns {PendingIntent[]}
 */
export function getPendingIntents(userId) {
  return Array.from(_pendingIntents.values())
    .filter(i => i.status === 'pending' && i.proposedBy === userId);
}

/**
 * Get all pending intents for any user (admin view).
 * @returns {PendingIntent[]}
 */
export function getAllPendingIntents() {
  return Array.from(_pendingIntents.values())
    .filter(i => i.status === 'pending');
}

/**
 * Get a specific intent by ID.
 * @param {string} intentId
 * @returns {PendingIntent|undefined}
 */
export function getIntent(intentId) {
  return _pendingIntents.get(intentId);
}

/**
 * Get all intents with a specific status.
 * @param {string} status - 'pending' | 'approved' | 'completed' | 'rejected' | 'failed' | 'rolled_back'
 * @param {number} [limit=50]
 * @returns {PendingIntent[]}
 */
export function getIntentsByStatus(status, limit = 50) {
  return Array.from(_pendingIntents.values())
    .filter(i => i.status === status)
    .slice(-limit)
    .reverse();
}

/**
 * Get the full execution log (from both the engine and the registry).
 * @param {number} [limit=50]
 * @returns {Array<object>}
 */
export function getExecutionLog(limit = 50) {
  const intents = Array.from(_pendingIntents.values())
    .slice(-limit)
    .reverse()
    .map(i => ({
      id: i.id,
      actionName: i.actionName,
      label: i.label,
      status: i.status,
      proposedBy: i.proposedBy,
      proposedAt: i.proposedAt,
      approvedAt: i.approvedAt,
      completedAt: i.completedAt,
      rolledBackAt: i.rolledBackAt,
      error: i.error,
      safetyLevel: i.safetyLevel,
    }));

  const registryLog = getActionLog(limit);

  return {
    intents,
    registryLog,
  };
}

/**
 * Clear all expired or rejected intents from the queue.
 * @param {number} [maxAgeMs=3600000] - Max age in ms (default 1 hour).
 * @returns {number} Number of intents cleaned up.
 */
export function cleanPendingQueue(maxAgeMs = 3600000) {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, intent] of _pendingIntents.entries()) {
    const age = now - new Date(intent.proposedAt).getTime();
    if (age > maxAgeMs || intent.status === 'rejected' || intent.status === 'expired') {
      _pendingIntents.delete(id);
      cleaned++;
    }
  }

  return cleaned;
}
