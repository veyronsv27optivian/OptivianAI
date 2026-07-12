import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { customerPersonaGenerator } from '../prompts';

export class CustomerPersonaTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.CUSTOMER_PERSONA; }
  buildPrompt(params) {
    return { systemPrompt: customerPersonaGenerator.systemPrompt, prompt: customerPersonaGenerator.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.businessDescription) errors.push('businessDescription is required');
    if (!params.targetAudience) errors.push('targetAudience is required');
    return { valid: errors.length === 0, errors };
  }
}
