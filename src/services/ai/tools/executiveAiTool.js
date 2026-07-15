import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { executiveAi } from '../prompts';

export class ExecutiveAiTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.EXECUTIVE_AI; }
  buildPrompt(params) {
    return { systemPrompt: executiveAi.systemPrompt, prompt: executiveAi.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.context) errors.push('context is required');
    if (!params.challenge) errors.push('challenge is required');
    return { valid: errors.length === 0, errors };
  }
}
