/**
 * ─── RBAC Permission System ───────────────────────────────────────
 * Defines every resource + action in the app and maps role → granted permissions.
 *
 * Resources: Users, Tasks, Chat, AI, Reports, Dashboard, Analytics,
 *            Organization, Billing, Settings, Documents, Notifications, Audit Logs
 *
 * Actions per resource: view, create, edit, delete, manage
 *
 * This file is the single source of truth for all access control.
 */

/** All available resources */
export const RESOURCES = {
  USERS: 'users',
  TASKS: 'tasks',
  CHAT: 'chat',
  AI: 'ai',
  REPORTS: 'reports',
  DASHBOARD: 'dashboard',
  ANALYTICS: 'analytics',
  ORGANIZATION: 'organization',
  BILLING: 'billing',
  SETTINGS: 'settings',
  DOCUMENTS: 'documents',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs',
};

/** All available actions */
export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  MANAGE: 'manage',
};

/**
 * Full permission map.
 *
 * Each role is an object keyed by RESOURCE. The value is an array of ACTIONS
 * granted for that resource. A role without a key has no access to that resource.
 *
 * "manage" implies all lower actions (view, create, edit, delete).
 */
const PERMISSION_MAP = {
  // ── Super Admin ── unrestricted access to everything
  super_admin: {
    users: ['manage'],
    tasks: ['manage'],
    chat: ['manage'],
    ai: ['manage'],
    reports: ['manage'],
    dashboard: ['manage'],
    analytics: ['manage'],
    organization: ['manage'],
    billing: ['manage'],
    settings: ['manage'],
    documents: ['manage'],
    notifications: ['manage'],
    audit_logs: ['manage'],
  },

  // ── Owner ── same as super_admin
  owner: {
    users: ['manage'],
    tasks: ['manage'],
    chat: ['manage'],
    ai: ['manage'],
    reports: ['manage'],
    dashboard: ['manage'],
    analytics: ['manage'],
    organization: ['manage'],
    billing: ['manage'],
    settings: ['manage'],
    documents: ['manage'],
    notifications: ['manage'],
    audit_logs: ['manage'],
  },

  // ── Administrator ── full access but cannot delete org or manage billing
  administrator: {
    users: ['manage'],
    tasks: ['manage'],
    chat: ['manage'],
    ai: ['manage'],
    reports: ['manage'],
    dashboard: ['manage'],
    analytics: ['manage'],
    organization: ['view', 'edit'],
    billing: ['view'],
    settings: ['manage'],
    documents: ['manage'],
    notifications: ['manage'],
    audit_logs: ['view'],
  },

  // ── Director ── views org-level data, manages teams
  director: {
    users: ['view', 'create', 'edit'],
    tasks: ['manage'],
    chat: ['manage'],
    ai: ['view', 'create'],
    reports: ['view', 'create'],
    dashboard: ['view'],
    analytics: ['view'],
    organization: ['view'],
    billing: [],
    settings: ['view', 'edit'],
    documents: ['view', 'create', 'edit'],
    notifications: ['view'],
    audit_logs: ['view'],
  },

  // ── Executive ── strategic oversight
  executive: {
    users: ['view'],
    tasks: ['view', 'create'],
    chat: ['manage'],
    ai: ['view', 'create'],
    reports: ['view', 'create'],
    dashboard: ['view'],
    analytics: ['view'],
    organization: ['view'],
    billing: [],
    settings: ['view'],
    documents: ['view', 'create'],
    notifications: ['view'],
    audit_logs: ['view'],
  },

  // ── Manager ── operational lead
  manager: {
    users: ['view', 'create'],
    tasks: ['manage'],
    chat: ['manage'],
    ai: ['view', 'create'],
    reports: ['view', 'create'],
    dashboard: ['view'],
    analytics: ['view'],
    organization: ['view'],
    billing: [],
    settings: ['view', 'edit'],
    documents: ['view', 'create', 'edit'],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── Assistant Manager ── limited management
  assistant_manager: {
    users: ['view'],
    tasks: ['view', 'create', 'edit'],
    chat: ['manage'],
    ai: ['view'],
    reports: ['view'],
    dashboard: ['view'],
    analytics: ['view'],
    organization: ['view'],
    billing: [],
    settings: ['view'],
    documents: ['view', 'create'],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── Team Lead ── manages their team's tasks
  team_lead: {
    users: ['view'],
    tasks: ['view', 'create', 'edit'],
    chat: ['manage'],
    ai: ['view'],
    reports: ['view'],
    dashboard: ['view'],
    analytics: [],
    organization: ['view'],
    billing: [],
    settings: ['view'],
    documents: ['view', 'create'],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── HR ── people operations
  hr: {
    users: ['view', 'create', 'edit'],
    tasks: ['view'],
    chat: ['view', 'create'],
    ai: ['view'],
    reports: ['view', 'create'],
    dashboard: ['view'],
    analytics: ['view'],
    organization: ['view'],
    billing: [],
    settings: ['view'],
    documents: ['view', 'create'],
    notifications: ['manage'],
    audit_logs: [],
  },

  // ── Finance ── billing & reports
  finance: {
    users: ['view'],
    tasks: ['view'],
    chat: ['view', 'create'],
    ai: ['view'],
    reports: ['manage'],
    dashboard: ['view'],
    analytics: ['view'],
    organization: ['view'],
    billing: ['manage'],
    settings: ['view'],
    documents: ['view', 'create'],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── Marketing ── content & analytics
  marketing: {
    users: ['view'],
    tasks: ['view', 'create'],
    chat: ['manage'],
    ai: ['view', 'create'],
    reports: ['view', 'create'],
    dashboard: ['view'],
    analytics: ['view'],
    organization: ['view'],
    billing: [],
    settings: ['view'],
    documents: ['view', 'create', 'edit'],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── Sales ── CRM & pipeline
  sales: {
    users: ['view'],
    tasks: ['view', 'create'],
    chat: ['manage'],
    ai: ['view'],
    reports: ['view'],
    dashboard: ['view'],
    analytics: ['view'],
    organization: ['view'],
    billing: [],
    settings: ['view'],
    documents: ['view', 'create'],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── Operations ── task & workflow management
  operations: {
    users: ['view'],
    tasks: ['manage'],
    chat: ['manage'],
    ai: ['view'],
    reports: ['view'],
    dashboard: ['view'],
    analytics: ['view'],
    organization: ['view'],
    billing: [],
    settings: ['view'],
    documents: ['view', 'create'],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── Developer ── engineering access
  developer: {
    users: ['view'],
    tasks: ['view', 'create', 'edit'],
    chat: ['manage'],
    ai: ['view', 'create'],
    reports: ['view'],
    dashboard: ['view'],
    analytics: ['view'],
    organization: ['view'],
    billing: [],
    settings: ['view', 'edit'],
    documents: ['manage'],
    notifications: ['view'],
    audit_logs: ['view'],
  },

  // ── Designer ── creative tools
  designer: {
    users: ['view'],
    tasks: ['view', 'create', 'edit'],
    chat: ['manage'],
    ai: ['view', 'create'],
    reports: ['view'],
    dashboard: ['view'],
    analytics: [],
    organization: ['view'],
    billing: [],
    settings: ['view'],
    documents: ['manage'],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── QA ── testing focus
  qa: {
    users: ['view'],
    tasks: ['view', 'create', 'edit'],
    chat: ['manage'],
    ai: ['view'],
    reports: ['view', 'create'],
    dashboard: ['view'],
    analytics: [],
    organization: ['view'],
    billing: [],
    settings: ['view'],
    documents: ['view'],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── Support ── customer-facing
  support: {
    users: ['view'],
    tasks: ['view', 'create'],
    chat: ['manage'],
    ai: ['view'],
    reports: ['view'],
    dashboard: ['view'],
    analytics: [],
    organization: ['view'],
    billing: [],
    settings: ['view'],
    documents: ['view', 'create'],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── Staff ── basic employee access
  staff: {
    users: ['view'],
    tasks: ['view'],
    chat: ['view', 'create'],
    ai: ['view'],
    reports: [],
    dashboard: ['view'],
    analytics: [],
    organization: ['view'],
    billing: [],
    settings: ['view', 'edit'],
    documents: ['view', 'create'],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── Intern ── limited access
  intern: {
    users: ['view'],
    tasks: ['view'],
    chat: ['view', 'create'],
    ai: ['view'],
    reports: [],
    dashboard: ['view'],
    analytics: [],
    organization: ['view'],
    billing: [],
    settings: ['view'],
    documents: ['view'],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── Client ── external
  client: {
    users: ['view'],
    tasks: ['view'],
    chat: ['view', 'create'],
    ai: [],
    reports: ['view'],
    dashboard: ['view'],
    analytics: [],
    organization: ['view'],
    billing: [],
    settings: ['view'],
    documents: ['view'],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── Guest ── minimal
  guest: {
    users: [],
    tasks: [],
    chat: ['view'],
    ai: [],
    reports: [],
    dashboard: ['view'],
    analytics: [],
    organization: ['view'],
    billing: [],
    settings: [],
    documents: [],
    notifications: ['view'],
    audit_logs: [],
  },

  // ── Viewer ── read-only
  viewer: {
    users: ['view'],
    tasks: ['view'],
    chat: ['view'],
    ai: ['view'],
    reports: ['view'],
    dashboard: ['view'],
    analytics: ['view'],
    organization: ['view'],
    billing: ['view'],
    settings: ['view'],
    documents: ['view'],
    notifications: ['view'],
    audit_logs: ['view'],
  },
};

/**
 * Normalise a role string to lowercase, underscored form.
 * e.g. "Assistant Manager" → "assistant_manager"
 * e.g. "admin" → "administrator" (alias mapping)
 */
const ROLE_ALIASES = {
  admin: 'administrator',
};

function normalizeRole(role) {
  const normalized = role
    ?.toString()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z_]/g, '') || 'staff';
  
  // Resolve aliases so role strings like 'admin' map to known permission entries
  return ROLE_ALIASES[normalized] || normalized;
}

/**
 * Check if a role has a specific action on a resource.
 * "manage" implies all lower actions.
 */
export function hasPermission(role, resource, action) {
  const normalizedRole = normalizeRole(role);
  const rolePerms = PERMISSION_MAP[normalizedRole];
  if (!rolePerms) return false;

  const actions = rolePerms[resource];
  if (!actions || actions.length === 0) return false;
  if (actions.includes('manage')) return true;
  return actions.includes(action);
}

/**
 * Check if a role has ANY of the specified actions on a resource.
 */
export function hasAnyPermission(role, resource, ...actions) {
  return actions.some(action => hasPermission(role, resource, action));
}

/**
 * Check if a role has ALL of the specified actions on a resource.
 */
export function hasAllPermissions(role, resource, ...actions) {
  return actions.every(action => hasPermission(role, resource, action));
}

/**
 * Get the full permission object for a role.
 */
export function getPermissions(role) {
  const normalizedRole = normalizeRole(role);
  return PERMISSION_MAP[normalizedRole] || PERMISSION_MAP.staff;
}

/**
 * Get all roles that have a specific resource+action permission.
 */
export function getRolesWithPermission(resource, action) {
  return Object.entries(PERMISSION_MAP)
    .filter(([, perms]) => {
      const actions = perms[resource];
      return actions && (actions.includes('manage') || actions.includes(action));
    })
    .map(([role]) => role);
}

export { PERMISSION_MAP };
