import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { startupValidator } from '../prompts';

export class StartupValidatorTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.STARTUP_VALIDATOR; }
  buildPrompt(params) {
    return { systemPrompt: startupValidator.systemPrompt, prompt: startupValidator.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.ideaDescription) errors.push('ideaDescription is required');
    if (!params.problemSolved) errors.push('problemSolved is required');
    if (!params.targetMarket) errors.push('targetMarket is required');
    return { valid: errors.length === 0, errors };
  }
}
