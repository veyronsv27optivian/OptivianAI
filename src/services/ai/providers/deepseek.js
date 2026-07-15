/**
 * DeepSeek provider (backup, via OpenRouter).
 *
 * Uses the OpenAI-compatible OpenRouter API.
 * Environment variable: VITE_DEEPSEEK_API_KEY  (your OpenRouter API key)
 * Model:                VITE_DEEPSEEK_MODEL    (default: deepseek/deepseek-r1:free)
 *
 * DeepSeek is text-only (no vision support).
 * API docs: https://openrouter.ai/docs/api-reference
 */
import { BaseProvider } from './provider';
import { PROVIDER_CONFIGS, AI_PROVIDERS } from '../config';
import { AiProviderError, AiConfigurationError } from '../errors';

export class DeepSeekProvider extends BaseProvider {
  /**
   * @param {object}  [config]
   * @param {string}  [config.apiKey]      Override for VITE_DEEPSEEK_API_KEY
   * @param {string}  [config.model]       Override for VITE_DEEPSEEK_MODEL
   * @param {number}  [config.timeout]
   * @param {number}  [config.maxRetries]
   */
  constructor(config = {}) {
    const cfg = PROVIDER_CONFIGS[AI_PROVIDERS.DEEPSEEK];
    // Try specific key first, then shared OpenRouter key, then empty
    const specificKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    const sharedKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    super({
      apiKey: config.apiKey || specificKey || sharedKey || '',
      model: config.model || import.meta.env.VITE_DEEPSEEK_MODEL || cfg.defaultModel,
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
      name: 'DeepSeek',
      model: this.model,
      supportsStreaming: this.supportsStreaming,
      supportsVision: this.supportsVision,
    };
  }

  /** @override */
  _envKeyName() {
    return 'VITE_DEEPSEEK_API_KEY';
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
        'DeepSeek is not configured. Set VITE_DEEPSEEK_API_KEY in your environment.',
      );
    }

    return this._withRetry(() => this._generateTextOnce(prompt, options));
  }

  /**
   * @private
   */
  async _generateTextOnce(prompt, options = {}) {
    /** @type {Array<{ role: string, content: string }>} */
    const messages = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

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
        'DeepSeek returned an empty response (no choices)',
        'DeepSeek',
        data,
      );
    }

    return {
      text: choice.message?.content || '',
      finishReason: choice.finish_reason || 'stop',
      usage: data.usage || null,
      modelUsed: this.model,
      provider: 'deepseek',
    };
  }

  /** @override */
  async *generateStream(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new AiConfigurationError(
        'DeepSeek is not configured. Set VITE_DEEPSEEK_API_KEY in your environment.',
      );
    }

    /** @type {Array<{ role: string, content: string }>} */
    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

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
      throw new AiProviderError('DeepSeek did not return a readable stream body', 'DeepSeek');
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
