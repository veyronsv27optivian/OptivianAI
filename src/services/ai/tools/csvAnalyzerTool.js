import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { csvAnalyzer } from '../prompts';

export class CSVAnalyzerTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.CSV_ANALYZER; }
  buildPrompt(params) {
    return { systemPrompt: csvAnalyzer.systemPrompt, prompt: csvAnalyzer.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.csvData) errors.push('csvData is required');
    return { valid: errors.length === 0, errors };
  }
}
