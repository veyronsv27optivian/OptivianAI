import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { crossDeptIntelligence } from '../prompts';

export class CrossDeptIntelligenceTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.CROSS_DEPT_INTELLIGENCE; }
  buildPrompt(params) {
    return { systemPrompt: crossDeptIntelligence.systemPrompt, prompt: crossDeptIntelligence.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.context) errors.push('context is required');
    if (!params.departments) errors.push('departments is required');
    return { valid: errors.length === 0, errors };
  }
}
