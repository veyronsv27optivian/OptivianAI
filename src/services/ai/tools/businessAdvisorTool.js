/**
 * Business Advisor tool.
 *
 * Business logic for the Business Advisor feature.
 * Uses the businessAdvisor prompt module and delegates provider
 * communication to aiService.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { businessAdvisor } from '../prompts';

export class BusinessAdvisorTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.BUSINESS_ADVISOR;
  }

  buildPrompt(params) {
    return {
      systemPrompt: businessAdvisor.systemPrompt,
      prompt: businessAdvisor.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.businessContext) errors.push('businessContext is required');
    if (!params.challenge) errors.push('challenge is required');
    return { valid: errors.length === 0, errors };
  }
}
