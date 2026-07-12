/**
 * AI Logger.
 *
 * Structured request logger for all AI operations.
 * Logs are stored in a ring buffer (in-memory) and persisted to
 * Supabase / localStorage for the Admin Dashboard.
 *
 * Every AI request goes through this logger, providing:
 *   - Full audit trail of all AI activity.
 *   - Performance monitoring (execution time per request).
 *   - Error tracking with retry counts.
 *   - Feature usage analytics for the dashboard.
 */
import { supabase } from '../../supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;
const DEV_STORAGE_KEY = 'optivian_ai_logs';

/**
 * @typedef {Object} LogEntry
 * @property {string} requestId - Unique request identifier.
 * @property {string} provider - Provider name.
 * @property {string} feature - Feature/tool name.
 * @property {number} executionTime - Execution time in ms.
 * @property {'success'|'error'|'warning'} status - Request status.
 * @property {string|null} error - Error message if failed.
 * @property {number} retryCount - Number of retries attempted.
 * @property {string} timestamp - ISO timestamp.
 * @property {object|null} metadata - Additional metadata.
 */

class AiLoggerImpl {
  constructor() {
    /** @type {LogEntry[]} */
    this._logs = [];

    /** @type {number} */
    this._maxLogs = 10_000;

    // Restore from storage
    this._restore();
  }

  /**
   * Log the start of an AI request.
   * Returns a request ID for use with logEnd().
   *
   * @param {object} params
   * @param {string} params.provider
   * @param {string} params.feature
   * @returns {string} requestId
   */
  logStart({ provider, feature }) {
    const requestId = this._generateId();
    const entry = {
      requestId,
      provider,
      feature,
      executionTime: 0,
      status: 'pending',
      error: null,
      retryCount: 0,
      timestamp: new Date().toISOString(),
      metadata: { startTime: Date.now() },
    };

    this._logs.push(entry);
    if (this._logs.length > this._maxLogs) {
      this._logs.shift();
    }

    return requestId;
  }

  /**
   * Log the completion of an AI request.
   *
   * @param {string} requestId - The ID returned by logStart().
   * @param {object} [overrides]
   * @param {'success'|'error'|'warning'} [overrides.status]
   * @param {string} [overrides.error]
   * @param {number} [overrides.retryCount]
   * @param {object} [overrides.metadata]
   */
  logComplete(requestId, overrides = {}) {
    const entry = this._logs.find((l) => l.requestId === requestId);
    if (!entry) {
      console.warn(`[AiLogger] logComplete() called with unknown requestId: ${requestId}`);
      return;
    }

    const startTime = entry.metadata?.startTime || Date.now();
    entry.executionTime = Date.now() - startTime;
    entry.status = overrides.status || 'success';
    entry.error = overrides.error || null;
    entry.retryCount = overrides.retryCount ?? entry.retryCount;
    entry.metadata = { ...entry.metadata, ...overrides.metadata };

    this._persist();
  }

  /**
   * Log an error for an AI request.
   *
   * @param {string} requestId
   * @param {string} error
   * @param {number} [retryCount]
   */
  logError(requestId, error, retryCount = 0) {
    this.logComplete(requestId, {
      status: 'error',
      error,
      retryCount,
    });
  }

  /**
   * Get all logs, optionally filtered.
   *
   * @param {object} [filters]
   * @param {string} [filters.provider]
   * @param {string} [filters.feature]
   * @param {string} [filters.status]
   * @param {number} [filters.limit=100]
   * @param {number} [filters.offset=0]
   * @returns {LogEntry[]}
   */
  getLogs(filters = {}) {
    const { provider, feature, status, limit = 100, offset = 0 } = filters;
    let filtered = [...this._logs];

    if (provider) filtered = filtered.filter((l) => l.provider === provider);
    if (feature) filtered = filtered.filter((l) => l.feature === feature);
    if (status) filtered = filtered.filter((l) => l.status === status);

    // Sort newest first
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return filtered.slice(offset, offset + limit);
  }

  /**
   * Get aggregated log statistics.
   *
   * @returns {Promise<object>}
   */
  async getStats() {
    const logs = this._logs;

    const total = logs.length;
    const successful = logs.filter((l) => l.status === 'success').length;
    const errors = logs.filter((l) => l.status === 'error').length;
    const avgExecutionTime =
      total > 0
        ? Math.round(logs.reduce((sum, l) => sum + l.executionTime, 0) / total)
        : 0;

    /** @type {Object<string, number>} */
    const byProvider = {};
    /** @type {Object<string, number>} */
    const byFeature = {};

    logs.forEach((l) => {
      byProvider[l.provider] = (byProvider[l.provider] || 0) + 1;
      byFeature[l.feature] = (byFeature[l.feature] || 0) + 1;
    });

    return {
      total,
      successful,
      errors,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      avgExecutionTime,
      byProvider,
      byFeature,
    };
  }

  /**
   * Clear all logs.
   */
  clearLogs() {
    this._logs = [];
    this._persist();
  }

  // ─── Private ──────────────────────────────────────────────────

  /** @private */
  _generateId() {
    return `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /** @private */
  _restore() {
    if (DEV_MODE) {
      try {
        const stored = localStorage.getItem(DEV_STORAGE_KEY);
        if (stored) {
          this._logs = JSON.parse(stored);
        }
      } catch {
        this._logs = [];
      }
    }
  }

  /** @private */
  _persist() {
    if (DEV_MODE) {
      try {
        localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(this._logs));
      } catch {
        // localStorage might be full
      }
    }
  }
}

/** Singleton instance */
export const AiLogger = new AiLoggerImpl();
