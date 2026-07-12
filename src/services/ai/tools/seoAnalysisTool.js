import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { seoAnalysis } from '../prompts';

export class SEOAnalysisTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.SEO_ANALYSIS; }
  buildPrompt(params) {
    return { systemPrompt: seoAnalysis.systemPrompt, prompt: seoAnalysis.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.businessType) errors.push('businessType is required');
    return { valid: errors.length === 0, errors };
  }
}
