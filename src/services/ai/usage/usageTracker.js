/**
 * Usage tracker.
 *
 * Tracks token usage and estimated costs for every AI request.
 * Integrates with the analytics system for reporting.
 */
import { estimateCost } from './pricing';
import { AnalyticsTracker } from '../analytics/analyticsTracker';

export const UsageTracker = {
  /**
   * Track token usage for an AI request.
   *
   * @param {object} params
   * @param {string} params.provider
   * @param {string} params.model
   * @param {number} [params.promptTokens]
   * @param {number} [params.completionTokens]
   * @param {number} [params.totalTokens]
   * @param {number} params.latency
   * @param {boolean} params.success
   * @param {string} params.feature
   * @param {string} [params.organizationId]
   * @param {string} [params.userId]
   */
  trackUsage(params) {
    const { provider, model, promptTokens, completionTokens, totalTokens, latency, success, feature, organizationId, userId } = params;

    const cost = estimateCost({ model, promptTokens, completionTokens, totalTokens });

    // Track in analytics with token usage details
    AnalyticsTracker.track({
      provider,
      model,
      latency,
      success,
      feature,
      organization_id: organizationId,
      user_id: userId,
      token_usage: {
        prompt_tokens: promptTokens ?? 0,
        completion_tokens: completionTokens ?? 0,
        total_tokens: totalTokens ?? (promptTokens ?? 0) + (completionTokens ?? 0),
        prompt_cost: cost.promptCost,
        completion_cost: cost.completionCost,
        total_cost: cost.totalCost,
      },
    });
  },

  /**
   * Calculate cumulative usage stats from analytics events.
   *
   * @param {Array<object>} events - Array of analytics events.
   * @returns {{ totalTokens: number, totalCost: number, avgTokensPerRequest: number, byModel: object }}
   */
  calculateStats(events) {
    let totalTokens = 0;
    let totalCost = 0;
    let totalRequests = 0;

    /** @type {Object<string, { requests: number, tokens: number, cost: number }>} */
    const byModel = {};

    events.forEach((event) => {
      const usage = event.token_usage || event.tokenUsage || {};
      const tokens = usage.total_tokens || usage.totalTokens || 0;
      const cost = usage.total_cost || usage.totalCost || 0;

      totalTokens += tokens;
      totalCost += cost;
      totalRequests++;

      const model = event.model || 'unknown';
      if (!byModel[model]) {
        byModel[model] = { requests: 0, tokens: 0, cost: 0 };
      }
      byModel[model].requests++;
      byModel[model].tokens += tokens;
      byModel[model].cost += cost;
    });

    return {
      totalTokens,
      totalCost: Math.round(totalCost * 1e6) / 1e6,
      avgTokensPerRequest: totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
      totalRequests,
      byModel,
    };
  },
};
