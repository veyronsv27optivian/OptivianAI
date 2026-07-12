import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { contractAnalyzer } from '../prompts';

export class ContractAnalyzerTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.CONTRACT_ANALYZER; }
  buildPrompt(params) {
    return { systemPrompt: contractAnalyzer.systemPrompt, prompt: contractAnalyzer.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.contractContent) errors.push('contractContent is required');
    return { valid: errors.length === 0, errors };
  }
}
