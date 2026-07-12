/**
 * Abstract base tool class.
 *
 * Every AI tool extends this class and implements:
 *   - toolType  – String matching AI_TOOL_TYPES.
 *   - buildPrompt() – Construct the user prompt.
 *   - execute() – Call aiService.generateText and process the result.
 *
 * Tools ONLY contain business logic. Provider communication goes
 * through aiService, not tools directly.
 */
import { AiError } from '../errors';
import { generateText, generateStream } from '../aiService';

/**
 * Use DEFAULT export — imported with:
 *   import BusinessAdvisorTool from '../tools/businessAdvisorTool';
 *   const tool = new BusinessAdvisorTool();
 *   const result = await tool.execute({ businessContext: '...', challenge: '...' });
 */
export class BaseTool {
  /**
   * @returns {string} The AI_TOOL_TYPES value for this tool.
   */
  get toolType() {
    throw new AiError('BaseTool subclass must implement toolType getter', 'AI_NOT_IMPLEMENTED');
  }

  /**
   * Build the prompt for the AI. Override to use prompt modules.
   *
   * @param {object} params - Tool-specific parameters.
   * @returns {{ prompt: string, systemPrompt: string }}
   */
  buildPrompt(_params) {
    throw new AiError('BaseTool subclass must implement buildPrompt()', 'AI_NOT_IMPLEMENTED');
  }

  /**
   * Execute the tool with the given parameters.
   *
   * @param {object} params - Tool-specific parameters.
   * @param {object} [options] - Additional AI generation options.
   * @returns {Promise<object>} The AI response with toolType and metadata.
   */
  async execute(params, options = {}) {
    const { prompt, systemPrompt } = this.buildPrompt(params);

    const result = await generateText(this.toolType, prompt, {
      ...options,
      systemPrompt: options.systemPrompt || systemPrompt,
    });

    return this._processResult(result, params);
  }

  /**
   * Execute with streaming support.
   *
   * @param {object} params
   * @param {object} options
   * @param {function} options.onChunk
   * @param {function} [options.onComplete]
   * @param {function} [options.onError]
   * @returns {Promise<void>}
   */
  async executeStream(params, options = {}) {
    const { prompt, systemPrompt } = this.buildPrompt(params);
    const { onChunk, onComplete, onError, ...rest } = options;

    return generateStream(this.toolType, prompt, {
      ...rest,
      systemPrompt,
      onChunk,
      onComplete(result) {
        if (typeof onComplete === 'function') {
          onComplete(result);
        }
      },
      onError,
    });
  }

  /**
   * Process and validate the AI result.
   * Override in subclasses for tool-specific processing.
   *
   * @param {object} result - Raw result from generateText.
   * @param {object} _params - Original execution parameters.
   * @returns {object}
   */
  _processResult(result, _params) {
    return result;
  }

  /**
   * Validate input parameters before execution.
   * Override in subclasses.
   *
   * @param {object} params
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateParams(_params) {
    return { valid: true, errors: [] };
  }
}
