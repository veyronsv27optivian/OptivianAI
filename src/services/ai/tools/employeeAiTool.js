import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { employeeAi } from '../prompts';

export class EmployeeAiTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.EMPLOYEE_AI; }
  buildPrompt(params) {
    return { systemPrompt: employeeAi.systemPrompt, prompt: employeeAi.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.question) errors.push('question is required');
    return { valid: errors.length === 0, errors };
  }
}
