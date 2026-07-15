/**
 * AI Permission System — Phase B3.1
 *
 * Extends the existing human RBAC (permissions.js) with AI-specific rules:
 *   - Dollar/value limits on financial actions
 *   - Time-based restrictions (e.g., no actions after hours)
 *   - Per-action approval requirements by role
 *   - Safety level overrides per role
 *
 * Reuses: hasPermission, role hierarchy from permissions.js & roles.js
 */

import { hasPermission } from '../../auth/permissions';
import { getRoleInfo } from '../../auth/roles';

// ─── Configuration ────────────────────────────────────────────────

const AI_PERMISSION_CONFIG = {
  // Action-specific spend limits per role (in USD)
  spendLimits: {
    super_admin: { daily: 10000, perAction: 5000 },
    owner: { daily: 10000, perAction: 5000 },
    administrator: { daily: 5000, perAction: 2500 },
    director: { daily: 2000, perAction: 1000 },
    executive: { daily: 1000, perAction: 500 },
    manager: { daily: 500, perAction: 250 },
    assistant_manager: { daily: 200, perAction: 100 },
    team_lead: { daily: 100, perAction: 50 },
    staff: { daily: 50, perAction: 25 },
    intern: { daily: 10, perAction: 5 },
  },

  // Time-based restrictions per safety level
  timeRestrictions: {
    critical: { allowed: true, warning: true }, // Always warn on critical actions
    high: { allowedHours: { start: 6, end: 22 }, warning: true },
    medium: { allowedHours: { start: 0, end: 24 }, warning: false },
    low: { allowedHours: { start: 0, end: 24 }, warning: false },
  },

  // Approval overrides — certain roles can skip approval for certain safety levels
  autoApproveLevels: {
    super_admin: ['low', 'medium', 'high'],
    owner: ['low', 'medium', 'high'],
    administrator: ['low', 'medium'],
    director: ['low', 'medium'],
    manager: ['low'],
    staff: [],
  },

  // Max actions per hour per user (rate limiting for AI actions)
  rateLimits: {
    super_admin: 100,
    owner: 100,
    administrator: 80,
    director: 60,
    executive: 60,
    manager: 40,
    staff: 20,
    intern: 10,
  },
};

// ─── In-memory rate limit tracking ────────────────────────────────

/** @type {Map<string, number[]>} userId → [timestamps] */
const _rateLimitBuckets = new Map();

function _checkRateLimit(userId, role) {
  const limit = AI_PERMISSION_CONFIG.rateLimits[role] || 20;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour

  let timestamps = _rateLimitBuckets.get(userId) || [];
  timestamps = timestamps.filter(t => now - t < windowMs);
  _rateLimitBuckets.set(userId, timestamps);

  if (timestamps.length >= limit) {
    return { allowed: false, reason: `Rate limit exceeded (${limit} actions/hour)` };
  }

  timestamps.push(now);
  _rateLimitBuckets.set(userId, timestamps);
  return { allowed: true };
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Check if a user is allowed to execute an AI action with given params.
 *
 * @param {object} user - User object with id, role, email.
 * @param {object} action - Action definition from actionRegistry.
 * @param {object} [params] - Action parameters (may contain financial data).
 * @returns {{ allowed: boolean, reason?: string, warning?: string }}
 */
export function checkAIActionPermission(user, action, params = {}) {
  if (!user) return { allowed: false, reason: 'No authenticated user' };

  const role = user.user_metadata?.role || user.role || 'staff';
  const normalizedRole = role.toString().toLowerCase().replace(/\s+/g, '_');

  // 1. Rate limit check
  const rateCheck = _checkRateLimit(user.id, normalizedRole);
  if (!rateCheck.allowed) return rateCheck;

  // 2. Spend limit check (for financial actions)
  if (action.safetyLevel === 'critical' || action.safetyLevel === 'high') {
    const spendLimit = AI_PERMISSION_CONFIG.spendLimits[normalizedRole];
    const actionValue = params.amount || params.value || params.cost || 0;

    if (spendLimit && actionValue > 0) {
      if (actionValue > spendLimit.perAction) {
        return {
          allowed: false,
          reason: `Action value ($${actionValue}) exceeds per-action limit ($${spendLimit.perAction}) for ${normalizedRole}`,
        };
      }
    }
  }

  // 3. Time-based restriction check
  const timeRestriction = AI_PERMISSION_CONFIG.timeRestrictions[action.safetyLevel || 'medium'];
  if (timeRestriction?.allowedHours) {
    const currentHour = new Date().getHours();
    const { start, end } = timeRestriction.allowedHours;
    if (currentHour < start || currentHour >= end) {
      return {
        allowed: false,
        reason: `Actions with safety level "${action.safetyLevel}" are restricted between ${start}:00 and ${end}:00`,
      };
    }
  }

  // 4. Check if action can auto-approve based on role
  const autoApproveLevels = AI_PERMISSION_CONFIG.autoApproveLevels[normalizedRole] || [];
  const canAutoApprove = autoApproveLevels.includes(action.safetyLevel || 'medium');

  // 5. Warning for critical actions
  let warning = null;
  if (timeRestriction?.warning && action.safetyLevel === 'critical') {
    warning = `This is a critical action. Please review carefully before approving.`;
  }

  // 6. Check basic permission using existing RBAC
  const resourceMap = {
    low: 'tasks',
    medium: 'tasks',
    high: 'settings',
    critical: 'audit_logs',
  };
  const resource = resourceMap[action.safetyLevel] || 'tasks';
  const actionPerm = action.safetyLevel === 'critical' ? 'manage' : 'edit';

  if (!hasPermission(normalizedRole, resource, actionPerm)) {
    return {
      allowed: false,
      reason: `Role "${normalizedRole}" lacks permission "${actionPerm}" on "${resource}" for AI action`,
    };
  }

  return { allowed: true, canAutoApprove, warning };
}

/**
 * Check if a user can skip approval for a given safety level.
 * @param {object} user
 * @param {string} safetyLevel
 * @returns {boolean}
 */
export function canAutoApprove(user, safetyLevel = 'medium') {
  if (!user) return false;
  const role = user.user_metadata?.role || user.role || 'staff';
  const normalizedRole = role.toString().toLowerCase().replace(/\s+/g, '_');
  const levels = AI_PERMISSION_CONFIG.autoApproveLevels[normalizedRole] || [];
  return levels.includes(safetyLevel);
}

/**
 * Get spend limits for a user's role.
 * @param {object} user
 * @returns {{ daily: number, perAction: number }|null}
 */
export function getSpendLimits(user) {
  if (!user) return null;
  const role = user.user_metadata?.role || user.role || 'staff';
  const normalizedRole = role.toString().toLowerCase().replace(/\s+/g, '_');
  return AI_PERMISSION_CONFIG.spendLimits[normalizedRole] || null;
}

/**
 * Get the full AI permission config (for admin UI).
 * @returns {object}
 */
export function getAIPermissionConfig() {
  return AI_PERMISSION_CONFIG;
}

/**
 * Reset rate limit tracking for a user (for testing/admin).
 * @param {string} userId
 */
export function resetRateLimit(userId) {
  _rateLimitBuckets.delete(userId);
}
