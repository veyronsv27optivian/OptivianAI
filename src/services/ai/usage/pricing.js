/**
 * Pricing table.
 *
 * Centralised pricing configuration for all AI providers/models.
 * Update prices here without changing any business logic.
 *
 * Prices are in USD per 1,000 tokens (prompt/completion).
 * Source: provider pricing pages (accurate as of April 2026).
 */

/**
 * @typedef {Object} ModelPricing
 * @property {number} input - Price per 1K input tokens (USD).
 * @property {number} output - Price per 1K output tokens (USD).
 * @property {'text'|'vision'} type
 */

/**
 * @type {Object<string, ModelPricing>}
 */
export const PRICING_TABLE = {
  // Gemini models
  'gemini-2.0-flash': { input: 0.0001, output: 0.0004, type: 'vision' },
  'gemini-2.0-flash-lite': { input: 0.000075, output: 0.0003, type: 'text' },
  'gemini-1.5-pro': { input: 0.00125, output: 0.005, type: 'vision' },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003, type: 'vision' },

  // DeepSeek / OpenRouter models
  'deepseek/deepseek-r1:free': { input: 0, output: 0, type: 'text' },
  'deepseek/deepseek-r1': { input: 0.00055, output: 0.00219, type: 'text' },
  'deepseek/deepseek-chat': { input: 0.00027, output: 0.0011, type: 'text' },

  // Qwen / OpenRouter models
  'qwen/qwen2.5-vl-72b-instruct:free': { input: 0, output: 0, type: 'vision' },
  'qwen/qwen2.5-vl-72b-instruct': { input: 0.00035, output: 0.0004, type: 'vision' },
  'qwen/qwen2.5-72b-instruct': { input: 0.00035, output: 0.0004, type: 'text' },

  // OpenAI models
  'gpt-4o-mini': { input: 0.00015, output: 0.0006, type: 'vision' },
  'gpt-4o': { input: 0.0025, output: 0.01, type: 'vision' },
  'gpt-4-turbo': { input: 0.01, output: 0.03, type: 'vision' },
  'gpt-4': { input: 0.03, output: 0.06, type: 'text' },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015, type: 'text' },

  // OpenAI via OpenRouter
  'openai/gpt-4o-mini': { input: 0.00015, output: 0.0006, type: 'vision' },
  'openai/gpt-4o': { input: 0.0025, output: 0.01, type: 'vision' },
  'openai/gpt-4-turbo': { input: 0.01, output: 0.03, type: 'vision' },
  'openai/gpt-4': { input: 0.03, output: 0.06, type: 'text' },
  'openai/gpt-3.5-turbo': { input: 0.0005, output: 0.0015, type: 'text' },

  // Claude via OpenRouter
  'anthropic/claude-3-opus': { input: 0.015, output: 0.075, type: 'vision' },
  'anthropic/claude-3-sonnet': { input: 0.003, output: 0.015, type: 'vision' },
  'anthropic/claude-3-haiku': { input: 0.00025, output: 0.00125, type: 'vision' },

  // Default pricing for unknown models (conservative estimate)
  __default__: { input: 0.001, output: 0.002, type: 'text' },
};

export const TOKEN_UNITS = {
  /** @type {string} */
  PER_1K: 'per_1k_tokens',
  /** @type {string} */
  PER_1M: 'per_1m_tokens',
};

/**
 * Estimate the cost of an AI request.
 *
 * @param {object} params
 * @param {string} params.model - Model name.
 * @param {number} [params.promptTokens=0] - Number of prompt (input) tokens.
 * @param {number} [params.completionTokens=0] - Number of completion (output) tokens.
 * @param {number} [params.totalTokens=0] - Total tokens (alternative to prompt+completion).
 * @returns {{ promptCost: number, completionCost: number, totalCost: number, unit: string }}
 */
export function estimateCost({ model, promptTokens = 0, completionTokens = 0, totalTokens = 0 }) {
  const pricing = PRICING_TABLE[model] || PRICING_TABLE.__default__;

  // If totalTokens is provided but not individual, split estimate 60/40
  if (totalTokens > 0 && promptTokens === 0 && completionTokens === 0) {
    promptTokens = Math.round(totalTokens * 0.6);
    completionTokens = totalTokens - promptTokens;
  }

  const promptCost = (promptTokens / 1000) * pricing.input;
  const completionCost = (completionTokens / 1000) * pricing.output;
  const totalCost = promptCost + completionCost;

  return {
    promptCost: Math.round(promptCost * 1e6) / 1e6,
    completionCost: Math.round(completionCost * 1e6) / 1e6,
    totalCost: Math.round(totalCost * 1e6) / 1e6,
    unit: 'USD',
  };
}

/**
 * Get pricing info for a specific model.
 *
 * @param {string} model
 * @returns {ModelPricing}
 */
export function getPricing(model) {
  return PRICING_TABLE[model] || PRICING_TABLE.__default__;
}

/**
 * Add or update pricing for a model at runtime.
 *
 * @param {string} model
 * @param {ModelPricing} pricing
 */
export function setPricing(model, pricing) {
  PRICING_TABLE[model] = pricing;
}
