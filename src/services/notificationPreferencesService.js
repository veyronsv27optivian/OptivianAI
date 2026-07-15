/** Notification Preferences Service — Phase 5 Item 54 */
const STORAGE_KEY = 'optivian_notification_prefs';
const DEV_PROFILES_KEY = 'optivian_dev_profiles';

function devGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function devSet(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const NOTIFICATION_CHANNELS = ['in_app', 'email'];
export const NOTIFICATION_TYPES = [
  { id: 'task_assigned', label: 'Task Assigned', description: 'When a task is assigned to you' },
  { id: 'task_due_soon', label: 'Task Due Soon', description: 'When a task is due within 24 hours' },
  { id: 'task_overdue', label: 'Task Overdue', description: 'When a task becomes overdue' },
  { id: 'task_updated', label: 'Task Updated', description: 'When a task you\'re assigned to is updated' },
  { id: 'comment_added', label: 'Comment Added', description: 'When someone comments on your task' },
  { id: 'message_received', label: 'Message Received', description: 'When you receive a new chat message' },
  { id: 'mention', label: 'Mentions', description: 'When someone mentions you' },
  { id: 'announcement', label: 'Announcements', description: 'Admin announcements and broadcasts' },
  { id: 'ai_analysis_complete', label: 'AI Analysis Complete', description: 'When an AI analysis finishes' },
  { id: 'report_ready', label: 'Report Ready', description: 'When a scheduled report is generated' },
];

export function getDefaultPrefs(userId) {
  const prefs = {};
  NOTIFICATION_TYPES.forEach(t => {
    prefs[t.id] = { in_app: true, email: false };
  });
  // Enable email for important ones by default
  prefs.task_assigned.email = true;
  prefs.task_due_soon.email = true;
  prefs.mention.email = true;
  prefs.announcement.email = true;
  return { userId, channels: { in_app: true, email: false }, types: prefs, quietHours: { enabled: false, start: '22:00', end: '07:00' }, updatedAt: new Date().toISOString() };
}

export async function getPrefs(userId) {
  if (!userId) return getDefaultPrefs(userId);
  const isDev = !import.meta.env.VITE_SUPABASE_URL;
  if (isDev) {
    const all = devGet(STORAGE_KEY);
    return all.find(p => p.userId === userId) || getDefaultPrefs(userId);
  }
  try {
    const { supabase } = await import('./supabase');
    const { data } = await supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle();
    return data || getDefaultPrefs(userId);
  } catch { return getDefaultPrefs(userId); }
}

export async function savePrefs(userId, prefs) {
  if (!userId) return { error: 'User ID required' };
  const isDev = !import.meta.env.VITE_SUPABASE_URL;
  if (isDev) {
    let all = devGet(STORAGE_KEY);
    all = all.filter(p => p.userId !== userId);
    all.push({ ...prefs, userId, updatedAt: new Date().toISOString() });
    devSet(STORAGE_KEY, all);
    return { data: prefs, error: null };
  }
  try {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase.from('notification_preferences').upsert({
      user_id: userId,
      channels: prefs.channels,
      types: prefs.types,
      quiet_hours: prefs.quietHours,
      updated_at: new Date().toISOString(),
    }).select().single();
    return { data, error };
  } catch (err) { return { error: err.message }; }
}

export async function shouldNotify(userId, type, channel = 'in_app') {
  const prefs = await getPrefs(userId);
  if (!prefs.channels[channel]) return false;
  const typePref = prefs.types[type];
  if (!typePref) return false;
  if (!typePref[channel]) return false;
  if (prefs.quietHours?.enabled) {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = (prefs.quietHours.start || '22:00').split(':').map(Number);
    const [endH, endM] = (prefs.quietHours.end || '07:00').split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    if (startMin <= endMin) {
      if (currentMin >= startMin && currentMin < endMin) return false;
    } else {
      if (currentMin >= startMin || currentMin < endMin) return false;
    }
  }
  return true;
}
