import { supabase } from './supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;

export function initTracker(userId, profileId) {
  if (DEV_MODE) return () => {};

  const subscription = supabase
    .channel(`global-msgs-${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    }, (payload) => {
      const msg = payload.new;
      if (msg.sender_id === profileId) return;
      window.dispatchEvent(new CustomEvent('chat-unread-update'));
    })
    .subscribe();

  return () => {
    if (subscription) supabase.removeChannel(subscription);
  };
}

export function addListener(fn) {
  window.addEventListener('chat-unread-update', fn);
  fn();
  return () => window.removeEventListener('chat-unread-update', fn);
}

export function getTotalUnread() {
  return 0;
}

export function getUnreadCounts() {
  return {};
}
