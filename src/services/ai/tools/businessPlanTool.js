import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { businessPlanGenerator } from '../prompts';

export class BusinessPlanTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.BUSINESS_PLAN; }
  buildPrompt(params) {
    return { systemPrompt: businessPlanGenerator.systemPrompt, prompt: businessPlanGenerator.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.businessIdea) errors.push('businessIdea is required');
    if (!params.industry) errors.push('industry is required');
    return { valid: errors.length === 0, errors };
  }
}
