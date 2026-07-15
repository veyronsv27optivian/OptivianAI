import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { decisionSupport } from '../prompts';

export class DecisionSupportTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.DECISION_SUPPORT; }
  buildPrompt(params) {
    return { systemPrompt: decisionSupport.systemPrompt, prompt: decisionSupport.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.context) errors.push('context is required');
    if (!params.decision) errors.push('decision is required');
    return { valid: errors.length === 0, errors };
  }
}
