import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { financialAdvisor } from '../prompts';

export class FinancialAdvisorTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.FINANCIAL_ADVISOR; }
  buildPrompt(params) {
    return { systemPrompt: financialAdvisor.systemPrompt, prompt: financialAdvisor.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.financialSituation) errors.push('financialSituation is required');
    if (!params.financialGoals) errors.push('financialGoals is required');
    if (!params.adviceType) errors.push('adviceType is required');
    return { valid: errors.length === 0, errors };
  }
}
