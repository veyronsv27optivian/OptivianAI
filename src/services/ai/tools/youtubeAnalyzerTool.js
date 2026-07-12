import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { youtubeAnalyzer } from '../prompts';

export class YouTubeAnalyzerTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.YOUTUBE_ANALYZER; }
  buildPrompt(params) {
    return { systemPrompt: youtubeAnalyzer.systemPrompt, prompt: youtubeAnalyzer.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.videoContent) errors.push('videoContent is required');
    return { valid: errors.length === 0, errors };
  }
}
