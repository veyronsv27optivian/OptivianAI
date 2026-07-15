import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { orgHealthEngine } from '../prompts';

export class OrgHealthEngineTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.ORG_HEALTH_ENGINE; }
  buildPrompt(params) {
    return { systemPrompt: orgHealthEngine.systemPrompt, prompt: orgHealthEngine.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.orgData) errors.push('orgData is required');
    return { valid: errors.length === 0, errors };
  }
}
