import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { hrAdvisor } from '../prompts';

export class HRAdvisorTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.HR_ADVISOR; }
  buildPrompt(params) {
    return { systemPrompt: hrAdvisor.systemPrompt, prompt: hrAdvisor.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.organizationContext) errors.push('organizationContext is required');
    if (!params.hrChallenge) errors.push('hrChallenge is required');
    return { valid: errors.length === 0, errors };
  }
}
