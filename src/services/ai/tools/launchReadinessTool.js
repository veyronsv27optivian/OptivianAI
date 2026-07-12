/**
 * Launch Readiness tool.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { launchReadiness } from '../prompts';

export class LaunchReadinessTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.LAUNCH_READINESS;
  }

  buildPrompt(params) {
    return {
      systemPrompt: launchReadiness.systemPrompt,
      prompt: launchReadiness.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.productDescription) errors.push('productDescription is required');
    if (!params.targetLaunchDate) errors.push('targetLaunchDate is required');
    return { valid: errors.length === 0, errors };
  }
}
