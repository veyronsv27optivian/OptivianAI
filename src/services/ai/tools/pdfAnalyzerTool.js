import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { pdfAnalyzer } from '../prompts';

export class PDFAnalyzerTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.PDF_ANALYZER; }
  buildPrompt(params) {
    return { systemPrompt: pdfAnalyzer.systemPrompt, prompt: pdfAnalyzer.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.documentContent) errors.push('documentContent is required');
    return { valid: errors.length === 0, errors };
  }
}
