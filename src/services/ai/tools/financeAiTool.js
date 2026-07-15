import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { financeAi } from '../prompts';

export class FinanceAiTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.FINANCE_AI; }
  buildPrompt(params) {
    return { systemPrompt: financeAi.systemPrompt, prompt: financeAi.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.context) errors.push('context is required');
    if (!params.challenge) errors.push('challenge is required');
    return { valid: errors.length === 0, errors };
  }
}
