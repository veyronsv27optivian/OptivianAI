/**
 * Token & Cost Tracking barrel.
 *
 * Tracks prompt tokens, completion tokens, total tokens, estimated cost,
 * provider, and model for every AI request.
 *
 * Pricing is centralised here so it can be updated without changing
 * business logic in other modules.
 */

export { UsageTracker } from './usageTracker';
export { PRICING_TABLE, estimateCost, TOKEN_UNITS } from './pricing';
