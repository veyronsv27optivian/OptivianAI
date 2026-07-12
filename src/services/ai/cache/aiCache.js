/**
 * AI Cache.
 *
 * Intelligent cache for AI responses.
 *
 * - Configurable TTL per cache entry.
 * - Organisation isolation (separate cache namespace per org).
 * - Provider isolation (separate cache namespace per provider).
 * - Automatic cache invalidation based on TTL.
 * - DEV_MODE uses localStorage; production mode can be extended to Supabase/Redis.
 *
 * Cache key is derived from: provider + model + systemPrompt + prompt + options hash.
 */
export class AiCache {
  /**
   * @param {object} [config]
   * @param {number} [config.defaultTTL] - Default TTL in ms (default 5 minutes).
   * @param {string} [config.organizationId] - Organisation ID for isolation.
   * @param {number} [config.maxEntries] - Max cache entries (default 500).
   */
  constructor(config = {}) {
    /** @type {number} */
    this.defaultTTL = config.defaultTTL ?? 5 * 60 * 1000; // 5 minutes

    /** @type {string|null} */
    this.organizationId = config.organizationId || null;

    /** @type {number} */
    this.maxEntries = config.maxEntries ?? 500;

    /** @type {Map<string, { data: any, timestamp: number, ttl: number }>} */
    this._cache = new Map();

    /** @type {string} */
    this._storageKey = `optivian_ai_cache${this.organizationId ? `_${this.organizationId}` : ''}`;

    // Restore cache from localStorage in DEV_MODE
    if (this._isDevMode()) {
      this._restoreFromStorage();
    }
  }

  /**
   * Check if running in dev mode.
   * @private
   * @returns {boolean}
   */
  _isDevMode() {
    return !import.meta.env.VITE_SUPABASE_URL;
  }

  // ─── Core Operations ──────────────────────────────────────────

  /**
   * Generate a cache key from request parameters.
   *
   * @param {object} params
   * @param {string} params.provider - Provider name.
   * @param {string} params.model - Model name.
   * @param {string} params.prompt - The user prompt.
   * @param {string} [params.systemPrompt] - System prompt.
   * @param {object} [params.options] - Generation options.
   * @returns {string} Cache key.
   */
  _makeKey({ provider, model, prompt, systemPrompt, options = {} }) {
    const parts = [
      provider || '',
      model || '',
      systemPrompt || '',
      prompt,
      options.temperature ?? '',
      options.maxTokens ?? '',
      options.topP ?? '',
    ];
    const str = parts.join('|||');
    // Simple hash for key length management
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `${provider}_${model}_${hash}_${str.length}`;
  }

  /**
   * Get a cached response.
   *
   * @param {object} params - Same as _makeKey params.
   * @returns {{ hit: boolean, data: any|null }}
   */
  get(params) {
    const key = this._makeKey(params);
    const entry = this._cache.get(key);

    if (!entry) {
      return { hit: false, data: null };
    }

    // Check TTL expiry
    if (Date.now() - entry.timestamp > entry.ttl) {
      this._cache.delete(key);
      this._persist();
      return { hit: false, data: null };
    }

    return { hit: true, data: entry.data };
  }

  /**
   * Set a cached response.
   *
   * @param {object} params - Same as _makeKey params.
   * @param {any} data - The response data to cache.
   * @param {number} [ttl] - Custom TTL in ms (defaults to defaultTTL).
   */
  set(params, data, ttl) {
    // Enforce max entries (evict oldest)
    if (this._cache.size >= this.maxEntries) {
      const oldestKey = this._cache.keys().next().value;
      if (oldestKey) {
        this._cache.delete(oldestKey);
      }
    }

    const key = this._makeKey(params);
    this._cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    });

    this._persist();
  }

  /**
   * Check if a cached response exists and is valid.
   *
   * @param {object} params
   * @returns {boolean}
   */
  has(params) {
    return this.get(params).hit;
  }

  /**
   * Invalidate a specific cache entry.
   *
   * @param {object} params
   */
  invalidate(params) {
    const key = this._makeKey(params);
    this._cache.delete(key);
    this._persist();
  }

  /**
   * Clear all cached entries.
   */
  clear() {
    this._cache.clear();
    this._persist();
  }

  /**
   * Clear entries older than the specified TTL.
   *
   * @param {number} maxAge - Max age in ms.
   * @returns {number} Number of entries pruned.
   */
  prune(maxAge) {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this._cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this._cache.delete(key);
        pruned++;
      }
    }

    if (pruned > 0) {
      this._persist();
    }

    return pruned;
  }

  /**
   * Get cache statistics.
   *
   * @returns {{ size: number, maxEntries: number, oldestEntry: number|null, newestEntry: number|null }}
   */
  getStats() {
    let oldest = Infinity;
    let newest = 0;

    for (const entry of this._cache.values()) {
      if (entry.timestamp < oldest) oldest = entry.timestamp;
      if (entry.timestamp > newest) newest = entry.timestamp;
    }

    return {
      size: this._cache.size,
      maxEntries: this.maxEntries,
      oldestEntry: oldest !== Infinity ? oldest : null,
      newestEntry: newest !== 0 ? newest : null,
    };
  }

  // ─── Persistence (DEV_MODE localStorage) ──────────────────────

  /** @private */
  _restoreFromStorage() {
    try {
      const stored = localStorage.getItem(this._storageKey);
      if (stored) {
        const entries = JSON.parse(stored);
        for (const [key, entry] of Object.entries(entries)) {
          // Skip expired entries on restore
          if (Date.now() - entry.timestamp <= entry.ttl) {
            this._cache.set(key, entry);
          }
        }
      }
    } catch {
      // Ignore restore failures
    }
  }

  /** @private */
  _persist() {
    if (!this._isDevMode()) return;

    try {
      const entries = Object.fromEntries(this._cache.entries());
      localStorage.setItem(this._storageKey, JSON.stringify(entries));
    } catch {
      // localStorage might be full; prune aggressively
      if (this._cache.size > 100) {
        const entriesArray = Array.from(this._cache.entries());
        const kept = entriesArray.slice(-100);
        this._cache = new Map(kept);
        try {
          localStorage.setItem(this._storageKey, JSON.stringify(Object.fromEntries(kept)));
        } catch {
          // Give up on persistence
        }
      }
    }
  }
}
