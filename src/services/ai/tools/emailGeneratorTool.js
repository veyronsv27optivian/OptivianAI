import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { aiEmailGenerator } from '../prompts';

export class EmailGeneratorTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.EMAIL_GENERATOR; }
  buildPrompt(params) {
    return { systemPrompt: aiEmailGenerator.systemPrompt, prompt: aiEmailGenerator.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.recipientContext) errors.push('recipientContext is required');
    if (!params.purpose) errors.push('purpose is required');
    return { valid: errors.length === 0, errors };
  }
}
