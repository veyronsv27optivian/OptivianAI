/**
 * Qwen VL provider (backup, via OpenRouter).
 *
 * Uses the OpenAI-compatible OpenRouter API.  Qwen VL supports vision
 * (image analysis) in addition to text, making it a good fallback when
 * Gemini is unavailable for vision tasks.
 *
 * Environment variable: VITE_QWEN_API_KEY  (your OpenRouter API key)
 * Model:                VITE_QWEN_MODEL    (default: qwen/qwen2.5-vl-72b-instruct:free)
 *
 * API docs: https://openrouter.ai/docs/api-reference
 */
import { BaseProvider } from './provider';
import { PROVIDER_CONFIGS, AI_PROVIDERS } from '../config';
import { AiProviderError, AiConfigurationError } from '../errors';

export class QwenProvider extends BaseProvider {
  /**
   * @param {object}  [config]
   * @param {string}  [config.apiKey]      Override for VITE_QWEN_API_KEY
   * @param {string}  [config.model]       Override for VITE_QWEN_MODEL
   * @param {number}  [config.timeout]
   * @param {number}  [config.maxRetries]
   */
  constructor(config = {}) {
    const cfg = PROVIDER_CONFIGS[AI_PROVIDERS.QWEN];
    // Try specific key first, then shared OpenRouter key, then empty
    const specificKey = import.meta.env.VITE_QWEN_API_KEY;
    const sharedKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    super({
      apiKey: config.apiKey || specificKey || sharedKey || '',
      model: config.model || import.meta.env.VITE_QWEN_MODEL || cfg.defaultModel,
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
      name: 'Qwen VL',
      model: this.model,
      supportsStreaming: this.supportsStreaming,
      supportsVision: this.supportsVision,
    };
  }

  /** @override */
  _envKeyName() {
    return 'VITE_QWEN_API_KEY';
  }

  /** @override */
  isAvailable() {
    return !!this.apiKey;
  }

  /** @override */
  _buildHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...(import.meta.env.VITE_OPENROUTER_REFERRER
        ? { 'HTTP-Referer': import.meta.env.VITE_OPENROUTER_REFERRER }
        : {}),
      ...(import.meta.env.VITE_OPENROUTER_TITLE
        ? { 'X-Title': import.meta.env.VITE_OPENROUTER_TITLE }
        : {}),
    };
  }

  /** @override */
  async generateText(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new AiConfigurationError(
        'Qwen VL is not configured. Set VITE_QWEN_API_KEY in your environment.',
      );
    }

    return this._withRetry(() => this._generateTextOnce(prompt, options));
  }

  /**
   * @private
   */
  async _generateTextOnce(prompt, options = {}) {
    /** @type {Array<{ role: string, content: string|Array<object> }>} */
    const messages = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    // Support vision: if images are provided, build a multimodal message
    if (options.images && Array.isArray(options.images) && options.images.length > 0) {
      const content = [{ type: 'text', text: prompt }];
      for (const img of options.images) {
        content.push({
          type: 'image_url',
          image_url: { url: img.url || img },
        });
      }
      messages.push({ role: 'user', content });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const body = {
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      top_p: options.topP ?? 0.95,
    };

    const response = await this._fetchWithTimeout(this.endpoint, {
      method: 'POST',
      headers: this._buildHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    this._handleResponseError(response, data);

    const choice = data.choices?.[0];
    if (!choice) {
      throw new AiProviderError(
        'Qwen VL returned an empty response (no choices)',
        'Qwen VL',
        data,
      );
    }

    return {
      text: choice.message?.content || '',
      finishReason: choice.finish_reason || 'stop',
      usage: data.usage || null,
      modelUsed: this.model,
      provider: 'qwen',
    };
  }

  /** @override */
  async *generateStream(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new AiConfigurationError(
        'Qwen VL is not configured. Set VITE_QWEN_API_KEY in your environment.',
      );
    }

    /** @type {Array<{ role: string, content: string|Array<object> }>} */
    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    if (options.images && Array.isArray(options.images) && options.images.length > 0) {
      const content = [{ type: 'text', text: prompt }];
      for (const img of options.images) {
        content.push({
          type: 'image_url',
          image_url: { url: img.url || img },
        });
      }
      messages.push({ role: 'user', content });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const body = {
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      top_p: options.topP ?? 0.95,
      stream: true,
    };

    const response = await this._fetchWithTimeout(this.endpoint, {
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
      throw new AiProviderError('Qwen VL did not return a readable stream body', 'Qwen VL');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') break;

          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              yield { text: delta, done: false };
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { text: '', done: true };
  }
}
