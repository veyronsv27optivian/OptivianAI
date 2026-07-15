/**
 * ─── Announcement Service (Item 58) ─────────────────────────────
 * Admin announcements with create, dismiss, and retrieval support.
 * Dev mode uses localStorage. Supabase mode uses announcements table.
 */

import { supabase } from './supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;
const DEV_KEY = 'optivian_dev_announcements';
const DISMISSED_KEY = 'optivian_dismissed_announcements';

function devGet() {
  try { return JSON.parse(localStorage.getItem(DEV_KEY) || '[]'); }
  catch { return []; }
}

function devSet(data) {
  localStorage.setItem(DEV_KEY, JSON.stringify(data));
}

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'); }
  catch { return []; }
}

function setDismissed(ids) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Create an announcement
 */
export async function createAnnouncement({ userId, title, message, type = 'info', link = null }) {
  if (!userId || !title || !message) return { error: 'Missing required fields' };

  if (DEV_MODE) {
    const announcements = devGet();
    const newAnnouncement = {
      id: uid(),
      created_by: userId,
      title,
      message,
      type, // 'info' | 'warning' | 'success' | 'alert'
      link,
      active: true,
      created_at: new Date().toISOString(),
    };
    announcements.push(newAnnouncement);
    devSet(announcements);
    return { data: newAnnouncement, error: null };
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      created_by: userId,
      title,
      message,
      type,
      link,
      active: true,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Get active announcements (excluding dismissed ones for the user)
 */
export async function getAnnouncements(userId = null) {
  const dismissed = getDismissed();

  if (DEV_MODE) {
    const announcements = devGet()
      .filter(a => a.active)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return announcements.filter(a => !dismissed.includes(a.id));
  }

  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Announcements fetch returned:', error.message);
      return [];
    }
    return (data || []).filter(a => !dismissed.includes(a.id));
  } catch (err) {
    // Gracefully handle cases where the announcements table doesn't exist yet
    console.warn('Could not fetch announcements (table may not exist):', err.message);
    return [];
  }
}

/**
 * Dismiss an announcement for the current user
 */
export function dismissAnnouncement(announcementId) {
  const dismissed = getDismissed();
  if (!dismissed.includes(announcementId)) {
    dismissed.push(announcementId);
    setDismissed(dismissed);
  }
}

/**
 * Deactivate an announcement (admin only)
 */
export async function deactivateAnnouncement(announcementId) {
  if (DEV_MODE) {
    const announcements = devGet();
    const idx = announcements.findIndex(a => a.id === announcementId);
    if (idx === -1) return { error: 'Announcement not found' };
    announcements[idx].active = false;
    devSet(announcements);
    return { error: null };
  }

  const { error } = await supabase
    .from('announcements')
    .update({ active: false })
    .eq('id', announcementId);

  return { error };
}
