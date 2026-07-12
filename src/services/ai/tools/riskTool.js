/**
 * Risk Assessment tool.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { riskAssessment } from '../prompts';

export class RiskTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.RISK_DETECTION;
  }

  buildPrompt(params) {
    return {
      systemPrompt: riskAssessment.systemPrompt,
      prompt: riskAssessment.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.businessContext) errors.push('businessContext is required');
    if (!params.scope) errors.push('scope is required');
    return { valid: errors.length === 0, errors };
  }
}
