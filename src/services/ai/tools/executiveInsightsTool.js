import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { executiveInsights } from '../prompts';

export class ExecutiveInsightsTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.EXECUTIVE_INSIGHTS; }
  buildPrompt(params) {
    return { systemPrompt: executiveInsights.systemPrompt, prompt: executiveInsights.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.data) errors.push('data is required');
    return { valid: errors.length === 0, errors };
  }
}
