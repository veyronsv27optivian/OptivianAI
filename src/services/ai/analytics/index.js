/**
 * AI Usage Analytics barrel.
 *
 * Tracks every AI request with provider, model, latency, success/failure,
 * timestamp, organisation, user, feature/tool used, and token usage.
 *
 * Provides reusable analytics methods for future dashboards.
 */

export { AnalyticsTracker } from './analyticsTracker';
export { getAnalytics } from './analyticsQueries';
