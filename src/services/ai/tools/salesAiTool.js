import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { salesAi } from '../prompts';

export class SalesAiTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.SALES_SPECIFIC_AI; }
  buildPrompt(params) {
    return { systemPrompt: salesAi.systemPrompt, prompt: salesAi.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.context) errors.push('context is required');
    if (!params.challenge) errors.push('challenge is required');
    return { valid: errors.length === 0, errors };
  }
}
