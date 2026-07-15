import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { technicalAi } from '../prompts';

export class TechnicalAiTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.TECHNICAL_AI; }
  buildPrompt(params) {
    return { systemPrompt: technicalAi.systemPrompt, prompt: technicalAi.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.context) errors.push('context is required');
    if (!params.challenge) errors.push('challenge is required');
    return { valid: errors.length === 0, errors };
  }
}
