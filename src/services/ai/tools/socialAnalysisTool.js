/**
 * Social Media Analysis tool.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { socialMediaAnalysis } from '../prompts';

export class SocialAnalysisTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.SOCIAL_ANALYSIS;
  }

  buildPrompt(params) {
    return {
      systemPrompt: socialMediaAnalysis.systemPrompt,
      prompt: socialMediaAnalysis.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.platform) errors.push('platform is required');
    if (!params.currentStrategy) errors.push('currentStrategy is required');
    return { valid: errors.length === 0, errors };
  }
}
