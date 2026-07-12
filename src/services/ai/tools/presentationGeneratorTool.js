import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { aiPresentationGenerator } from '../prompts';

export class PresentationGeneratorTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.PRESENTATION_GENERATOR; }
  buildPrompt(params) {
    return { systemPrompt: aiPresentationGenerator.systemPrompt, prompt: aiPresentationGenerator.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.topic) errors.push('topic is required');
    if (!params.audience) errors.push('audience is required');
    if (!params.presentationGoal) errors.push('presentationGoal is required');
    return { valid: errors.length === 0, errors };
  }
}
