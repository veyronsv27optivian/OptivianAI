import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { managerAi } from '../prompts';

export class ManagerAiTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.MANAGER_AI; }
  buildPrompt(params) {
    return { systemPrompt: managerAi.systemPrompt, prompt: managerAi.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.context) errors.push('context is required');
    if (!params.challenge) errors.push('challenge is required');
    return { valid: errors.length === 0, errors };
  }
}
