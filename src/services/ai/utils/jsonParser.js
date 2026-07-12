/**
 * JSON parser.
 *
 * Safely extracts and parses JSON from AI responses.
 * Handles common edge cases: markdown-wrapped JSON, trailing commas,
 * single-quoted keys, and partial/incomplete responses.
 */
export const jsonParser = {
  /**
   * Extract and parse JSON from a raw AI response string.
   * Tries multiple strategies to handle common LLM output quirks.
   *
   * @param {string} raw - The raw text from the AI provider.
   * @returns {{ success: boolean, data: any|null, error: string|null }}
   */
  parse(raw) {
    if (!raw || typeof raw !== 'string') {
      return { success: false, data: null, error: 'Input must be a non-empty string' };
    }

    // Strategy 1: Direct parse
    try {
      const data = JSON.parse(raw);
      return { success: true, data, error: null };
    } catch {
      // Continue to next strategy
    }

    // Strategy 2: Extract from markdown code block (```json ... ```)
    const jsonBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      try {
        const data = JSON.parse(jsonBlockMatch[1].trim());
        return { success: true, data, error: null };
      } catch {
        // Continue to next strategy
      }
    }

    // Strategy 3: Extract the first { ... } or [ ... ] block
    const braceMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (braceMatch) {
      try {
        const data = JSON.parse(braceMatch[1]);
        return { success: true, data, error: null };
      } catch {
        // Strategy 4: Try to fix common issues (trailing commas, single quotes)
        try {
          const cleaned = braceMatch[1]
            .replace(/,\s*([}\]])/g, '$1')           // Remove trailing commas
            .replace(/'/g, '"')                        // Replace single quotes with double
            .replace(/(\w+):/g, '"$1":')               // Quote unquoted keys
            .replace(/,\s*,/g, ',');                   // Remove double commas
          const data = JSON.parse(cleaned);
          return { success: true, data, error: null };
        } catch (e) {
          return { success: false, data: null, error: `Failed to parse JSON: ${e.message}` };
        }
      }
    }

    return { success: false, data: null, error: 'No JSON structure found in response' };
  },

  /**
   * Safe stringify with formatting.
   * @param {any} data
   * @param {number} [spaces=2]
   * @returns {string}
   */
  stringify(data, spaces = 2) {
    try {
      return JSON.stringify(data, null, spaces);
    } catch (e) {
      return `[Error stringifying data: ${e.message}]`;
    }
  },

  /**
   * Attempt to parse, returning the default value on failure.
   * @param {string} raw
   * @param {any} [defaultValue=null]
   * @returns {any}
   */
  safeParse(raw, defaultValue = null) {
    const result = this.parse(raw);
    return result.success ? result.data : defaultValue;
  },
};
