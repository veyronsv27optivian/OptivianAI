/**
 * Conversation memory barrel.
 *
 * Provides session-based and persistent conversation memory.
 * Supports Supabase (production) and localStorage (DEV_MODE) backends.
 *
 * Usage:
 *   import { ConversationMemory } from '../memory';
 *   const memory = new ConversationMemory({ sessionId: 'abc-123' });
 *   await memory.addMessage({ role: 'user', content: 'Hello' });
 *   const history = await memory.getHistory();
 */

export { ConversationMemory } from './conversationMemory';
export { MEMORY_EVENTS, memoryEventBus } from './memoryEvents';
