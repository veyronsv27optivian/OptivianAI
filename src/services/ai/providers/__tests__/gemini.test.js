import { describe, it, expect, vi } from 'vitest';
import { GeminiProvider } from '../gemini';
import { AiConfigurationError } from '../../errors';

describe('GeminiProvider', () => {
  it('should accept valid standard API keys starting with AIza', () => {
    const provider = new GeminiProvider({ apiKey: 'AIzaSyTestKey123' });
    expect(provider.isAvailable()).toBe(true);
    expect(() => provider._assertConfigured()).not.toThrow();
  });

  it('should accept valid new API keys starting with AQ.', () => {
    const provider = new GeminiProvider({ apiKey: 'AQ.Ab8RNTestKey123' });
    expect(provider.isAvailable()).toBe(true);
    expect(() => provider._assertConfigured()).not.toThrow();
  });

  it('should reject empty API keys', () => {
    const provider = new GeminiProvider();
    provider.apiKey = ''; // Explicitly override fallback to environment variable
    expect(provider.isAvailable()).toBe(false);
    expect(() => provider._assertConfigured()).toThrow(AiConfigurationError);
    expect(() => provider._assertConfigured()).toThrow('Gemini is not configured');
  });

  it('should reject invalid API keys', () => {
    const provider = new GeminiProvider({ apiKey: 'invalid_key_format' });
    expect(provider.isAvailable()).toBe(false);
    expect(() => provider._assertConfigured()).toThrow(AiConfigurationError);
    expect(() => provider._assertConfigured()).toThrow('Invalid Gemini API key format');
  });
});
