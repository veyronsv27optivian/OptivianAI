import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { productAnalyzer } from '../prompts';

export class ProductAnalyzerTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.PRODUCT_ANALYZER; }
  buildPrompt(params) {
    return { systemPrompt: productAnalyzer.systemPrompt, prompt: productAnalyzer.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.productDescription) errors.push('productDescription is required');
    if (!params.targetUsers) errors.push('targetUsers is required');
    return { valid: errors.length === 0, errors };
  }
}
