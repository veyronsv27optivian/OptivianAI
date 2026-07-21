/**
 * Gemini provider (DEFAULT).
 *
 * Uses the Google AI Studio REST API (gemini-3.1-flash-lite by default).
 * Environment variable: VITE_GEMINI_API_KEY
 * Custom model:         VITE_GEMINI_MODEL  (default: gemini-3.1-flash-lite)
 *
 * API docs: https://ai.google.dev/api/generate-content
 */
import { BaseProvider } from './provider';
import { PROVIDER_CONFIGS, AI_PROVIDERS } from '../config';
import { AiProviderError, AiConfigurationError } from '../errors';

export class GeminiProvider extends BaseProvider {
  /**
   * @param {object}  [config]
   * @param {string}  [config.apiKey]   Override for VITE_GEMINI_API_KEY
   * @param {string}  [config.model]    Override for VITE_GEMINI_MODEL
   * @param {number}  [config.timeout]
   * @param {number}  [config.maxRetries]
   */
  constructor(config = {}) {
    const cfg = PROVIDER_CONFIGS[AI_PROVIDERS.GEMINI];
    super({
      apiKey: config.apiKey || import.meta.env.VITE_GEMINI_API_KEY || '',
      model: config.model || import.meta.env.VITE_GEMINI_MODEL || cfg.defaultModel,
      endpoint: cfg.endpoint,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
    });
    this.supportsStreaming = cfg.supportsStreaming;
    this.supportsVision = cfg.supportsVision;
  }

  /** @override */
  getProviderInfo() {
    return {
      name: 'Gemini',
      model: this.model,
      supportsStreaming: this.supportsStreaming,
      supportsVision: this.supportsVision,
    };
  }

  /** @override */
  _envKeyName() {
    return 'VITE_GEMINI_API_KEY';
  }

  /** @override */
  isAvailable() {
    return !!this.apiKey && this._isValidApiKey(this.apiKey);
  }

  /**
   * Google AI Studio keys start with "AIza" or "AQ.".
   * @param {string} key
   * @returns {boolean}
   */
  _isValidApiKey(key) {
    return typeof key === 'string' && (key.startsWith('AIza') || key.startsWith('AQ.'));
  }

  _assertConfigured() {
    if (!this.apiKey) {
      throw new AiConfigurationError(
        'Gemini is not configured. Set VITE_GEMINI_API_KEY in your environment.',
      );
    }

    if (!this._isValidApiKey(this.apiKey)) {
      throw new AiConfigurationError(
        'Invalid Gemini API key format. Create a key at https://aistudio.google.com/apikey ' +
        'and set VITE_GEMINI_API_KEY in your .env file. Keys must start with "AIza" or "AQ.".',
      );
    }
  }

  // ─── Text (non-streaming) ─────────────────────────────────────

  /** @override */
  async generateText(prompt, options = {}) {
    this._assertConfigured();

    // Auto-route to vision-capable model when needed
    const needsVision = options.requireVision || (options.images && options.images.length > 0);
    const effectiveModel = needsVision ? 'gemini-3.5-flash' : undefined;

    return this._withRetry(() => this._generateTextOnce(prompt, { ...options, effectiveModel }));
  }

  /**
   * Single non-retried text generation call.
   * @private
   */
  async _generateTextOnce(prompt, options = {}) {
    const model = options.effectiveModel || this.model;
    const url = `${this.endpoint}/${model}:generateContent?key=${this.apiKey}`;

    /** @type {object} */
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
        topP: options.topP ?? 0.95,
        topK: options.topK ?? 40,
      },
    };

    if (options.systemPrompt) {
      body.systemInstruction = { parts: [{ text: options.systemPrompt }] };
    }

    const response = await this._fetchWithTimeout(url, {
      method: 'POST',
      headers: this._buildHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    this._handleResponseError(response, data);

    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new AiProviderError(
        'Gemini returned an empty response (no candidates)',
        'Gemini',
        data,
      );
    }

    const text = candidate.content?.parts?.map((p) => p.text).filter(Boolean).join('\n') || '';

    return {
      text,
      finishReason: candidate.finishReason || 'STOP',
      usage: data.usageMetadata || null,
      modelUsed: model,
      provider: 'gemini',
    };
  }

  // ─── Streaming -------------------------------------------------

  /** @override */
  async *generateStream(prompt, options = {}) {
    this._assertConfigured();

    // Auto-route to vision-capable model when needed
    const needsVision = options.requireVision || (options.images && options.images.length > 0);
    const effectiveModel = needsVision ? 'gemini-3.5-flash' : this.model;
    const url = `${this.endpoint}/${effectiveModel}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    /** @type {object} */
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
        topP: options.topP ?? 0.95,
        topK: options.topK ?? 40,
      },
    };

    if (options.systemPrompt) {
      body.systemInstruction = { parts: [{ text: options.systemPrompt }] };
    }

    const response = await this._fetchWithTimeout(url, {
      method: 'POST',
      headers: this._buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch {
        // ignore parse errors
      }
      this._handleResponseError(response, errorBody);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new AiProviderError('Gemini did not return a readable stream body', 'Gemini');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last partial line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const candidate = json.candidates?.[0];
            if (candidate?.content?.parts) {
              for (const part of candidate.content.parts) {
                if (part.text) {
                  yield { text: part.text, done: false };
                }
              }
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { text: '', done: true };
  }
}
