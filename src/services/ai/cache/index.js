/**
 * AI Cache barrel.
 *
 * Intelligent caching for AI requests.
 * If an identical request exists, reuses it instead of calling the provider again.
 * Supports configurable TTL, cache invalidation, organisation isolation,
 * and provider isolation.
 *
 * Backends: localStorage (DEV_MODE) and concept of Supabase (for future server-side caching).
 */

export { AiCache } from './aiCache';
