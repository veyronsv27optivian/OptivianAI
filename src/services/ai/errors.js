/**
 * Custom error hierarchy for AI operations.
 *
 * Every AI-related error extends AiError so callers can catch a single type
 * or differentiate by code / provider for tailored UX.
 */

export class AiError extends Error {
  /**
   * @param {string} message  Human-readable description
   * @param {string} [code]   Machine-readable error code (default 'AI_ERROR')
   * @param {*}      [details] Optional structured context (status codes, body, etc.)
   */
  constructor(message, code = 'AI_ERROR', details = null) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.details = details;
  }
}

// ─── Configuration ───────────────────────────────────────────────

export class AiConfigurationError extends AiError {
  /**
   * @param {string} message
   * @param {*} [details]
   */
  constructor(message, details = null) {
    super(message, 'AI_CONFIGURATION_ERROR', details);
    this.name = 'AiConfigurationError';
  }
}

// ─── Provider errors ─────────────────────────────────────────────

export class AiProviderError extends AiError {
  /**
   * @param {string} message
   * @param {string} provider  The provider name that failed
   * @param {*} [details]
   */
  constructor(message, provider, details = null) {
    super(message, 'AI_PROVIDER_ERROR', details);
    this.name = 'AiProviderError';
    this.provider = provider;
  }
}

export class AiRateLimitError extends AiError {
  /**
   * @param {string} message
   * @param {string} provider
   * @param {number|null} [retryAfter]  Seconds to wait before retrying (from Retry-After header)
   */
  constructor(message, provider, retryAfter = null) {
    super(message, 'AI_RATE_LIMIT_ERROR', { retryAfter });
    this.name = 'AiRateLimitError';
    this.provider = provider;
    /** @type {number|null} */
    this.retryAfter = retryAfter;
  }
}

export class AiTimeoutError extends AiError {
  /**
   * @param {string} message
   * @param {string} provider
   */
  constructor(message, provider) {
    super(message, 'AI_TIMEOUT_ERROR', { provider });
    this.name = 'AiTimeoutError';
    this.provider = provider;
  }
}

export class AiContentFilterError extends AiError {
  /**
   * @param {string} message
   * @param {string} provider
   * @param {string} [reason]
   */
  constructor(message, provider, reason = null) {
    super(message, 'AI_CONTENT_FILTERED', { provider, reason });
    this.name = 'AiContentFilterError';
    this.provider = provider;
    this.reason = reason;
  }
}
