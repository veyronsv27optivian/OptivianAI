/**
 * Requirement Analyzer tool.
 *
 * Business logic for the Requirement Analyzer feature.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { requirementAnalyzer } from '../prompts';

export class RequirementAnalyzerTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.REQUIREMENT_ANALYZER;
  }

  buildPrompt(params) {
    return {
      systemPrompt: requirementAnalyzer.systemPrompt,
      prompt: requirementAnalyzer.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.requirements) errors.push('requirements is required');
    return { valid: errors.length === 0, errors };
  }
}
