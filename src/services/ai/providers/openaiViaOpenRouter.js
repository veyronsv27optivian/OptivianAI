/**
 * OpenAI (via OpenRouter) provider.
 *
 * Routes OpenAI models through OpenRouter, so you can use GPT-4o,
 * GPT-4o-mini, and other OpenAI models with your OpenRouter API key
 * — no separate OpenAI API key needed.
 *
 * Environment variable: VITE_DEEPSEEK_API_KEY (reuses your OpenRouter key)
 * Default model: openai/gpt-4o-mini
 *
 * Override model with: VITE_OPENROUTER_OPENAI_MODEL
 *
 * API docs: https://openrouter.ai/docs/api-reference
 */
import { BaseProvider } from './provider';
import { PROVIDER_CONFIGS, AI_PROVIDERS } from '../config';
import { AiProviderError, AiConfigurationError } from '../errors';

export class OpenAIViaOpenRouterProvider extends BaseProvider {
  /**
   * @param {object}  [config]
   * @param {string}  [config.apiKey]   Override (defaults to VITE_DEEPSEEK_API_KEY / OpenRouter key)
   * @param {string}  [config.model]    Override for VITE_OPENROUTER_OPENAI_MODEL
   */
  constructor(config = {}) {
    const cfg = PROVIDER_CONFIGS[AI_PROVIDERS.OPENAI_VIA_OPENROUTER];
    // Try specific env var first, then shared OpenRouter key, then DeepSeek fallback, then empty
    const specificKey = import.meta.env.VITE_OPENROUTER_OPENAI_MODEL; // Re-uses the model env var for clarity
    const sharedKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const deepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    super({
      apiKey: config.apiKey || sharedKey || deepseekKey || '',
      model: config.model || import.meta.env.VITE_OPENROUTER_OPENAI_MODEL || cfg.defaultModel,
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
      name: 'OpenAI (via OpenRouter)',
      model: this.model,
      supportsStreaming: this.supportsStreaming,
      supportsVision: this.supportsVision,
    };
  }

  /** @override */
  _envKeyName() {
    return 'VITE_OPENROUTER_API_KEY';
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
        'OpenAI (via OpenRouter) is not configured. Set VITE_DEEPSEEK_API_KEY in your environment.',
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
      // OpenRouter web search grounding
      plugins: [{ id: 'web', max_results: 3 }],
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
        'OpenAI (via OpenRouter) returned an empty response',
        'OpenAI (via OpenRouter)',
        data,
      );
    }

    return {
      text: choice.message?.content || '',
      finishReason: choice.finish_reason || 'stop',
      usage: data.usage || null,
      modelUsed: this.model,
      provider: 'openai_via_openrouter',
    };
  }

  /** @override */
  async *generateStream(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new AiConfigurationError(
        'OpenAI (via OpenRouter) is not configured.',
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
      // OpenRouter web search grounding
      plugins: [{ id: 'web', max_results: 3 }],
    };

    const response = await this._fetchWithTimeout(this.endpoint, {
      method: 'POST',
      headers: this._buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorBody = {};
      try { errorBody = await response.json(); } catch { /* ignore */ }
      this._handleResponseError(response, errorBody);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new AiProviderError('OpenAI (via OpenRouter) did not return a readable stream body', 'OpenAI (via OpenRouter)');
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
          } catch { /* skip malformed lines */ }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { text: '', done: true };
  }
}
