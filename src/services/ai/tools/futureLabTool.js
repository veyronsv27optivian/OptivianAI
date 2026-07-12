/**
 * Future Lab tool.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { futureLab } from '../prompts';

export class FutureLabTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.PREDICTIVE_ANALYTICS;
  }

  buildPrompt(params) {
    return {
      systemPrompt: futureLab.systemPrompt,
      prompt: futureLab.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.industry) errors.push('industry is required');
    if (!params.businessProfile) errors.push('businessProfile is required');
    return { valid: errors.length === 0, errors };
  }
}
