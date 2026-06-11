import { supabase } from './supabase';
import { createNotification } from './notificationService';

// ── Dev mode localStorage keys ──────────────────
const DEV_KEYS = {
  tasks: 'optivian_dev_tasks',
  profiles: 'optivian_dev_profiles',
};

function devGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}

function normalizeAssignees(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

/**
 * Check if localStorage has any dev-mode tasks.
 */
export function countDevTasks() {
  try { return devGet(DEV_KEYS.tasks).length; }
  catch { return 0; }
}

/**
 * Migrate all dev-mode tasks from localStorage into Supabase.
 * Stores assignees as JSONB columns on the tasks table directly.
 */
export async function migrateDevTasks(currentUserId) {
  const errors = [];
  let migrated = 0;

  const devTasks = devGet(DEV_KEYS.tasks);
  if (devTasks.length === 0) return { migrated: 0, errors: [] };

  const devProfiles = devGet(DEV_KEYS.profiles);

  // Fetch the running user's Supabase profile
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id, organization_id')
    .eq('user_id', currentUserId)
    .single();

  if (!myProfile?.organization_id) {
    return { migrated: 0, errors: ['Your profile has no organization_id. Create an org first.'] };
  }

  const fallbackProfileId = myProfile.id;

  // Fetch all Supabase profiles for this org (for email-based matching)
  const { data: supabaseProfiles } = await supabase
    .from('profiles')
    .select('id, email, user_id')
    .eq('organization_id', myProfile.organization_id);

  const profileByEmail = {};
  (supabaseProfiles || []).forEach((p) => {
    profileByEmail[p.email?.toLowerCase()] = p;
  });

  for (const devTask of devTasks) {
    try {
      // ── 1. Resolve creator (assigned_by needs a Supabase profile ID) ──
      let creatorProfileId = fallbackProfileId;
      const creatorDevProfile = devProfiles.find((p) => p.id === devTask.assigned_by);
      if (creatorDevProfile?.email) {
        const match = profileByEmail[creatorDevProfile.email.toLowerCase()];
        if (match) creatorProfileId = match.id;
      }

      // ── 2. Resolve assignee IDs from dev to Supabase and build statuses ──
      const devAssigneeIds = normalizeAssignees(devTask.assigned_tos ?? devTask.assigned_to);
      const devStatuses = devTask.assignee_statuses || {};

      const assignedTos = [];
      const assigneeStatuses = {};

      for (const devProfileId of devAssigneeIds) {
        const assigneeDevProfile = devProfiles.find(
          (p) => p.id === devProfileId || p.user_id === devProfileId
        );
        if (assigneeDevProfile?.email) {
          const match = profileByEmail[assigneeDevProfile.email.toLowerCase()];
          if (match) {
            assignedTos.push(match.id);
            assigneeStatuses[match.id] = devStatuses[devProfileId] || 'pending';
          }
        }
      }

      // ── 3. Insert the task with JSONB assignee columns ──
      const { data: taskRow, error: taskError } = await supabase
        .from('tasks')
        .insert({
          organization_id: myProfile.organization_id,
          title: devTask.title || 'Untitled',
          description: devTask.description || '',
          assigned_by: creatorProfileId,
          assigned_tos: assignedTos,
          assignee_statuses: assigneeStatuses,
          status: devTask.status || 'pending',
          priority: devTask.priority || 'medium',
          due_date: devTask.due_date || null,
          created_at: devTask.created_at || new Date().toISOString(),
          updated_at: devTask.updated_at || new Date().toISOString(),
        })
        .select('id')
        .single();

      if (taskError) {
        errors.push(`Task "${devTask.title}": ${taskError.message}`);
        continue;
      }

      // ── 4. Fire notifications for each assignee ──
      for (const devProfileId of devAssigneeIds) {
        const assigneeDevProfile = devProfiles.find(
          (p) => p.id === devProfileId || p.user_id === devProfileId
        );
        if (assigneeDevProfile?.email) {
          const supabaseUser = profileByEmail[assigneeDevProfile.email.toLowerCase()];
          if (supabaseUser?.user_id) {
            createNotification(
              supabaseUser.user_id,
              'task_assigned',
              `You have been assigned to: "${devTask.title}" (migrated)`,
              'task',
              taskRow.id
            );
          }
        }
      }

      migrated++;
    } catch (err) {
      errors.push(`Task "${devTask.title}": ${err.message}`);
    }
  }

  // Clear localStorage tasks so they won't be migrated twice
  if (migrated > 0) {
    try { localStorage.removeItem(DEV_KEYS.tasks); } catch { /* ignore */ }
  }

  return { migrated, errors };
}
