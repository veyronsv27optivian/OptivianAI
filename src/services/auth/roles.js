/**
 * ─── Role Definitions ──────────────────────────────────────────────
 * All roles with display names, descriptions, and hierarchical ranking.
 *
 * Roles are permission-based (not hardcoded access checks).
 * This file provides display metadata and hierarchy for UI components
 * like role pickers in admin panels.
 */

/** All available roles with their display info */
export const roles = [
  { id: 'super_admin',        label: 'Super Admin',       rank: 100, color: 'text-red-600',  bg: 'bg-red-50',    description: 'Unrestricted system-wide access' },
  { id: 'administrator',      label: 'Administrator',     rank: 95,  color: 'text-orange-600', bg: 'bg-orange-50', description: 'Full organization access' },
  { id: 'director',           label: 'Director',          rank: 75,  color: 'text-amber-600', bg: 'bg-amber-50',  description: 'Strategic team management' },
  { id: 'executive',          label: 'Executive',         rank: 70,  color: 'text-amber-600', bg: 'bg-amber-50',  description: 'Strategic oversight' },
  { id: 'manager',            label: 'Manager',           rank: 60,  color: 'text-violet-600', bg: 'bg-violet-50', description: 'Operational team lead' },
  { id: 'assistant_manager',  label: 'Assistant Manager',  rank: 55,  color: 'text-violet-600', bg: 'bg-violet-50', description: 'Supports management' },
  { id: 'team_lead',          label: 'Team Lead',          rank: 50,  color: 'text-indigo-600', bg: 'bg-indigo-50', description: 'Team-level task management' },
  { id: 'hr',                 label: 'HR',                rank: 45,  color: 'text-pink-600',  bg: 'bg-pink-50',   description: 'People operations' },
  { id: 'finance',            label: 'Finance',           rank: 45,  color: 'text-emerald-600', bg: 'bg-emerald-50', description: 'Financial management' },
  { id: 'marketing',          label: 'Marketing',         rank: 40,  color: 'text-sky-600',   bg: 'bg-sky-50',    description: 'Marketing & content' },
  { id: 'sales',              label: 'Sales',             rank: 40,  color: 'text-cyan-600',  bg: 'bg-cyan-50',   description: 'Sales & CRM' },
  { id: 'operations',         label: 'Operations',        rank: 40,  color: 'text-teal-600',  bg: 'bg-teal-50',   description: 'Workflow management' },
  { id: 'developer',          label: 'Developer',         rank: 35,  color: 'text-blue-600',  bg: 'bg-blue-50',   description: 'Engineering & development' },
  { id: 'designer',           label: 'Designer',          rank: 35,  color: 'text-purple-600', bg: 'bg-purple-50', description: 'Design & creative' },
  { id: 'qa',                 label: 'QA',                rank: 35,  color: 'text-lime-600',  bg: 'bg-lime-50',   description: 'Quality assurance' },
  { id: 'support',            label: 'Support',           rank: 30,  color: 'text-slate-600', bg: 'bg-slate-100', description: 'Customer support' },
  { id: 'staff',              label: 'Staff',             rank: 25,  color: 'text-emerald-600', bg: 'bg-emerald-50', description: 'Regular employee' },
  { id: 'intern',             label: 'Intern',            rank: 20,  color: 'text-slate-600', bg: 'bg-slate-100', description: 'Temporary team member' },
  { id: 'client',             label: 'Client',            rank: 15,  color: 'text-slate-600', bg: 'bg-slate-100', description: 'External client access' },
  { id: 'guest',              label: 'Guest',             rank: 10,  color: 'text-slate-500', bg: 'bg-slate-50',  description: 'Limited guest access' },
  { id: 'viewer',             label: 'Viewer',            rank: 5,   color: 'text-slate-500', bg: 'bg-slate-50',  description: 'Read-only access' },
].sort((a, b) => b.rank - a.rank);

/** Quick lookup by role id */
const roleMap = {};
roles.forEach(r => { roleMap[r.id] = r; });

// ── Deprecated role aliases ─────────────────────────────────────
// These role IDs may exist in stored user data but should map to
// their modern equivalents for display purposes.
const DEPRECATED_ROLE_ALIASES = {
  // 'owner' was replaced by 'administrator' — keep display consistent
  owner: 'administrator',
  // 'admin' maps to 'administrator' (used as DB-safe fallback role)
  admin: 'administrator',
};

/**
 * Get display info for a role.
 */
export function getRoleInfo(roleId) {
  const normalized = roleId?.toString().toLowerCase().replace(/\s+/g, '_') || 'staff';
  // Check for deprecated role aliases first
  const resolved = DEPRECATED_ROLE_ALIASES[normalized] || normalized;
  return roleMap[resolved] || roleMap.staff;
}

/**
 * Check if a role is at least a certain rank (higher or equal).
 */
export function isRoleAtLeast(roleId, minRoleId) {
  const role = getRoleInfo(roleId);
  const minRole = getRoleInfo(minRoleId);
  return role.rank >= minRole.rank;
}

/**
 * Get all roles that are at or below a given rank (for delegation).
 */
export function getRolesUpTo(roleId) {
  const role = getRoleInfo(roleId);
  return roles.filter(r => r.rank <= role.rank);
}

/**
 * Get all roles that are strictly lower rank (for selection in admin UI).
 */
export function getLowerRoles(roleId) {
  const role = getRoleInfo(roleId);
  return roles.filter(r => r.rank < role.rank);
}

/**
 * Get role ranks for sorting: higher rank = more permissions.
 */
export const roleHierarchy = {
  super_admin: 100,
  administrator: 95,
  director: 75,
  executive: 70,
  manager: 60,
  assistant_manager: 55,
  team_lead: 50,
  hr: 45,
  finance: 45,
  marketing: 40,
  sales: 40,
  operations: 40,
  developer: 35,
  designer: 35,
  qa: 35,
  support: 30,
  staff: 25,
  intern: 20,
  client: 15,
  guest: 10,
  viewer: 5,
};

/**
 * List of roles that can manage other users.
 */
export const ADMIN_ROLES = ['super_admin', 'administrator', 'director', 'manager'];
