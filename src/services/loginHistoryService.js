/**
 * ─── Login History Service ───────────────────────────────────────
 * Fetches login attempts from the login_history table (Supabase)
 * with DEV_MODE localStorage fallback.
 */

import { supabase } from './supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '';
const DEV_KEY = 'optivian_dev_login_history';

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

/**
 * Fetch login history for the current user.
 *
 * @param {string} userId - The user's auth ID.
 * @param {Object} [options] - Query options.
 * @param {number} [options.limit=50] - Max records to fetch.
 * @param {number} [options.offset=0] - Pagination offset.
 * @param {string} [options.orderBy='created_at'] - Sort column.
 * @param {boolean} [options.ascending=false] - Sort direction.
 * @returns {Promise<Array>} Array of login history records.
 */
export async function getLoginHistory(userId, options = {}) {
  if (!userId) return [];

  const {
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    ascending = false,
  } = options;

  if (DEV_MODE) {
    const events = devGet()
      .filter(e => e.user_id === userId)
      .sort((a, b) => ascending
        ? new Date(a[orderBy]) - new Date(b[orderBy])
        : new Date(b[orderBy]) - new Date(a[orderBy])
      );
    return events.slice(offset, offset + limit);
  }

  try {
    const { data, error } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', userId)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to fetch login history:', err);
    return [];
  }
}

/**
 * Get login history stats (success count, failure count, etc.).
 */
export async function getLoginHistoryStats(userId) {
  if (!userId) return { total: 0, successful: 0, failed: 0, uniqueProviders: [] };

  if (DEV_MODE) {
    const events = devGet().filter(e => e.user_id === userId);
    const providers = [...new Set(events.map(e => e.provider))];
    return {
      total: events.length,
      successful: events.filter(e => e.success).length,
      failed: events.filter(e => !e.success).length,
      uniqueProviders: providers,
    };
  }

  try {
    const { data, error } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const events = data || [];
    const providers = [...new Set(events.map(e => e.provider))];
    return {
      total: events.length,
      successful: events.filter(e => e.success).length,
      failed: events.filter(e => !e.success).length,
      uniqueProviders: providers,
    };
  } catch (err) {
    console.error('Failed to fetch login history stats:', err);
    return { total: 0, successful: 0, failed: 0, uniqueProviders: [] };
  }
}

/**
 * Clear login history for the current user (DEV_MODE only).
 * In production, this is handled by the cleanup_login_history() RPC.
 */
export async function clearLoginHistory(userId) {
  if (DEV_MODE) {
    const events = devGet().filter(e => e.user_id !== userId);
    devSet(events);
    return { success: true };
  }

  // In production, only admins can clear history via cleanup function
  return { success: false, error: 'Use cleanup_login_history() RPC instead.' };
}
