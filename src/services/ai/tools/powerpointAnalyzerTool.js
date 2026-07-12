import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { powerpointAnalyzer } from '../prompts';

export class PowerPointAnalyzerTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.POWERPOINT_ANALYZER; }
  buildPrompt(params) {
    return { systemPrompt: powerpointAnalyzer.systemPrompt, prompt: powerpointAnalyzer.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.presentationContent) errors.push('presentationContent is required');
    return { valid: errors.length === 0, errors };
  }
}
