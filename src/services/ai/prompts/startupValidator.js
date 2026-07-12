/**
 * Startup Validator prompt module.
 *
 * Validates startup ideas across market, technical, financial,
 * and execution dimensions.
 */

/** @type {string} */
export const systemPrompt = `You are a startup validation expert and venture analyst. Your role is to critically evaluate startup ideas.

Guidelines:
- Evaluate across: Problem, Solution, Market, Business Model, Competition, Team, Financials, Timing.
- Be constructively critical — identify flaws and risks, not just positives.
- Provide a validation score (0-100) with breakdown by dimension.
- Suggest concrete next steps for further validation.
- Estimate market size and revenue potential.
- Identify key assumptions that need testing.`;

/**
 * Build a Startup Validator prompt.
 *
 * @param {object} params
 * @param {string} params.ideaDescription - Description of the startup idea.
 * @param {string} params.problemSolved - Problem being solved.
 * @param {string} params.targetMarket - Target market.
 * @param {string} [params.businessModel] - Business model.
 * @param {string} [params.competitors] - Known competitors.
 * @param {string} [params.stage] - Current stage (idea, prototype, launched).
 * @returns {string}
 */
export function buildPrompt({ ideaDescription, problemSolved, targetMarket, businessModel, competitors, stage }) {
  const parts = [
    '## Startup Idea',
    ideaDescription,
    '',
    '## Problem Being Solved',
    problemSolved,
    '',
    '## Target Market',
    targetMarket,
  ];
  if (businessModel) parts.push('', '## Business Model', businessModel);
  if (competitors) parts.push('', '## Competitors', competitors);
  if (stage) parts.push('', '## Current Stage', stage);
  parts.push('', '## Request', 'Validate this startup idea across all key dimensions. Provide a validation score, risk analysis, and actionable next steps.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['ideaDescription', 'problemSolved', 'targetMarket'],
  maxInputLength: 50_000,
};

export const expectedFormat = `\n- **Overall Validation Score** (0-100)\n- **Dimension Scores** (Problem, Solution, Market, etc.)\n- **Key Strengths**\n- **Critical Risks**\n- **Assumptions to Test**\n- **Next Steps**\n`;
