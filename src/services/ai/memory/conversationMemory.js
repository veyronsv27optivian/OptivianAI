/**
 * Conversation memory.
 *
 * Manages conversation history for AI interactions.
 * Supports: previous messages, system prompts, context injection,
 * session memory, clearing memory, and loading previous conversations.
 *
 * Backends:
 *   - Supabase (production) — stores in a 'conversation_memory' table.
 *   - localStorage (DEV_MODE) — stores in localStorage for development.
 *
 * The memory is designed to work seamlessly with the AI service:
 * messages stored here can be injected as context into generateText calls.
 */
import { supabase } from '../../supabase';
import { emitMemoryEvent, MEMORY_EVENTS } from './memoryEvents';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;

/**
 * @typedef {Object} MemoryMessage
 * @property {'system'|'user'|'assistant'|'tool'} role
 * @property {string} content
 * @property {string} [timestamp]
 * @property {object} [metadata]
 */

/**
 * @typedef {Object} ConversationMemoryConfig
 * @property {string} sessionId - Unique session identifier.
 * @property {string} [organizationId] - Organisation context (for Supabase queries).
 * @property {string} [profileId] - User profile ID (for Supabase queries).
 * @property {number} [maxContextMessages=50] - Max messages to include in context window.
 * @property {number} [maxTokens=4000] - Approximate token limit for context window.
 */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export class ConversationMemory {
  /**
   * @param {ConversationMemoryConfig} config
   */
  constructor(config) {
    /** @type {string} */
    this.sessionId = config.sessionId;

    /** @type {string|null} */
    this.organizationId = config.organizationId || null;

    /** @type {string|null} */
    this.profileId = config.profileId || null;

    /** @type {number} */
    this.maxContextMessages = config.maxContextMessages ?? 50;

    /** @type {number} */
    this.maxTokens = config.maxTokens ?? 4000;

    /** @type {MemoryMessage[]} */
    this._messages = [];

    /** @type {string|null} */
    this._systemPrompt = null;

    /** @type {boolean} */
    this._loaded = false;
  }

  // ─── Initialisation ───────────────────────────────────────────

  /**
   * Initialise memory by loading any existing conversation.
   * Call this after creating the instance.
   *
   * @returns {Promise<void>}
   */
  async init() {
    if (!this._loaded) {
      await this._loadFromStorage();
      this._loaded = true;
    }
  }

  // ─── Message Management ───────────────────────────────────────

  /**
   * Add a message to the conversation history.
   *
   * @param {MemoryMessage} message
   * @returns {Promise<void>}
   */
  async addMessage(message) {
    const entry = {
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
      metadata: message.metadata || {},
    };

    this._messages.push(entry);
    await this._persist();
    emitMemoryEvent(MEMORY_EVENTS.MESSAGE_ADDED, { sessionId: this.sessionId, message: entry });
  }

  /**
   * Get the full message history.
   *
   * @param {object} [options]
   * @param {number} [options.limit] - Limit messages to most recent N.
   * @param {boolean} [options.includeSystem=true] - Include system prompt.
   * @returns {MemoryMessage[]}
   */
  getHistory(options = {}) {
    const { limit, includeSystem = true } = options;

    let messages = this._messages;

    if (!includeSystem) {
      messages = messages.filter((m) => m.role !== 'system');
    }

    if (limit && limit > 0) {
      messages = messages.slice(-limit);
    }

    return messages;
  }

  /**
   * Get the conversation context for injection into AI prompts.
   * Returns only the messages needed for context (respects maxContextMessages).
   *
   * @param {number} [maxMessages] - Override max context messages.
   * @returns {MemoryMessage[]}
   */
  getContextMessages(maxMessages) {
    const limit = maxMessages ?? this.maxContextMessages;
    const messages = this._messages.filter((m) => m.role !== 'system');
    return messages.slice(-limit);
  }

  /**
   * Set or update the system prompt for this conversation.
   *
   * @param {string} systemPrompt
   * @returns {Promise<void>}
   */
  async setSystemPrompt(systemPrompt) {
    this._systemPrompt = systemPrompt;

    // Ensure system prompt is the first message
    const existingSystemIdx = this._messages.findIndex(
      (m) => m.role === 'system' && m.metadata?.isSystemPrompt,
    );

    const systemMessage = {
      role: 'system',
      content: systemPrompt,
      timestamp: new Date().toISOString(),
      metadata: { isSystemPrompt: true },
    };

    if (existingSystemIdx >= 0) {
      this._messages[existingSystemIdx] = systemMessage;
    } else {
      this._messages.unshift(systemMessage);
    }

    await this._persist();
  }

  /**
   * Inject additional context into the conversation.
   * This adds a context block that won't be counted as a user message.
   *
   * @param {string} context - Context text to inject.
   * @param {object} [metadata] - Optional metadata.
   * @returns {Promise<void>}
   */
  async injectContext(context, metadata = {}) {
    const contextMessage = {
      role: 'system',
      content: `[Context Injection]\n${context}`,
      timestamp: new Date().toISOString(),
      metadata: { ...metadata, isContextInjection: true },
    };

    // Insert after system prompt but before user messages
    const systemEnd = this._messages.findIndex((m) => m.role !== 'system' || !m.metadata?.isSystemPrompt);
    const insertAt = systemEnd >= 0 ? systemEnd : this._messages.length;

    this._messages.splice(insertAt, 0, contextMessage);
    await this._persist();
    emitMemoryEvent(MEMORY_EVENTS.CONTEXT_INJECTED, { sessionId: this.sessionId, context });
  }

  // ─── Session Management ───────────────────────────────────────

  /**
   * Clear all messages in this session.
   *
   * @returns {Promise<void>}
   */
  async clear() {
    this._messages = [];
    this._systemPrompt = null;
    await this._persist();
    emitMemoryEvent(MEMORY_EVENTS.MEMORY_CLEARED, { sessionId: this.sessionId });
  }

  /**
   * Get the current session info.
   *
   * @returns {{ sessionId: string, messageCount: number, systemPrompt: string|null, created: string|null }}
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      messageCount: this._messages.length,
      systemPrompt: this._systemPrompt,
      created: this._messages[0]?.timestamp || null,
    };
  }

  /**
   * Approximate token count of current messages.
   * Uses a rough heuristic (~4 chars per token for English text).
   *
   * @returns {number}
   */
  estimateTokenCount() {
    const text = this._messages.map((m) => m.content).join(' ');
    return Math.ceil(text.length / 4);
  }

  // ─── Persistence ──────────────────────────────────────────────

  /**
   * Load previous conversation from storage.
   * @private
   */
  async _loadFromStorage() {
    if (DEV_MODE) {
      this._loadFromLocalStorage();
    } else {
      await this._loadFromSupabase();
    }
  }

  /**
   * Save current conversation to storage.
   * @private
   */
  async _persist() {
    if (DEV_MODE) {
      this._saveToLocalStorage();
    } else {
      await this._saveToSupabase();
    }
  }

  // ─── LocalStorage (DEV_MODE) ──────────────────────────────────

  /** @private */
  _getStorageKey() {
    return `optivian_memory_${this.sessionId}`;
  }

  /** @private */
  _loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(this._getStorageKey());
      if (stored) {
        const data = JSON.parse(stored);
        this._messages = data.messages || [];
        this._systemPrompt = data.systemPrompt || null;
      }
      emitMemoryEvent(MEMORY_EVENTS.MEMORY_LOADED, {
        sessionId: this.sessionId,
        messageCount: this._messages.length,
        source: 'localStorage',
      });
    } catch (err) {
      console.warn('[Memory] Failed to load from localStorage:', err);
      this._messages = [];
    }
  }

  /** @private */
  _saveToLocalStorage() {
    try {
      localStorage.setItem(
        this._getStorageKey(),
        JSON.stringify({
          messages: this._messages,
          systemPrompt: this._systemPrompt,
        }),
      );
    } catch (err) {
      console.warn('[Memory] Failed to save to localStorage:', err);
    }
  }

  // ─── Supabase ─────────────────────────────────────────────────

  /** @private */
  async _loadFromSupabase() {
    try {
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('messages, system_prompt')
        .eq('session_id', this.sessionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('[Memory] Failed to load from Supabase:', error);
        return;
      }

      if (data) {
        this._messages = data.messages || [];
        this._systemPrompt = data.system_prompt || null;
      }

      emitMemoryEvent(MEMORY_EVENTS.MEMORY_LOADED, {
        sessionId: this.sessionId,
        messageCount: this._messages.length,
        source: 'supabase',
      });
    } catch (err) {
      console.warn('[Memory] Failed to load from Supabase:', err);
    }
  }

  /** @private */
  async _saveToSupabase() {
    try {
      const { error } = await supabase.from('conversation_memory').upsert(
        {
          session_id: this.sessionId,
          organization_id: this.organizationId,
          profile_id: this.profileId,
          messages: this._messages,
          system_prompt: this._systemPrompt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' },
      );

      if (error) {
        console.warn('[Memory] Failed to save to Supabase:', error);
      }
    } catch (err) {
      console.warn('[Memory] Failed to save to Supabase:', err);
    }
  }
}
