/**
 * Provider manager – singleton module that manages provider lifecycle.
 *
 * Responsibilities:
 *  - Initialise all configured providers from env vars at startup.
 *  - Maintain the active (default) provider.
 *  - Provide a fallback chain for automatic retries across providers.
 *  - Expose helpers for UIs to list / switch providers.
 */
import { AI_PROVIDERS, PROVIDER_CONFIGS, PROVIDERS_BY_PRIORITY, ENV_KEYS } from './config';
import { GeminiProvider } from './providers/gemini';
import { DeepSeekProvider } from './providers/deepseek';
import { OpenAIViaOpenRouterProvider } from './providers/openaiViaOpenRouter';
import { AiConfigurationError } from './errors';

// ─── Module-level state ──────────────────────────────────────────

/** @type {Map<string, import('./providers/provider').BaseProvider>} */
const providers = new Map();

/** @type {string} */
let activeProviderName = AI_PROVIDERS.GEMINI;

/** @type {boolean} */
let initialized = false;

// ─── Initialisation ──────────────────────────────────────────────

/**
 * Initialise all providers from environment variables.
 * Safe to call multiple times – only runs once.
 *
 * @param {object}  [overrides]
 * @param {string}  [overrides.defaultProvider]   Override the default provider name
 * @param {object}  [overrides.apiKeys]           Override API keys per provider { gemini: '...', deepseek: '...' }
 */
export function initProviderManager(overrides = {}) {
  if (initialized) return;
  initialized = true;

  // Determine default provider from env or override
  const envDefault = import.meta.env[ENV_KEYS.DEFAULT_PROVIDER];
  activeProviderName = overrides.defaultProvider || envDefault || AI_PROVIDERS.DEEPSEEK;

  const apiKeys = overrides.apiKeys || {};

  // DeepSeek (PRIMARY — always active, always analyzing)
  providers.set(
    AI_PROVIDERS.DEEPSEEK,
    new DeepSeekProvider({ apiKey: apiKeys.deepseek }),
  );

  // Gemini (fallback)
  providers.set(
    AI_PROVIDERS.GEMINI,
    new GeminiProvider({ apiKey: apiKeys.gemini }),
  );


  // OpenAI (via OpenRouter — uses VITE_DEEPSEEK_API_KEY / OpenRouter key)
  providers.set(
    AI_PROVIDERS.OPENAI_VIA_OPENROUTER,
    new OpenAIViaOpenRouterProvider({ apiKey: apiKeys.openai }),
  );
}

// ─── Core API ────────────────────────────────────────────────────

/**
 * Returns the currently active provider.
 * Throws if the active provider has no API key configured.
 *
 * @returns {import('./providers/provider').BaseProvider}
 * @throws {AiConfigurationError}
 */
export function getActiveProvider() {
  if (!initialized) {
    initProviderManager();
  }

  // If the active provider is configured and available, use it
  const activeProvider = providers.get(activeProviderName);
  if (activeProvider?.isAvailable()) {
    return activeProvider;
  }

  // Auto-fallback to the first available provider
  for (const [name, p] of providers.entries()) {
    if (p.isAvailable()) {
      console.warn(
        `[AI] Provider "${activeProviderName}" is not configured. ` +
        `Auto-falling back to "${name}".`
      );
      activeProviderName = name;
      return p;
    }
  }

  // No providers are configured — throw with helpful message
  const missingKey = PROVIDER_CONFIGS[activeProviderName]?.envKey || 'the appropriate';
  throw new AiConfigurationError(
    `No AI providers are configured. Set ${missingKey} in your .env file. ` +
    `You can also set VITE_AI_DEFAULT_PROVIDER to one of: ${Object.values(AI_PROVIDERS).join(', ')}`,
  );
}

/**
 * Switch the active provider by name.
 * @param {string} name  One of AI_PROVIDERS values
 * @returns {boolean}  True if the switch succeeded
 */
export function setActiveProvider(name) {
  if (!Object.values(AI_PROVIDERS).includes(name)) {
    console.warn(`Unknown provider "${name}". Available: ${Object.values(AI_PROVIDERS).join(', ')}`);
    return false;
  }

  if (!providers.has(name)) {
    console.warn(`Provider "${name}" has not been initialised. Call initProviderManager() first.`);
    return false;
  }

  activeProviderName = name;
  return true;
}

/**
 * Get a provider by name (without switching to it).
 * @param {string} name
 * @returns {import('./providers/provider').BaseProvider|undefined}
 */
export function getProvider(name) {
  if (!initialized) initProviderManager();
  return providers.get(name);
}

/**
 * List all registered providers with their availability and metadata.
 * Useful for UIs that let admins pick a provider.
 *
 * @returns {Array<{ name: string, label: string, available: boolean, isActive: boolean, supportsVision: boolean, supportsStreaming: boolean, model: string }>}
 */
export function getAvailableProviders() {
  if (!initialized) initProviderManager();

  return Array.from(providers.entries()).map(([key, provider]) => {
    const info = provider.getProviderInfo();
    const cfg = PROVIDER_CONFIGS[key];
    return {
      name: key,
      label: cfg?.name || info.name,
      available: provider.isAvailable(),
      isActive: key === activeProviderName,
      supportsVision: provider.supportsVision,
      supportsStreaming: provider.supportsStreaming,
      model: provider.model,
    };
  });
}

/**
 * Returns the name of the currently active provider.
 * @returns {string}
 */
export function getActiveProviderName() {
  return activeProviderName;
}

/**
 * Returns the default provider name (Gemini, unless overridden by VITE_AI_DEFAULT_PROVIDER).
 * @returns {string}
 */
export function getDefaultProviderName() {
  return import.meta.env[ENV_KEYS.DEFAULT_PROVIDER] || AI_PROVIDERS.GEMINI;
}

// ─── Fallback chain ──────────────────────────────────────────────

/**
 * Try the active provider first; if it fails, walk the fallback chain.
 *
 * @param {(provider: import('./providers/provider').BaseProvider) => Promise<T>} fn
 *        An async function that uses the provider (e.g. generateText).
 * @param {object}  [options]
 * @param {boolean} [options.requireVision=false]  If true, skip providers without vision support.
 * @returns {Promise<{ result: T, providerUsed: string }>}
 * @template T
 */
export async function withFallback(fn, options = {}) {
  if (!initialized) initProviderManager();

  // Build ordered candidate list: start with active, then rest by priority
  const candidates = PROVIDERS_BY_PRIORITY
    .filter((cfg) => {
      // Skip the active provider (tried first below)
      if (cfg.name === activeProviderName) return false;
      // Skip providers without vision when vision is required
      if (options.requireVision && !cfg.supportsVision) return false;
      return true;
    })
    .map((cfg) => providers.get(cfg.name))
    .filter(Boolean);

  // Try active provider first
  try {
    const active = getActiveProvider();
    const result = await fn(active);
    return { result, providerUsed: activeProviderName };
  } catch (err) {
    console.warn(
      `[AI] Primary provider "${activeProviderName}" failed: ${err.message}. Trying fallbacks...`,
    );
  }

  // Walk fallback candidates
  for (const provider of candidates) {
    if (!provider.isAvailable()) continue;
    try {
      const result = await fn(provider);
      const usedName = [...providers.entries()].find(([, p]) => p === provider)?.[0] || 'unknown';
      return { result, providerUsed: usedName };
    } catch (err) {
      console.warn(`[AI] Fallback provider "${provider.getProviderInfo().name}" failed: ${err.message}`);
    }
  }

  throw new AiConfigurationError(
    'All AI providers failed. Check your API key configurations.',
  );
}

/**
 * Reset the provider manager (useful for testing).
 */
export function resetProviderManager() {
  providers.clear();
  activeProviderName = AI_PROVIDERS.GEMINI;
  initialized = false;
}
