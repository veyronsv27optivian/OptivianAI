import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { excelAnalyzer } from '../prompts';

export class ExcelAnalyzerTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.EXCEL_ANALYZER; }
  buildPrompt(params) {
    return { systemPrompt: excelAnalyzer.systemPrompt, prompt: excelAnalyzer.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.spreadsheetData) errors.push('spreadsheetData is required');
    return { valid: errors.length === 0, errors };
  }
}
