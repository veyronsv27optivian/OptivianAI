/**
 * Pitch Deck Assistant tool.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { pitchDeckAssistant } from '../prompts';

export class PitchDeckAssistantTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.CONTENT_GENERATION;
  }

  buildPrompt(params) {
    return {
      systemPrompt: pitchDeckAssistant.systemPrompt,
      prompt: pitchDeckAssistant.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.companyDescription) errors.push('companyDescription is required');
    if (!params.pitchGoal) errors.push('pitchGoal is required');
    if (!params.targetAudience) errors.push('targetAudience is required');
    return { valid: errors.length === 0, errors };
  }
}
