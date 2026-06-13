import { supabase } from './supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;

const listeners = new Set();
let subscription = null;
let unreadCounts = {};
let totalUnread = 0;

export function initTracker(userId, profileId) {
  if (DEV_MODE || subscription) return () => {};

  subscription = supabase
    .channel(`global-msgs-${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    }, (payload) => {
      const msg = payload.new;
      if (msg.sender_id === profileId) return;

      // Track unique conversation IDs (people), not individual messages
      if (!unreadCounts[msg.conversation_id]) {
        unreadCounts[msg.conversation_id] = 1;
        totalUnread = Object.keys(unreadCounts).length;
        notify();
      }
    })
    .subscribe();

  return () => {
    if (subscription) {
      supabase.removeChannel(subscription);
      subscription = null;
    }
  };
}

export function addListener(fn) {
  listeners.add(fn);
  fn({ ...unreadCounts }, totalUnread);
  return () => listeners.delete(fn);
}

export function markConversationRead(convId) {
  delete unreadCounts[convId];
  totalUnread = Object.keys(unreadCounts).length;
  notify();
}

export function markAllConversationsRead() {
  unreadCounts = {};
  totalUnread = 0;
  notify();
}

export function getTotalUnread() {
  return totalUnread;
}

export function getUnreadCounts() {
  return { ...unreadCounts };
}

function notify() {
  listeners.forEach(fn => fn({ ...unreadCounts }, totalUnread));
}
