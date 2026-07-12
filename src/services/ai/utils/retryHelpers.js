/**
 * Retry helpers.
 *
 * Higher-level retry utilities for AI operations.
 * Used by tools and prompts to handle transient failures gracefully.
 * The BaseProvider already has _withRetry for HTTP-level retries;
 * these helpers are for application-level retry scenarios.
 */

/**
 * Calculate exponential backoff delay.
 * @param {number} attempt - Zero-based attempt number.
 * @param {number} [baseMs=1000] - Base delay in ms.
 * @param {number} [maxMs=30000] - Maximum delay in ms.
 * @returns {number} Delay in ms.
 */
export function exponentialBackoff(attempt, baseMs = 1000, maxMs = 30000) {
  const delay = baseMs * 2 ** attempt;
  return Math.min(delay, maxMs);
}

/**
 * Calculate jittered backoff (adds randomness to avoid thundering herd).
 * @param {number} attempt
 * @param {number} [baseMs=1000]
 * @param {number} [maxMs=30000]
 * @returns {number}
 */
export function jitteredBackoff(attempt, baseMs = 1000, maxMs = 30000) {
  const delay = exponentialBackoff(attempt, baseMs, maxMs);
  return Math.round(delay * (0.5 + Math.random() * 0.5));
}

/**
 * Retry an async function with configurable backoff.
 *
 * @param {() => Promise<T>} fn - The async function to retry.
 * @param {object} [options]
 * @param {number} [options.maxRetries=3]
 * @param {number} [options.baseDelayMs=1000]
 * @param {boolean} [options.jitter=true]
 * @param {(error: Error, attempt: number) => boolean} [options.shouldRetry]
 *        Return true to retry, false to abort. Default retries all errors.
 * @returns {Promise<T>}
 * @template T
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    jitter = true,
    shouldRetry = () => true,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && shouldRetry(err, attempt)) {
        const delay = jitter
          ? jitteredBackoff(attempt, baseDelayMs)
          : exponentialBackoff(attempt, baseDelayMs);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }

  throw lastError;
}

/**
 * Check if an error is likely transient and retryable.
 * @param {Error} err
 * @returns {boolean}
 */
export function isRetryableError(err) {
  const retryableCodes = [
    'AI_TIMEOUT_ERROR',
    'AI_RATE_LIMIT_ERROR',
    'AI_PROVIDER_ERROR',
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
  ];

  if (err.code && retryableCodes.includes(err.code)) return true;
  if (err.name === 'TypeError' && err.message.includes('fetch')) return true;
  if (err.message?.includes('network') || err.message?.includes('timeout')) return true;

  return false;
}

export const retryHelpers = {
  exponentialBackoff,
  jitteredBackoff,
  withRetry,
  isRetryableError,
};
