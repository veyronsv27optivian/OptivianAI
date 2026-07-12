import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { resumeAnalyzer } from '../prompts';

export class ResumeAnalyzerTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.RESUME_ANALYZER; }
  buildPrompt(params) {
    return { systemPrompt: resumeAnalyzer.systemPrompt, prompt: resumeAnalyzer.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.resumeContent) errors.push('resumeContent is required');
    return { valid: errors.length === 0, errors };
  }
}
