/**
 * Decision Simulation tool.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { decisionSimulation } from '../prompts';

export class DecisionSimulationTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.DECISION_SIMULATION;
  }

  buildPrompt(params) {
    return {
      systemPrompt: decisionSimulation.systemPrompt,
      prompt: decisionSimulation.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.decision) errors.push('decision is required');
    if (!params.context) errors.push('context is required');
    return { valid: errors.length === 0, errors };
  }
}
