import { supabase } from './supabase';

// ──────────────────────────────────────────────
// Dev mode localStorage helpers
// ──────────────────────────────────────────────
const DEV_KEY = 'optivian_dev_notifications';

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

// ──────────────────────────────────────────────
// Create a notification for a user
// ──────────────────────────────────────────────
export async function createNotification(userId, type, message, refType, refId) {
  if (!userId) return;

  const isDev = !import.meta.env.VITE_SUPABASE_URL;

  if (isDev) {
    const notifications = devGet();
    notifications.push({
      id: uid(),
      user_id: userId,
      type,
      message,
      ref_type: refType,
      ref_id: refId,
      read: false,
      created_at: new Date().toISOString(),
    });
    devSet(notifications);
    // Dispatch a custom event so the UI can react immediately
    window.dispatchEvent(new CustomEvent('notification-update'));
    return;
  }

  // Supabase mode
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    message,
    ref_type: refType,
    ref_id: refId,
  });
}

// ──────────────────────────────────────────────
// Get unread notification count for a user
// ──────────────────────────────────────────────
export function getUnreadCount(userId) {
  if (!userId) return 0;
  const isDev = !import.meta.env.VITE_SUPABASE_URL;

  if (isDev) {
    const notifications = devGet();
    return notifications.filter((n) => n.user_id === userId && !n.read).length;
  }

  // For Supabase, this must be called async – but we use polling in the layout
  return 0;
}

// ──────────────────────────────────────────────
// Get all notifications for a user (unread first)
// ──────────────────────────────────────────────
export function getNotifications(userId) {
  if (!userId) return [];
  const isDev = !import.meta.env.VITE_SUPABASE_URL;

  if (isDev) {
    return devGet()
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return [];
}

// ──────────────────────────────────────────────
// Mark all notifications as read for a user
// ──────────────────────────────────────────────
export function markAllRead(userId) {
  if (!userId) return;
  const isDev = !import.meta.env.VITE_SUPABASE_URL;

  if (isDev) {
    const notifications = devGet().map((n) =>
      n.user_id === userId ? { ...n, read: true } : n
    );
    devSet(notifications);
    window.dispatchEvent(new CustomEvent('notification-update'));
    return;
  }

  // Supabase mode
  supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
    .then(() => {
      window.dispatchEvent(new CustomEvent('notification-update'));
    });
}

// ──────────────────────────────────────────────
// Asynchronous version for Supabase (returns a promise)
// ──────────────────────────────────────────────
export async function getUnreadCountAsync(userId) {
  if (!userId) return 0;
  const isDev = !import.meta.env.VITE_SUPABASE_URL;

  if (isDev) {
    const notifications = devGet();
    return notifications.filter((n) => n.user_id === userId && !n.read).length;
  }

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  return count || 0;
}

// ──────────────────────────────────────────────
// Get notifications async (for Supabase)
// ──────────────────────────────────────────────
export async function getNotificationsAsync(userId) {
  if (!userId) return [];
  const isDev = !import.meta.env.VITE_SUPABASE_URL;

  if (isDev) {
    return getNotifications(userId);
  }

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  return data || [];
}
