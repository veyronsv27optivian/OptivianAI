import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { riskDetectionAi } from '../prompts';

export class RiskDetectionAiTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.RISK_DETECTION_AI; }
  buildPrompt(params) {
    return { systemPrompt: riskDetectionAi.systemPrompt, prompt: riskDetectionAi.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.context) errors.push('context is required');
    return { valid: errors.length === 0, errors };
  }
}
