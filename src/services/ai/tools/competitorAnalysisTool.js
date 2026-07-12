/**
 * Competitor Analysis tool.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { competitorAnalysis } from '../prompts';

export class CompetitorAnalysisTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.COMPETITIVE_ANALYSIS;
  }

  buildPrompt(params) {
    return {
      systemPrompt: competitorAnalysis.systemPrompt,
      prompt: competitorAnalysis.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.businessDescription) errors.push('businessDescription is required');
    if (!params.market) errors.push('market is required');
    return { valid: errors.length === 0, errors };
  }
}
