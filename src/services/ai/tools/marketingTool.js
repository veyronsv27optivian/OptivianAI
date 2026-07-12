/**
 * Marketing Strategy tool.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { marketingStrategy } from '../prompts';

export class MarketingTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.CONTENT_GENERATION;
  }

  buildPrompt(params) {
    return {
      systemPrompt: marketingStrategy.systemPrompt,
      prompt: marketingStrategy.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.businessDescription) errors.push('businessDescription is required');
    if (!params.targetAudience) errors.push('targetAudience is required');
    if (!params.marketingGoals) errors.push('marketingGoals is required');
    return { valid: errors.length === 0, errors };
  }
}
