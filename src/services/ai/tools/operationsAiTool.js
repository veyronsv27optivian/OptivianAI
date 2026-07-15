import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { operationsAi } from '../prompts';

export class OperationsAiTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.OPERATIONS_AI; }
  buildPrompt(params) {
    return { systemPrompt: operationsAi.systemPrompt, prompt: operationsAi.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.context) errors.push('context is required');
    if (!params.challenge) errors.push('challenge is required');
    return { valid: errors.length === 0, errors };
  }
}
