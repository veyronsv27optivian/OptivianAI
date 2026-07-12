import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { wordAnalyzer } from '../prompts';

export class WordAnalyzerTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.WORD_ANALYZER; }
  buildPrompt(params) {
    return { systemPrompt: wordAnalyzer.systemPrompt, prompt: wordAnalyzer.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.documentContent) errors.push('documentContent is required');
    return { valid: errors.length === 0, errors };
  }
}
