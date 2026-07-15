import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { marketingAi } from '../prompts';

export class MarketingAiTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.MARKETING_SPECIFIC_AI; }
  buildPrompt(params) {
    return { systemPrompt: marketingAi.systemPrompt, prompt: marketingAi.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.context) errors.push('context is required');
    if (!params.challenge) errors.push('challenge is required');
    return { valid: errors.length === 0, errors };
  }
}
