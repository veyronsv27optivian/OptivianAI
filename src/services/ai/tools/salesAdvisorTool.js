import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { salesAdvisor } from '../prompts';

export class SalesAdvisorTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.SALES_ADVISOR; }
  buildPrompt(params) {
    return { systemPrompt: salesAdvisor.systemPrompt, prompt: salesAdvisor.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.productService) errors.push('productService is required');
    if (!params.targetMarket) errors.push('targetMarket is required');
    if (!params.salesChallenge) errors.push('salesChallenge is required');
    return { valid: errors.length === 0, errors };
  }
}
