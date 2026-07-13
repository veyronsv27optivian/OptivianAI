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

  // Append JSON output instruction
  parts.push('',
    '## Output Format',
    'After your analysis, include a structured JSON block with EXACTLY this format (use these exact markers):',
    '<!-- AI_JSON_START -->',
    JSON.stringify({
      decisionOverview: 'Summary of the decision being simulated',
      scenarios: [
        { name: 'Optimistic', probability: 20, impact: 'High', timeline: '6 months', description: 'Best case outcome' },
        { name: 'Most Likely', probability: 55, impact: 'Medium', timeline: '9 months', description: 'Expected outcome' },
        { name: 'Pessimistic', probability: 25, impact: 'Low', timeline: '12 months', description: 'Worst case outcome' },
      ],
      recommendation: 'Recommended course of action',
      sensitivityFactors: ['Market demand', 'Competition response'],
    }),
    '<!-- AI_JSON_END -->',
  );

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
