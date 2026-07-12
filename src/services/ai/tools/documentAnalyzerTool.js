/**
 * Document Analyzer tool.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { documentAnalyzer } from '../prompts';

export class DocumentAnalyzerTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.DATA_EXTRACTION;
  }

  buildPrompt(params) {
    return {
      systemPrompt: documentAnalyzer.systemPrompt,
      prompt: documentAnalyzer.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.documentContent) errors.push('documentContent is required');
    if (!params.documentType) errors.push('documentType is required');
    return { valid: errors.length === 0, errors };
  }
}
