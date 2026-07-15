/** Chat Read Receipts Service — Phase 5 Item 51 */
const STORAGE_KEY = 'optivian_chat_read_receipts';

function devGet() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function devSet(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function markConversationRead(userId, conversationId) {
  if (!userId || !conversationId) return;
  const isDev = !import.meta.env.VITE_SUPABASE_URL;
  if (isDev) {
    const data = devGet();
    if (!data[userId]) data[userId] = {};
    data[userId][conversationId] = Date.now();
    devSet(data);
    return;
  }
  try {
    const { supabase } = await import('./supabase');
    await supabase.from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('profile_id', userId)
      .eq('conversation_id', conversationId);
  } catch {}
}

export async function getLastReadTimestamps(userId) {
  if (!userId) return {};
  const isDev = !import.meta.env.VITE_SUPABASE_URL;
  if (isDev) {
    const data = devGet();
    return data[userId] || {};
  }
  try {
    const { supabase } = await import('./supabase');
    const { data } = await supabase.from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('profile_id', userId);
    const map = {};
    if (data) data.forEach(d => { map[d.conversation_id] = new Date(d.last_read_at).getTime(); });
    return map;
  } catch { return {}; }
}

export async function markMessageSeen(userId, messageId, conversationId) {
  if (!userId || !messageId) return;
  const isDev = !import.meta.env.VITE_SUPABASE_URL;
  if (isDev) {
    const data = devGet();
    if (!data[`seen_${userId}`]) data[`seen_${userId}`] = {};
    data[`seen_${userId}`][messageId] = Date.now();
    devSet(data);
    return;
  }
  try {
    const { supabase } = await import('./supabase');
    await supabase.from('message_seen').upsert({
      message_id: messageId,
      profile_id: userId,
      seen_at: new Date().toISOString(),
    }, { onConflict: 'message_id,profile_id' });
  } catch {}
}

export async function getSeenBy(messageId) {
  if (!messageId) return [];
  const isDev = !import.meta.env.VITE_SUPABASE_URL;
  if (isDev) {
    const data = devGet();
    const seen = [];
    for (const key of Object.keys(data)) {
      if (key.startsWith('seen_') && data[key][messageId]) {
        const profiles = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
        const userId = key.replace('seen_', '');
        const p = profiles.find(pr => pr.user_id === userId || pr.id === userId);
        seen.push({ userId, email: p?.email || userId, seenAt: new Date(data[key][messageId]).toISOString() });
      }
    }
    return seen;
  }
  try {
    const { supabase } = await import('./supabase');
    const { data } = await supabase.from('message_seen')
      .select('profile_id, seen_at, profiles(email)')
      .eq('message_id', messageId);
    return (data || []).map(d => ({ userId: d.profile_id, email: d.profiles?.email, seenAt: d.seen_at }));
  } catch { return []; }
}
