import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { websiteAnalyzer } from '../prompts';

export class WebsiteAnalyzerTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.WEBSITE_ANALYZER; }
  buildPrompt(params) {
    return { systemPrompt: websiteAnalyzer.systemPrompt, prompt: websiteAnalyzer.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.websiteContent) errors.push('websiteContent is required');
    return { valid: errors.length === 0, errors };
  }
}
