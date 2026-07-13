/**
 * ─── Task Notification Service ──────────────────────────────────
 * Handles task assignment, due-date, and overdue notifications.
 *
 * Integrates with:
 *   - notificationService.js (in-app notifications)
 *   - emailService.js (email notifications, if configured)
 *   - taskService.js (task data)
 */

import { supabase } from './supabase';
import { createNotification } from './notificationService';
import { sendNotificationEmail, isEmailConfigured } from './emailService';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;

// ─── In-app notification helpers ─────────────────────────────────

/**
 * Notify a user about a task assignment.
 *
 * @param {string} userId - The assignee's auth user ID.
 * @param {object} task - Task object with id, title, description, due_date.
 */
export async function notifyTaskAssigned(userId, task) {
  if (!userId || !task) return;

  const message = task.due_date
    ? `New task assigned: "${task.title || task.name}" — Due ${new Date(task.due_date).toLocaleDateString()}`
    : `New task assigned: "${task.title || task.name}"`;

  await createNotification(userId, 'task_assigned', message, 'task', task.id);

  // Send email if configured
  if (isEmailConfigured()) {
    const userEmail = await getUserEmail(userId);
    if (userEmail) {
      sendNotificationEmail('task_assigned', userEmail, {
        taskTitle: task.title || task.name,
        taskDescription: task.description,
        dueDate: task.due_date,
        taskUrl: `${window.location.origin}/#/app/tasks`,
      }).catch(err => console.warn('[Notifications] Email send failed:', err));
    }
  }
}

/**
 * Notify a user that their task is due soon (within 24 hours).
 *
 * @param {string} userId
 * @param {object} task
 */
export async function notifyTaskDueSoon(userId, task) {
  if (!userId || !task) return;

  const message = `⏰ Task due soon: "${task.title || task.name}" — Due ${new Date(task.due_date).toLocaleDateString()}`;

  await createNotification(userId, 'task_due_soon', message, 'task', task.id);

  if (isEmailConfigured()) {
    const userEmail = await getUserEmail(userId);
    if (userEmail) {
      const hoursLeft = Math.round((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60));
      sendNotificationEmail('task_due_soon', userEmail, {
        taskTitle: task.title || task.name,
        dueDate: task.due_date,
        dueIn: hoursLeft > 0 ? `in ${hoursLeft} hours` : 'less than an hour',
        taskUrl: `${window.location.origin}/#/app/tasks`,
      }).catch(err => console.warn('[Notifications] Email send failed:', err));
    }
  }
}

/**
 * Notify a user that their task is overdue.
 *
 * @param {string} userId
 * @param {object} task
 */
export async function notifyTaskOverdue(userId, task) {
  if (!userId || !task) return;

  const overdueDays = Math.round((Date.now() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24));
  const message = `🔴 Task overdue: "${task.title || task.name}" — Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`;

  await createNotification(userId, 'task_overdue', message, 'task', task.id);

  if (isEmailConfigured()) {
    const userEmail = await getUserEmail(userId);
    if (userEmail) {
      sendNotificationEmail('task_overdue', userEmail, {
        taskTitle: task.title || task.name,
        dueDate: task.due_date,
        overdueBy: `${overdueDays} day${overdueDays !== 1 ? 's' : ''}`,
        taskUrl: `${window.location.origin}/#/app/tasks`,
      }).catch(err => console.warn('[Notifications] Email send failed:', err));
    }
  }
}

// ─── Bulk check ──────────────────────────────────────────────────

/**
 * Check all tasks across the organization and send due/overdue notifications.
 * Call this periodically (e.g., every hour) from a cron job or on login.
 *
 * @param {string} organizationId
 */
export async function checkAllTasksDueDates(organizationId) {
  if (!organizationId) return { checked: 0, notified: 0 };

  try {
    let tasks;
    if (DEV_MODE) {
      // In dev mode, check localStorage
      const stored = localStorage.getItem('optivian_dev_tasks');
      tasks = stored ? JSON.parse(stored) : [];
    } else {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, assignee:assignee_id(user_id, email, full_name)')
        .eq('organization_id', organizationId)
        .not('status', 'in', '("done","completed","cancelled")');

      if (error) throw error;
      tasks = data || [];
    }

    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    let notified = 0;

    for (const task of tasks) {
      if (!task.due_date || !task.assignee_id) continue;

      const dueTime = new Date(task.due_date).getTime();
      const timeUntilDue = dueTime - now;
      const assigneeUserId = task.assignee?.user_id || task.assignee_id;

      if (!assigneeUserId) continue;

      // Overdue
      if (timeUntilDue < 0) {
        // Check if we've already notified for this task in the last 24h
        const lastNotified = getLastNotified(task.id, 'overdue');
        if (!lastNotified || (now - lastNotified) > TWENTY_FOUR_HOURS) {
          await notifyTaskOverdue(assigneeUserId, task);
          setLastNotified(task.id, 'overdue', now);
          notified++;
        }
      }
      // Due within 24 hours
      else if (timeUntilDue <= TWENTY_FOUR_HOURS) {
        const lastNotified = getLastNotified(task.id, 'due_soon');
        if (!lastNotified || (now - lastNotified) > TWENTY_FOUR_HOURS) {
          await notifyTaskDueSoon(assigneeUserId, task);
          setLastNotified(task.id, 'due_soon', now);
          notified++;
        }
      }
    }

    return { checked: tasks.length, notified };
  } catch (err) {
    console.error('[TaskNotifications] Check failed:', err);
    return { checked: 0, notified: 0, error: err.message };
  }
}

// ─── Last-notified tracking (localStorage to prevent spam) ───────

const NOTIFIED_KEY = 'optivian_task_notified';

function getNotifiedMap() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}');
  } catch {
    return {};
  }
}

function getLastNotified(taskId, type) {
  const map = getNotifiedMap();
  return map[`${taskId}_${type}`] || null;
}

function setLastNotified(taskId, type, timestamp) {
  const map = getNotifiedMap();
  map[`${taskId}_${type}`] = timestamp;
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
}

// ─── Helper ──────────────────────────────────────────────────────

async function getUserEmail(userId) {
  if (DEV_MODE) {
    return `${userId}@dev.local`; // Dev placeholder
  }
  try {
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single();
    return data?.email || null;
  } catch {
    return null;
  }
}
