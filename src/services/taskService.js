import { supabase } from './supabase';
import { createNotification } from './notificationService';
import { sendNotificationEmail, isEmailConfigured } from './emailService';

// ──────────────────────────────────────────────
// Dev mode localStorage helpers
// ──────────────────────────────────────────────
const DEV_KEYS = {
  tasks: 'optivian_dev_tasks',
  profiles: 'optivian_dev_profiles',
};

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

// ──────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────

function normalizeAssignees(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

function isAssigned(assignedField, profileId) {
  const ids = normalizeAssignees(assignedField);
  return ids.includes(profileId);
}

async function getProfile(user) {
  if (!user) return null;
  const isDev = !import.meta.env.VITE_SUPABASE_URL;

  if (isDev) {
    const profiles = devGet(DEV_KEYS.profiles);
    return profiles.find((p) => p.user_id === user.id) || null;
  }

  const { data } = await supabase
    .from('profiles')
    .select('id, organization_id, role, email')
    .eq('user_id', user.id)
    .single();
  return data;
}

// Get the per-assignee status for a given profile, from the task's status map
function getAssigneeStatus(task, profileId) {
  if (task.assignee_statuses && task.assignee_statuses[profileId]) {
    return task.assignee_statuses[profileId];
  }
  return 'pending';
}

// ──────────────────────────────────────────────
// getTasks
// ──────────────────────────────────────────────
export async function getTasks(user) {
  if (!user) return [];
  const profile = await getProfile(user);
  if (!profile?.organization_id) return [];

  const userRole = user.user_metadata?.role || 'staff';
  const isDev = !import.meta.env.VITE_SUPABASE_URL;

  if (isDev) {
    let tasks = devGet(DEV_KEYS.tasks).filter(
      (t) => t.organization_id === profile.organization_id
    );

    if (userRole === 'staff') {
      tasks = tasks.filter((t) => isAssigned(t.assigned_tos ?? t.assigned_to, profile.id));
    }

    const allProfiles = devGet(DEV_KEYS.profiles);
    return tasks
      .map((t) => {
        const assigneeIds = normalizeAssignees(t.assigned_tos ?? t.assigned_to);
        // Build enriched assignee list with emails and statuses
        const assignees = assigneeIds.map((id) => {
          const p = allProfiles.find((pr) => pr.id === id || pr.user_id === id);
          return {
            profile_id: id,
            email: p?.email || null,
            status: getAssigneeStatus(t, id),
          };
        });
        return {
          ...t,
          assigned_tos: assigneeIds,
          assignees,
          assignee_emails: assignees.map((a) => a.email).filter(Boolean),
          creator_email:
            allProfiles.find((p) => p.id === t.assigned_by || p.user_id === t.assigned_by)?.email || null,
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // ── Supabase mode ──
  let tasks = [];
  const orgId = profile.organization_id;

  try {
    const { data: fetched, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (tasksError) throw tasksError;
    tasks = fetched || [];

    // Staff: filter in JS by checking assigned_tos array membership
    // (avoid Supabase .contains() which has JSON encoding issues)
    if (userRole === 'staff') {
      tasks = tasks.filter((t) => {
        const ids = normalizeAssignees(t.assigned_tos || []);
        return ids.includes(profile.id);
      });
    }
  } catch (e) {
    console.warn('Could not fetch tasks:', e.message);
    return [];
  }

  if (tasks.length === 0) return [];

  // Collect all profile IDs we need emails for (assignees + creators)
  const allProfileIds = new Set();
  tasks.forEach((t) => {
    const ids = normalizeAssignees(t.assigned_tos || []);
    ids.forEach((id) => allProfileIds.add(id));
    if (t.assigned_by) allProfileIds.add(t.assigned_by);
  });

  const profileEmailMap = {};
  if (allProfileIds.size > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', [...allProfileIds]);
    (profiles || []).forEach((p) => {
      profileEmailMap[p.id] = p.email;
    });
  }

  return tasks.map((t) => {
    const assigneeIds = normalizeAssignees(t.assigned_tos || []);
    const statuses = t.assignee_statuses || {};
    const assignees = assigneeIds.map((id) => ({
      profile_id: id,
      email: profileEmailMap[id] || null,
      status: statuses[id] || 'pending',
    }));
    return {
      ...t,
      assignees,
      assigned_tos: assigneeIds,
      assignee_emails: assignees.map((a) => a.email).filter(Boolean),
      creator_email: profileEmailMap[t.assigned_by] || null,
    };
  });
}

// ──────────────────────────────────────────────
// createTask
// ──────────────────────────────────────────────
export async function createTask(user, taskData) {
  if (!user) return { error: { message: 'Not authenticated.' } };

  const profile = await getProfile(user);
  if (!profile?.organization_id)
    return { error: { message: 'No organization found.' } };

  const assigneeIds = normalizeAssignees(taskData.assigned_tos ?? taskData.assigned_to);
  const isDev = !import.meta.env.VITE_SUPABASE_URL;

  if (isDev) {
    const tasks = devGet(DEV_KEYS.tasks);
    // Build per-assignee status map – all start at 'pending'
    const assigneeStatuses = {};
    assigneeIds.forEach((id) => { assigneeStatuses[id] = 'pending'; });

    const newTask = {
      id: uid(),
      organization_id: profile.organization_id,
      title: taskData.title,
      description: taskData.description || '',
      assigned_tos: assigneeIds,
      assignee_statuses: assigneeStatuses,
      assigned_by: profile.id,
      status: 'pending',
      priority: taskData.priority || 'medium',
      due_date: taskData.due_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    tasks.push(newTask);
    devSet(DEV_KEYS.tasks, tasks);

    if (assigneeIds.length > 0) {
      const allProfiles = devGet(DEV_KEYS.profiles);
      for (const aId of assigneeIds) {
        const ap = allProfiles.find((p) => p.id === aId || p.user_id === aId);
        if (ap?.user_id) {
          createNotification(ap.user_id, 'task_assigned', `You have been assigned to: "${newTask.title}"`, 'task', newTask.id);
        }
        if (ap?.email && isEmailConfigured()) {
          sendNotificationEmail('task_assigned', ap.email, {
            taskTitle: newTask.title,
            assigneeName: ap.full_name || ap.email?.split('@')[0] || 'User',
            dueDate: newTask.due_date,
            taskUrl: `${window.location.origin}/#/app/tasks`,
          });
        }
      }
    }

    return { data: newTask, error: null };
  }

  // ── Supabase mode ──
  // Build per-assignee status map – all start at 'pending'
  const assigneeStatuses = {};
  assigneeIds.forEach((id) => { assigneeStatuses[id] = 'pending'; });

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      organization_id: profile.organization_id,
      title: taskData.title,
      description: taskData.description || '',
      assigned_by: profile.id,
      assigned_tos: assigneeIds,
      assignee_statuses: assigneeStatuses,
      status: 'pending',
      priority: taskData.priority || 'medium',
      due_date: taskData.due_date || null,
    })
    .select()
    .single();

  if (error) return { data, error };

  // Fire notifications + email for all assignees
  for (const pid of assigneeIds) {
    const { data: ap } = await supabase.from('profiles').select('user_id, email, full_name').eq('id', pid).single();
    if (ap?.user_id) {
      createNotification(ap.user_id, 'task_assigned', `You have been assigned to: "${data.title}"`, 'task', data.id);
    }
    if (ap?.email && isEmailConfigured()) {
      sendNotificationEmail('task_assigned', ap.email, {
        taskTitle: data.title,
        assigneeName: ap.full_name || ap.email?.split('@')[0] || 'User',
        dueDate: data.due_date,
        taskUrl: `${window.location.origin}/#/app/tasks`,
      });
    }
  }

  return { data: { ...data, assigned_tos: assigneeIds, assignee_statuses: assigneeStatuses }, error: null };
}

// ──────────────────────────────────────────────
// updateTask – task-level updates (title, desc, assignees, etc.)
// ──────────────────────────────────────────────
export async function updateTask(user, taskId, updates) {
  if (!user) return { error: { message: 'Not authenticated.' } };

  const newAssigneeIds = normalizeAssignees(updates.assigned_tos ?? updates.assigned_to);
  const isDev = !import.meta.env.VITE_SUPABASE_URL;

  if (isDev) {
    const tasks = devGet(DEV_KEYS.tasks);
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return { error: { message: 'Task not found.' } };

    const oldData = { ...tasks[idx] };
    const oldAssigneeIds = normalizeAssignees(oldData.assigned_tos ?? oldData.assigned_to);

    const updatePayload = { ...updates, updated_at: new Date().toISOString() };
    delete updatePayload.assigned_to;

    if (updates.assigned_tos !== undefined) {
      updatePayload.assigned_tos = newAssigneeIds;
      // Preserve existing statuses for kept assignees, init 'pending' for new ones
      const oldStatuses = oldData.assignee_statuses || {};
      const newStatuses = {};
      newAssigneeIds.forEach((id) => {
        newStatuses[id] = oldStatuses[id] || 'pending';
      });
      updatePayload.assignee_statuses = newStatuses;
    }

    tasks[idx] = { ...tasks[idx], ...updatePayload };
    devSet(DEV_KEYS.tasks, tasks);

    // Notify new assignees
    const allProfiles = devGet(DEV_KEYS.profiles);
    for (const aId of newAssigneeIds) {
      if (!oldAssigneeIds.includes(aId)) {
        const ap = allProfiles.find((p) => p.id === aId || p.user_id === aId);
        if (ap?.user_id) {
          createNotification(ap.user_id, 'task_assigned', `You have been assigned to: "${tasks[idx].title}"`, 'task', taskId);
        }
      }
    }

    return { data: tasks[idx], error: null };
  }

  // ── Supabase mode ──
  const { data: oldTask } = await supabase.from('tasks').select('id, title, assigned_tos, assignee_statuses').eq('id', taskId).single();

  const oldAssigneeIds = normalizeAssignees(oldTask?.assigned_tos || []);
  const oldStatuses = oldTask?.assignee_statuses || {};

  const dbUpdates = { ...updates, updated_at: new Date().toISOString() };
  delete dbUpdates.assigned_to;

  // If assignees changed, update assigned_tos and preserve/init statuses
  if (updates.assigned_tos !== undefined) {
    // Preserve existing statuses for kept assignees, init 'pending' for new ones
    const newStatuses = {};
    newAssigneeIds.forEach((id) => {
      newStatuses[id] = oldStatuses[id] || 'pending';
    });
    dbUpdates.assigned_tos = newAssigneeIds;
    dbUpdates.assignee_statuses = newStatuses;
  } else {
    delete dbUpdates.assigned_tos;
    delete dbUpdates.assignee_statuses;
  }

  const { data, error } = await supabase.from('tasks').update(dbUpdates).eq('id', taskId).select().single();
  if (error) return { data, error };

  // Notify new assignees
  if (updates.assigned_tos !== undefined) {
    const toAdd = newAssigneeIds.filter((id) => !oldAssigneeIds.includes(id));
    for (const pid of toAdd) {
      const { data: ap } = await supabase.from('profiles').select('user_id').eq('id', pid).single();
      if (ap?.user_id) {
        createNotification(ap.user_id, 'task_assigned', `You have been assigned to: "${data?.title || oldTask?.title}"`, 'task', taskId);
      }
    }
  }

  return { data, error };
}

// ──────────────────────────────────────────────
// updateAssigneeStatus – update ONE assignee's status (not the task's)
// ──────────────────────────────────────────────
export async function updateAssigneeStatus(user, taskId, profileId, newStatus) {
  if (!user) return { error: { message: 'Not authenticated.' } };

  const profile = await getProfile(user);
  const userRole = user.user_metadata?.role || 'staff';

  // Staff can only update their own status
  if (userRole === 'staff' && profile?.id !== profileId) {
    return { error: { message: 'You can only update your own status.' } };
  }

  const isDev = !import.meta.env.VITE_SUPABASE_URL;

  if (isDev) {
    const tasks = devGet(DEV_KEYS.tasks);
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return { error: { message: 'Task not found.' } };

    if (!tasks[idx].assignee_statuses) {
      tasks[idx].assignee_statuses = {};
    }
    tasks[idx].assignee_statuses[profileId] = newStatus;
    tasks[idx].updated_at = new Date().toISOString();
    devSet(DEV_KEYS.tasks, tasks);

    return { data: tasks[idx], error: null };
  }

  // ── Supabase mode ──
  // Fetch current assignee_statuses JSONB, patch the one profile, save back
  const { data: taskRow } = await supabase
    .from('tasks')
    .select('assignee_statuses')
    .eq('id', taskId)
    .single();

  const currentStatuses = taskRow?.assignee_statuses || {};
  currentStatuses[profileId] = newStatus;

  const { data, error } = await supabase
    .from('tasks')
    .update({
      assignee_statuses: currentStatuses,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  return { data, error };
}

// ──────────────────────────────────────────────
// deleteTask
// ──────────────────────────────────────────────
export async function deleteTask(user, taskId) {
  if (!user) return { error: { message: 'Not authenticated.' } };
  const isDev = !import.meta.env.VITE_SUPABASE_URL;

  if (isDev) {
    const tasks = devGet(DEV_KEYS.tasks).filter((t) => t.id !== taskId);
    devSet(DEV_KEYS.tasks, tasks);
    return { error: null };
  }

  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  return { error };
}
