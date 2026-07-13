/**
 * ─── Audit Log Service ───────────────────────────────────────────
 * Wraps the existing `organization_activity_logs` table for tracking
 * user actions across the application (who did what, when).
 *
 * The SQL table already exists in supabase/migrations/add_organization_management.sql:
 *   - organization_activity_logs
 *   - log_org_activity() RPC function
 *
 * USAGE:
 *   import { logActivity, getActivityLog, getActivityStats } from './auditLogService';
 *
 *   // Log an action
 *   await logActivity({
 *     organizationId: 'uuid',
 *     action: 'task.created',
 *     resourceType: 'task',
 *     resourceId: taskId,
 *     details: { title: 'New task' },
 *   });
 *
 *   // Fetch recent activity
 *   const logs = await getActivityLog(organizationId, { limit: 20 });
 */

import { supabase } from './supabase';
import { AI_TOOL_TYPES } from './ai/config';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;
const DEV_KEY = 'optivian_dev_audit_log';

// ─── Dev mode helpers ────────────────────────────────────────────

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

// ─── Log an activity ─────────────────────────────────────────────

/**
 * Log an activity/audit event.
 *
 * @param {object} params
 * @param {string} params.organizationId - UUID of the organization.
 * @param {string} params.action - Action name (e.g., 'task.created', 'user.invited', 'ai.analysis').
 * @param {string} params.resourceType - Type of resource (e.g., 'task', 'user', 'ai_analysis', 'organization').
 * @param {string} [params.resourceId] - ID of the affected resource.
 * @param {object} [params.details] - Additional JSON details about the action.
 * @param {'info'|'warning'|'error'|'critical'} [params.severity='info'] - Severity level.
 * @returns {Promise<{id?: string, success: boolean, error?: string}>}
 */
export async function logActivity({ organizationId, action, resourceType, resourceId, details = {}, severity = 'info' }) {
  if (!organizationId || !action || !resourceType) {
    return { success: false, error: 'organizationId, action, and resourceType are required' };
  }

  if (DEV_MODE) {
    const logs = devGet();
    const entry = {
      id: uid(),
      organization_id: organizationId,
      action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      details,
      severity,
      created_at: new Date().toISOString(),
    };
    logs.push(entry);
    devSet(logs);

    // Keep dev log manageable (max 500 entries)
    if (logs.length > 500) {
      devSet(logs.slice(-500));
    }

    return { id: entry.id, success: true };
  }

  try {
    // Use the existing RPC function
    const { data, error } = await supabase.rpc('log_org_activity', {
      p_organization_id: organizationId,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId || null,
      p_details: details,
      p_severity: severity,
    });

    if (error) throw error;
    return { id: data, success: true };
  } catch (err) {
    // Fallback: direct insert
    try {
      const { data, error } = await supabase
        .from('organization_activity_logs')
        .insert({
          organization_id: organizationId,
          action,
          resource_type: resourceType,
          resource_id: resourceId || null,
          details,
          severity,
        })
        .select('id')
        .single();

      if (error) throw error;
      return { id: data?.id, success: true };
    } catch (fallbackErr) {
      console.error('[AuditLog] Failed to log activity:', fallbackErr);
      return { success: false, error: fallbackErr.message || 'Failed to log activity' };
    }
  }
}

// ─── Get activity log ────────────────────────────────────────────

/**
 * Fetch activity logs for an organization.
 *
 * @param {string} organizationId
 * @param {object} [options]
 * @param {number} [options.limit=50]
 * @param {number} [options.offset=0]
 * @param {string} [options.action] - Filter by action type.
 * @param {string} [options.resourceType] - Filter by resource type.
 * @param {string} [options.severity] - Filter by severity.
 * @param {string} [options.orderBy='created_at']
 * @param {boolean} [options.ascending=false]
 * @returns {Promise<Array>}
 */
export async function getActivityLog(organizationId, options = {}) {
  if (!organizationId) return [];

  const {
    limit = 50,
    offset = 0,
    action,
    resourceType,
    severity,
    orderBy = 'created_at',
    ascending = false,
  } = options;

  if (DEV_MODE) {
    let logs = devGet()
      .filter(l => l.organization_id === organizationId)
      .sort((a, b) => ascending
        ? new Date(a[orderBy]) - new Date(b[orderBy])
        : new Date(b[orderBy]) - new Date(a[orderBy])
      );

    if (action) logs = logs.filter(l => l.action === action);
    if (resourceType) logs = logs.filter(l => l.resource_type === resourceType);
    if (severity) logs = logs.filter(l => l.severity === severity);

    return logs.slice(offset, offset + limit);
  }

  try {
    let query = supabase
      .from('organization_activity_logs')
      .select('*, actor:actor_id(id, full_name, email, avatar_url)')
      .eq('organization_id', organizationId)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (action) query = query.eq('action', action);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (severity) query = query.eq('severity', severity);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[AuditLog] Failed to fetch activity:', err);
    return [];
  }
}

// ─── Get activity stats ──────────────────────────────────────────

/**
 * Get activity statistics for an organization.
 *
 * @param {string} organizationId
 * @returns {Promise<{total: number, byAction: object, bySeverity: object, recentActivity: number}>}
 */
export async function getActivityStats(organizationId) {
  if (!organizationId) {
    return { total: 0, byAction: {}, bySeverity: {}, recentActivity: 0 };
  }

  if (DEV_MODE) {
    const logs = devGet().filter(l => l.organization_id === organizationId);
    const byAction = {};
    const bySeverity = {};
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    let recentActivity = 0;

    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      bySeverity[log.severity || 'info'] = (bySeverity[log.severity || 'info'] || 0) + 1;
      if (Date.now() - new Date(log.created_at).getTime() < THIRTY_DAYS) {
        recentActivity++;
      }
    }

    return { total: logs.length, byAction, bySeverity, recentActivity };
  }

  try {
    const { data, error } = await supabase
      .from('organization_activity_logs')
      .select('action, severity, created_at')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const logs = data || [];
    const byAction = {};
    const bySeverity = {};
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    let recentActivity = 0;

    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      bySeverity[log.severity || 'info'] = (bySeverity[log.severity || 'info'] || 0) + 1;
      if (Date.now() - new Date(log.created_at).getTime() < THIRTY_DAYS) {
        recentActivity++;
      }
    }

    return { total: logs.length, byAction, bySeverity, recentActivity };
  } catch (err) {
    console.error('[AuditLog] Failed to get stats:', err);
    return { total: 0, byAction: {}, bySeverity: {}, recentActivity: 0 };
  }
}

// ─── Predefined activity actions ─────────────────────────────────

/** Standard action names for consistency across the app. */
export const ACTIVITY_ACTIONS = {
  // Users
  USER_CREATED: 'user.created',
  USER_INVITED: 'user.invited',
  USER_UPDATED: 'user.updated',
  USER_SUSPENDED: 'user.suspended',
  USER_REACTIVATED: 'user.reactivated',
  USER_DELETED: 'user.deleted',
  USER_ROLE_CHANGED: 'user.role_changed',

  // Tasks
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_ASSIGNED: 'task.assigned',
  TASK_COMPLETED: 'task.completed',
  TASK_DELETED: 'task.deleted',

  // Organization
  ORG_UPDATED: 'organization.updated',
  ORG_DELETED: 'organization.deleted',
  ORG_MEMBER_ADDED: 'organization.member_added',
  ORG_MEMBER_REMOVED: 'organization.member_removed',

  // AI
  AI_ANALYSIS_RUN: 'ai.analysis_run',
  AI_PROVIDER_CHANGED: 'ai.provider_changed',
  AI_SETTINGS_CHANGED: 'ai.settings_changed',

  // Security
  LOGIN_SUCCESS: 'auth.login_success',
  LOGIN_FAILED: 'auth.login_failed',
  LOGOUT: 'auth.logout',
  PASSWORD_CHANGED: 'auth.password_changed',
  MFA_ENABLED: 'auth.mfa_enabled',
  MFA_DISABLED: 'auth.mfa_disabled',

  // Settings
  SETTINGS_CHANGED: 'settings.changed',
};
