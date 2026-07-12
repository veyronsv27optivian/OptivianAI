import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { brandAnalysis } from '../prompts';

export class BrandAnalysisTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.BRAND_ANALYSIS; }
  buildPrompt(params) {
    return { systemPrompt: brandAnalysis.systemPrompt, prompt: brandAnalysis.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.brandName) errors.push('brandName is required');
    if (!params.industry) errors.push('industry is required');
    return { valid: errors.length === 0, errors };
  }
}
