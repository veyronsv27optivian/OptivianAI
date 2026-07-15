import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { intelligentDelegation } from '../prompts';

export class IntelligentDelegationTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.INTELLIGENT_DELEGATION; }
  buildPrompt(params) {
    return { systemPrompt: intelligentDelegation.systemPrompt, prompt: intelligentDelegation.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.context) errors.push('context is required');
    if (!params.taskList) errors.push('taskList is required');
    return { valid: errors.length === 0, errors };
  }
}
