/**
 * ─── useRealtime — Supabase Realtime Subscriptions (Phase 7, Item 76) ──
 *
 * A reusable hook that subscribes to Supabase realtime changes on any table.
 * Automatically cleans up subscriptions on unmount and re-subscribes
 * when dependencies change.
 *
 * Usage:
 *   useRealtime('tasks', ['INSERT', 'UPDATE', 'DELETE'], (payload) => {
 *     console.log('Task changed:', payload);
 *   });
 *
 *   useRealtime('profiles', '*', (payload) => {
 *     console.log('Profile changed:', payload);
 *   }, { filter: `user_id=eq.${userId}` });
 */

import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '';

/**
 * Subscribe to realtime changes on a Supabase table.
 *
 * @param {string} table - Table name to watch
 * @param {string|string[]} events - Event type(s): 'INSERT' | 'UPDATE' | 'DELETE' | '*' or array
 * @param {function} callback - Called with (payload) on each event
 * @param {object} options
 * @param {string} [options.filter] - Postgres filter string, e.g. `user_id=eq.123`
 * @param {string} [options.schema='public'] - Schema name
 * @param {any[]} [options.deps=[]] - Extra deps to re-subscribe on
 */
export function useRealtime(table, events, callback, options = {}) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const {
    filter,
    schema = 'public',
    deps = [],
  } = options;

  useEffect(() => {
    // Skip in dev mode
    if (DEV_MODE) return;

    const eventList = Array.isArray(events) ? events : [events];
    const channelName = `${table}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const channel = supabase.channel(channelName);

    // Subscribe to each event type (or '*' for all)
    if (eventList.includes('*')) {
      channel.on(
        'postgres_changes',
        { event: '*', schema, table, filter: filter || undefined },
        (payload) => callbackRef.current(payload)
      );
    } else {
      eventList.forEach((event) => {
        channel.on(
          'postgres_changes',
          { event, schema, table, filter: filter || undefined },
          (payload) => callbackRef.current(payload)
        );
      });
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, JSON.stringify(events), filter, schema, ...deps]);
}

/**
 * Subscribe to realtime changes on any table without deps.
 * Simpler API for one-off subscriptions.
 */
export function onTableChange(table, callback, filter) {
  if (DEV_MODE) return () => {};

  const channelName = `${table}-${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: filter || undefined,
      },
      callback
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
