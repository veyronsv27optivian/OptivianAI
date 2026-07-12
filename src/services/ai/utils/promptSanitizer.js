/**
 * Prompt sanitizer.
 *
 * Cleans and normalizes user input before sending to AI providers.
 * Prevents prompt injection, removes excessive whitespace,
 * truncates inputs, and applies content safety rules.
 */
export const promptSanitizer = {
  /**
   * Maximum input length before truncation.
   * @type {number}
   */
  MAX_INPUT_LENGTH: 100_000,

  /**
   * Sanitize a user prompt for safe AI consumption.
   *
   * @param {string} input - Raw user input.
   * @param {object} [options]
   * @param {number} [options.maxLength] - Max characters (default 100_000).
   * @param {boolean} [options.stripMarkdown=false] - Strip markdown formatting.
   * @param {boolean} [options.sanitizeHtml=false] - Strip HTML tags.
   * @returns {string}
   */
  sanitize(input, options = {}) {
    if (!input || typeof input !== 'string') return '';

    const { maxLength = this.MAX_INPUT_LENGTH, stripMarkdown = false, sanitizeHtml = false } = options;

    let result = input.trim();

    // Strip HTML if requested (basic sanitation)
    if (sanitizeHtml) {
      result = result.replace(/<[^>]*>/g, '');
    }

    // Strip markdown if requested
    if (stripMarkdown) {
      result = result.replace(/[#*_~`>|-]{1,3}/g, '');
    }

    // Normalize excessive whitespace (keep single newlines)
    result = result.replace(/[ \t]+/g, ' ');
    result = result.replace(/\n{4,}/g, '\n\n\n');

    // Truncate if over max length
    if (result.length > maxLength) {
      result = result.slice(0, maxLength) + '\n\n[Content truncated...]';
    }

    return result;
  },

  /**
   * Strip potential prompt injection patterns.
   * Removes "ignore previous instructions", "system prompt", etc.
   *
   * @param {string} input
   * @returns {string}
   */
  stripInjections(input) {
    if (!input) return '';

    const patterns = [
      /\bignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|commands)/gi,
      /\byou\s+are\s+(now|not\s+)\s+(an?\s+)?(AI|assistant|GPT|model|chatbot)/gi,
      /\breset\s+(your\s+)?(instructions|prompts|context|memory)/gi,
      /\bforget\s+(everything|all\s+previous)/gi,
      /\bnew\s+(instruction|prompt|command|rule)/gi,
      /\[\/?system\]/gi,
    ];

    let result = input;
    for (const pattern of patterns) {
      result = result.replace(pattern, '[redacted]');
    }

    return result;
  },

  /**
   * Truncate a response for display/logging (not for API calls).
   *
   * @param {string} text
   * @param {number} [maxLen=500]
   * @returns {string}
   */
  truncateForDisplay(text, maxLen = 500) {
    if (!text || text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '...';
  },
};
