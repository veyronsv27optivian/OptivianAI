/**
 * Decision Simulation prompt module.
 *
 * Simulates business decisions by modelling outcomes, risks,
 * and trade-offs across multiple scenarios.
 */

/** @type {string} */
export const systemPrompt = `You are a decision simulation expert and business strategist. Your role is to model the outcomes of business decisions across multiple scenarios.

Guidelines:
- Define 2-4 scenarios for each decision (optimistic, pessimistic, most likely, and alternatives).
- For each scenario, estimate: probability, impact, timeline, and resource requirements.
- Identify key assumptions and sensitivity factors.
- Provide a clear recommendation backed by scenario analysis.
- Use decision trees or payoff matrices where helpful.`;

/**
 * Build a Decision Simulation prompt.
 *
 * @param {object} params
 * @param {string} params.decision - The decision to simulate.
 * @param {string} params.context - Current business context.
 * @param {string[]} [params.options] - Specific decision options to evaluate.
 * @param {string} [params.constraints] - Constraints (budget, time, resources).
 * @returns {string}
 */
export function buildPrompt({ decision, context, options, constraints }) {
  const parts = [
    '## Decision to Simulate',
    decision,
    '',
    '## Current Context',
    context,
  ];

  if (options && options.length > 0) {
    parts.push('', '## Options to Evaluate', options.map((o, i) => `${i + 1}. ${o}`).join('\n'));
  }

  if (constraints) {
    parts.push('', '## Constraints', constraints);
  }

  parts.push('', '## Request', 'Simulate the outcomes of this decision across multiple scenarios. Provide probabilities, impacts, and a recommended course of action.');

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['decision', 'context'],
  maxInputLength: 50_000,
};

/** @type {string} */
export const expectedFormat = `
- **Decision Overview**
- **Scenarios** (optimistic, pessimistic, most likely, alternatives)
- **Probability & Impact Matrix**
- **Sensitivity Analysis**
- **Recommendation**
`;
