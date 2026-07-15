import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { hrSpecificAi } from '../prompts';

export class HrSpecificAiTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.HR_SPECIFIC_AI; }
  buildPrompt(params) {
    return { systemPrompt: hrSpecificAi.systemPrompt, prompt: hrSpecificAi.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.context) errors.push('context is required');
    if (!params.challenge) errors.push('challenge is required');
    return { valid: errors.length === 0, errors };
  }
}
