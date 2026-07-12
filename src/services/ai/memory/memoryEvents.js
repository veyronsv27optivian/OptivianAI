/**
 * Memory event bus.
 *
 * A simple event emitter for memory-related events.
 * Allows other subsystems (analytics, cache, logger) to react to
 * memory operations without tight coupling.
 */

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

/**
 * Subscribe to a memory event.
 *
 * @param {'message_added'|'memory_cleared'|'memory_loaded'|'context_injected'} event
 * @param {Function} callback
 * @returns {() => void} Unsubscribe function.
 */
export function onMemoryEvent(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);

  return () => {
    listeners.get(event)?.delete(callback);
  };
}

/**
 * Emit a memory event.
 *
 * @param {string} event
 * @param {any} data
 */
export function emitMemoryEvent(event, data) {
  const eventListeners = listeners.get(event);
  if (eventListeners) {
    eventListeners.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`[MemoryEvent] Error in listener for "${event}":`, err);
      }
    });
  }
}

/**
 * Remove all listeners (useful for testing).
 */
export function clearMemoryListeners() {
  listeners.clear();
}

export const MEMORY_EVENTS = {
  MESSAGE_ADDED: 'message_added',
  MEMORY_CLEARED: 'memory_cleared',
  MEMORY_LOADED: 'memory_loaded',
  CONTEXT_INJECTED: 'context_injected',
};

export const memoryEventBus = {
  on: onMemoryEvent,
  emit: emitMemoryEvent,
  clear: clearMemoryListeners,
  EVENTS: MEMORY_EVENTS,
};
