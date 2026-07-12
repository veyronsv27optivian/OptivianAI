/**
 * Chunk parser.
 *
 * Parses streamed chunks from AI providers.
 * Handles SSE (Server-Sent Events) and raw text chunking.
 * Used internally by provider streaming implementations.
 */
export const chunkParser = {
  /**
   * Parse an SSE chunk line-by-line.
   * SSE format: "data: { ... }\n\n"
   *
   * @param {string} buffer - Current accumulated buffer.
   * @param {string} chunk - New chunk from the stream.
   * @returns {{ lines: string[], remaining: string }}
   */
  parseSSE(buffer, chunk) {
    const combined = buffer + chunk;
    const parts = combined.split('\n');
    const remaining = parts.pop() || '';
    return { lines: parts, remaining };
  },

  /**
   * Extract the JSON payload from an SSE "data:" line.
   *
   * @param {string} line - A single line from the SSE stream.
   * @returns {{ success: boolean, data: object|null, error: string|null }}
   */
  extractSSEData(line) {
    const trimmed = line.trim();
    if (!trimmed) {
      return { success: false, data: null, error: 'Empty line' };
    }
    if (trimmed.startsWith(':')) {
      return { success: false, data: null, error: 'Comment line' };
    }
    if (!trimmed.startsWith('data: ')) {
      return { success: false, data: null, error: 'Not an SSE data line' };
    }

    const payload = trimmed.slice(6);
    if (payload === '[DONE]') {
      return { success: true, data: { done: true }, error: null };
    }

    try {
      const data = JSON.parse(payload);
      return { success: true, data, error: null };
    } catch (e) {
      return { success: false, data: null, error: `Failed to parse SSE JSON: ${e.message}` };
    }
  },

  /**
   * Chunk a long text into smaller pieces for batch processing.
   *
   * @param {string} text - Text to chunk.
   * @param {number} [maxChunkSize=2000] - Maximum characters per chunk.
   * @param {string} [separator='\n'] - Preferred separator for split points.
   * @returns {string[]}
   */
  textChunks(text, maxChunkSize = 2000, separator = '\n') {
    if (text.length <= maxChunkSize) return [text];

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxChunkSize;

      // Try to break at the last separator before maxChunkSize
      if (end < text.length) {
        const lastSep = text.lastIndexOf(separator, end);
        if (lastSep > start) {
          end = lastSep;
        }
      }

      chunks.push(text.slice(start, end).trim());
      start = end;
    }

    return chunks.filter((c) => c.length > 0);
  },

  /**
   * Parse a raw streamed response into an array of text deltas.
   *
   * @param {string} raw
   * @returns {string[]}
   */
  extractDeltas(raw) {
    const deltas = [];
    const { lines } = this.parseSSE('', raw);

    for (const line of lines) {
      const result = this.extractSSEData(line);
      if (result.success && result.data && !result.data.done) {
        // Providers structure differs; look for common delta paths
        const delta =
          result.data.choices?.[0]?.delta?.content ||
          result.data.candidates?.[0]?.content?.parts?.[0]?.text ||
          result.data.text;
        if (delta) {
          deltas.push(delta);
        }
      }
    }

    return deltas;
  },
};
