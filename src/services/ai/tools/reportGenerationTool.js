/**
 * Report Generation tool.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { reportGenerator } from '../prompts';

export class ReportGenerationTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.REPORT_GENERATION;
  }

  buildPrompt(params) {
    return {
      systemPrompt: reportGenerator.systemPrompt,
      prompt: reportGenerator.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.topic) errors.push('topic is required');
    if (!params.data) errors.push('data is required');
    if (!params.reportType) errors.push('reportType is required');
    return { valid: errors.length === 0, errors };
  }
}
