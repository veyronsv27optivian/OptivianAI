/**
 * SWOT Analysis tool.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { swotAnalysis } from '../prompts';

export class SWOTTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.STRATEGY_REPORT;
  }

  buildPrompt(params) {
    return {
      systemPrompt: swotAnalysis.systemPrompt,
      prompt: swotAnalysis.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.subject) errors.push('subject is required');
    if (!params.context) errors.push('context is required');
    return { valid: errors.length === 0, errors };
  }
}
