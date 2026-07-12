import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { aiCustomAssistant } from '../prompts';

export class CustomAssistantTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.CUSTOM_ASSISTANT; }
  buildPrompt(params) {
    return { systemPrompt: aiCustomAssistant.systemPrompt, prompt: aiCustomAssistant.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.userQuery) errors.push('userQuery is required');
    return { valid: errors.length === 0, errors };
  }
}
