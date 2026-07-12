/**
 * Analytics tracker.
 *
 * Tracks every AI request with relevant metadata for monitoring,
 * dashboards, and cost analysis.
 *
 * Stores events in Supabase (production) and localStorage (DEV_MODE).
 * All analytics methods are fire-and-forget (non-blocking to the caller).
 */
import { supabase } from '../../supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;
const DEV_STORAGE_KEY = 'optivian_ai_analytics_events';

/** @type {Array<object>} */
let eventBuffer = [];

let flushTimer = null;

/**
 * @typedef {Object} AnalyticsEvent
 * @property {string} provider - Provider name (gemini, deepseek, qwen).
 * @property {string} model - Model name used.
 * @property {number} latency - Request latency in ms.
 * @property {boolean} success - Whether the request succeeded.
 * @property {string} timestamp - ISO timestamp.
 * @property {string} [organization_id] - Organisation UUID.
 * @property {string} [user_id] - User/profile UUID.
 * @property {string} [feature] - Feature/tool used.
 * @property {object} [token_usage] - Token usage details.
 * @property {string} [error_code] - Error code if failed.
 * @property {string} [request_id] - Unique request ID.
 */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getDevEvents() {
  try {
    return JSON.parse(localStorage.getItem(DEV_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveDevEvents(events) {
  localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(events));
}

export const AnalyticsTracker = {
  /**
   * Track an AI request completion.
   *
   * @param {AnalyticsEvent} event
   */
  track(event) {
    const entry = {
      id: uid(),
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };

    eventBuffer.push(entry);

    // Flush every 5 seconds or when buffer exceeds 20 events
    if (eventBuffer.length >= 20) {
      this.flush();
    } else if (!flushTimer) {
      flushTimer = setTimeout(() => this.flush(), 5000);
    }
  },

  /**
   * Track a successful AI request with timing.
   *
   * @param {object} params
   * @param {string} params.provider
   * @param {string} params.model
   * @param {number} params.latency
   * @param {string} params.feature
   * @param {string} [params.organizationId]
   * @param {string} [params.userId]
   * @param {object} [params.tokenUsage]
   * @param {string} [params.requestId]
   */
  trackSuccess({ provider, model, latency, feature, organizationId, userId, tokenUsage, requestId }) {
    this.track({
      provider,
      model,
      latency,
      success: true,
      feature,
      organization_id: organizationId,
      user_id: userId,
      token_usage: tokenUsage,
      request_id: requestId || uid(),
    });
  },

  /**
   * Track a failed AI request.
   *
   * @param {object} params
   * @param {string} params.provider
   * @param {string} params.model
   * @param {number} params.latency
   * @param {string} params.feature
   * @param {string} params.errorCode
   * @param {string} [params.errorMessage]
   * @param {string} [params.organizationId]
   * @param {string} [params.userId]
   * @param {string} [params.requestId]
   */
  trackFailure({ provider, model, latency, feature, errorCode, errorMessage, organizationId, userId, requestId }) {
    this.track({
      provider,
      model,
      latency,
      success: false,
      feature,
      error_code: errorCode,
      error_message: errorMessage,
      organization_id: organizationId,
      user_id: userId,
      request_id: requestId || uid(),
    });
  },

  /**
   * Flush buffered events to persistent storage.
   * @returns {Promise<void>}
   */
  async flush() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    if (eventBuffer.length === 0) return;

    const batch = eventBuffer.splice(0);

    if (DEV_MODE) {
      const existing = getDevEvents();
      existing.push(...batch);
      // Keep only last 10,000 events
      if (existing.length > 10000) {
        existing.splice(0, existing.length - 10000);
      }
      saveDevEvents(existing);
    } else {
      try {
        const { error } = await supabase.from('ai_request_logs').insert(batch);
        if (error) {
          console.warn('[Analytics] Failed to persist events batch:', error.message);
          // Re-queue on failure
          eventBuffer.unshift(...batch);
        }
      } catch (err) {
        console.warn('[Analytics] Failed to persist events batch:', err.message);
        eventBuffer.unshift(...batch);
      }
    }
  },

  /**
   * Get all tracked events for analysis.
   *
   * @param {object} [filters]
   * @param {string} [filters.provider]
   * @param {string} [filters.feature]
   * @param {boolean} [filters.success]
   * @param {number} [filters.limit=1000]
   * @returns {Promise<AnalyticsEvent[]>}
   */
  async getEvents(filters = {}) {
    const { provider, feature, success, limit = 1000 } = filters;

    if (DEV_MODE) {
      let events = getDevEvents();
      if (provider) events = events.filter((e) => e.provider === provider);
      if (feature) events = events.filter((e) => e.feature === feature);
      if (success !== undefined) events = events.filter((e) => e.success === success);
      return events.slice(-limit);
    }

    try {
      let query = supabase.from('ai_request_logs').select('*').limit(limit).order('timestamp', { ascending: false });

      if (provider) query = query.eq('provider', provider);
      if (feature) query = query.eq('feature', feature);
      if (success !== undefined) query = query.eq('success', success);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[Analytics] Failed to fetch events:', err.message);
      return [];
    }
  },

  /**
   * Get aggregate analytics (success rate, avg latency, total requests).
   *
   * @param {object} [filters]
   * @returns {Promise<object>}
   */
  async getAggregates(filters = {}) {
    const events = await this.getEvents(filters);
    const total = events.length;
    if (total === 0) {
      return { total: 0, successRate: 0, avgLatency: 0, errors: {} };
    }

    const successful = events.filter((e) => e.success);
    const avgLatency = events.reduce((sum, e) => sum + (e.latency || 0), 0) / total;

    /** @type {Object<string, number>} */
    const errors = {};
    events
      .filter((e) => !e.success && e.errorCode)
      .forEach((e) => {
        errors[e.errorCode] = (errors[e.errorCode] || 0) + 1;
      });

    return {
      total,
      successRate: successful.length / total,
      avgLatency: Math.round(avgLatency),
      errors,
    };
  },
};
