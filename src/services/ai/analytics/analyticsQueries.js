/**
 * Analytics queries.
 *
 * Higher-level analytics query functions for dashboards and reports.
 * Uses the AnalyticsTracker for data retrieval.
 */
import { AnalyticsTracker } from './analyticsTracker';

/**
 * Get analytics summary for a time period.
 *
 * @param {object} params
 * @param {string} [params.provider]
 * @param {string} [params.feature]
 * @param {number} [params.lastNMinutes]
 * @returns {Promise<object>}
 */
export async function getAnalytics(params = {}) {
  const events = await AnalyticsTracker.getEvents(params);

  const total = events.length;
  const successful = events.filter((e) => e.success);
  const failed = events.filter((e) => !e.success);

  /** @type {Object<string, number>} */
  const byProvider = {};
  /** @type {Object<string, number>} */
  const byFeature = {};

  events.forEach((e) => {
    byProvider[e.provider] = (byProvider[e.provider] || 0) + 1;
    byFeature[e.feature] = (byFeature[e.feature] || 0) + 1;
  });

  const avgLatency =
    total > 0 ? Math.round(events.reduce((sum, e) => sum + (e.latency || 0), 0) / total) : 0;

  const totalTokens = events.reduce((sum, e) => {
    const usage = e.token_usage || e.tokenUsage;
    return sum + ((usage?.total_tokens || usage?.totalTokens) ?? 0);
  }, 0);

  return {
    total,
    successful: successful.length,
    failed: failed.length,
    successRate: total > 0 ? (successful.length / total) * 100 : 0,
    avgLatency,
    totalTokens,
    byProvider,
    byFeature,
  };
}
