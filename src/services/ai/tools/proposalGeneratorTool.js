import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { aiProposalGenerator } from '../prompts';

export class ProposalGeneratorTool extends BaseTool {
  get toolType() { return AI_TOOL_TYPES.PROPOSAL_GENERATOR; }
  buildPrompt(params) {
    return { systemPrompt: aiProposalGenerator.systemPrompt, prompt: aiProposalGenerator.buildPrompt(params) };
  }
  validateParams(params) {
    const errors = [];
    if (!params.clientName) errors.push('clientName is required');
    if (!params.prospectContext) errors.push('prospectContext is required');
    if (!params.solutionDescription) errors.push('solutionDescription is required');
    return { valid: errors.length === 0, errors };
  }
}
