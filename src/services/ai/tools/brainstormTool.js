import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { aiBrainstorm } from '../prompts';

export class BrainstormTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.AI_BRAINSTORM; }
  buildPrompt(params) {
    return { systemPrompt: aiBrainstorm.systemPrompt, prompt: aiBrainstorm.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.topic) errors.push('topic is required');
    return { valid: errors.length === 0, errors };
  }
}
