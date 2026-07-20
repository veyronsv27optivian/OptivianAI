/**
 * Abstract base provider class.
 *
 * Every AI provider extends this class and implements the core methods.
 * Shared concerns (fetch with timeout, HTTP error mapping, retry logic)
 * live here so subclasses stay lean.
 */
import {
  AiError,
  AiProviderError,
  AiConfigurationError,
  AiRateLimitError,
  AiTimeoutError,
  AiContentFilterError,
} from '../errors';

export class BaseProvider {
  /**
   * @param {object}   config
   * @param {string}   config.apiKey
   * @param {string}   config.model
   * @param {string}   config.endpoint     Base API endpoint URL
   * @param {number}   [config.timeout]    Request timeout in ms (default 30_000)
   * @param {number}   [config.maxRetries] Number of retries on retryable errors (default 2)
   */
  constructor(config = {}) {
    /** @type {string} */
    this.apiKey = config.apiKey || '';
    /** @type {string} */
    this.model = config.model || '';
    /** @type {string} */
    this.endpoint = config.endpoint || '';
    /** @type {number} */
    this.timeout = config.timeout ?? 30_000;
    /** @type {number} */
    this.maxRetries = config.maxRetries ?? 2;

    // Subclasses set these
    this.supportsStreaming = false;
    this.supportsVision = false;
  }

  // ─── Abstract methods (overridden by subclasses) ──────────────

  /**
   * @returns {{ name: string, model: string, supportsStreaming: boolean, supportsVision: boolean }}
   */
  getProviderInfo() {
    return {
      name: '',
      model: this.model,
      supportsStreaming: this.supportsStreaming,
      supportsVision: this.supportsVision,
    };
  }

  /**
   * Returns true when the provider has an API key configured.
   * @returns {boolean}
   */
  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Generate text (non-streaming).
   * @param {string} prompt
   * @param {object} [options]
   * @param {string} [options.systemPrompt]
   * @param {number} [options.temperature]
   * @param {number} [options.maxTokens]
   * @param {number} [options.topP]
   * @returns {Promise<{ text: string, finishReason: string, usage: object|null, modelUsed: string, provider: string }>}
   */
  async generateText(_prompt, _options = {}) {
    throw new AiError(
      `${this.constructor.name} must implement generateText()`,
      'AI_NOT_IMPLEMENTED',
    );
  }

  /**
   * Generate text (streaming). Yields partial text chunks.
   * @param {string} prompt
   * @param {object} [options]
   * @param {string} [options.systemPrompt]
   * @param {number} [options.temperature]
   * @param {number} [options.maxTokens]
   * @returns {AsyncGenerator<{ text: string, done: boolean }, void, void>}
   */
  // eslint-disable-next-line require-yield
  async *generateStream(_prompt, _options = {}) {
    throw new AiError(
      `${this.constructor.name} must implement generateStream()`,
      'AI_NOT_IMPLEMENTED',
    );
  }

  // ─── Shared HTTP helpers ──────────────────────────────────────

  /**
   * Default headers for JSON requests.
   * Subclasses may override to add auth headers.
   * @returns {Record<string, string>}
   */
  _buildHeaders() {
    return { 'Content-Type': 'application/json' };
  }

  /**
   * Fetch with an AbortController-based timeout.
   * @param {string} url
   * @param {RequestInit} [options]
   * @returns {Promise<Response>}
   */
  async _fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new AiTimeoutError(
          `Request to ${this.getProviderInfo().name} timed out after ${this.timeout}ms`,
          this.getProviderInfo().name,
        );
      }
      // Network error (DNS, connection refused, etc.)
      throw new AiProviderError(
        `Network error while contacting ${this.getProviderInfo().name}: ${error.message}`,
        this.getProviderInfo().name,
        { originalError: error.message },
      );
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Map HTTP responses to typed errors.  Throws on non-OK responses.
   * @param {Response} response
   * @param {object}   [body]  Parsed JSON body (if available)
   * @returns {void}
   */
  _handleResponseError(response, body = {}) {
    const providerName = this.getProviderInfo().name;

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new AiRateLimitError(
        `Rate limit exceeded for ${providerName}`,
        providerName,
        retryAfter ? parseInt(retryAfter, 10) : null,
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new AiConfigurationError(
        `Invalid or missing API key for ${providerName}. Check your ${this._envKeyName()} environment variable.`,
        { status: response.status, provider: providerName },
      );
    }

    // Content filtered (common for safety violations)
    if (response.status === 400 && body?.error?.message?.includes('safety')) {
      throw new AiContentFilterError(
        `Content was filtered by ${providerName}'s safety system`,
        providerName,
        body.error.message,
      );
    }

    if (!response.ok) {
      const errMsg =
        body?.error?.message ||
        body?.error?.code ||
        `HTTP ${response.status} from ${providerName}`;
      throw new AiProviderError(errMsg, providerName, {
        status: response.status,
        statusText: response.statusText,
        body,
      });
    }
  }

  /**
   * Calculate a jittered backoff delay.
   * Adds ±25% randomness to avoid thundering-herd retries.
   * @param {number} baseMs
   * @returns {number}
   */
  _jitteredDelay(baseMs) {
    const jitter = 0.75 + Math.random() * 0.5; // 0.75–1.25
    return Math.round(baseMs * jitter);
  }

  /**
   * Retry wrapper: retries a fn up to maxRetries times for
   * retryable errors (rate-limit, timeout, 5xx).
   *
   * For 429 (rate-limit) errors, uses the Retry-After header when the
   * server provides it; otherwise applies jittered exponential backoff:
   *   attempt 0 → ~2s,  attempt 1 → ~4s,  attempt 2 → ~8s … (capped at 60s).
   *
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   * @template T
   */
  async _withRetry(fn) {
    let lastError = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (
          err instanceof AiRateLimitError ||
          err instanceof AiTimeoutError ||
          (err instanceof AiProviderError &&
            err.details?.status >= 500 &&
            err.details?.status < 600)
        ) {
          if (attempt < this.maxRetries) {
            let delayMs;
            if (err instanceof AiRateLimitError) {
              if (err.retryAfter) {
                // Server told us exactly how long to wait — use that
                delayMs = err.retryAfter * 1000;
              } else {
                // Jittered exponential backoff: 2s, 4s, 8s …
                delayMs = this._jitteredDelay(
                  Math.min(1000 * 2 ** (attempt + 1), 60_000),
                );
              }
            } else {
              // For timeouts and 5xx: faster backoff capped at 10s
              delayMs = Math.min(1000 * 2 ** attempt, 10_000);
            }
            await new Promise((r) => setTimeout(r, delayMs));
            continue;
          }
        }
        throw err; // non-retryable or out of attempts
      }
    }
    throw lastError;
  }

  /**
   * Return the expected env var name for this provider's API key.
   * Subclasses should override.
   * @returns {string}
   */
  _envKeyName() {
    return '';
  }
}
