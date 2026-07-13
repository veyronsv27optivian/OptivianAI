/**
 * SWOT Analysis prompt module.
 *
 * Performs a structured SWOT (Strengths, Weaknesses, Opportunities, Threats)
 * analysis for a business, project, or initiative.
 */

/** @type {string} */
export const systemPrompt = `You are a strategic analysis expert. Your role is to perform thorough SWOT analyses and provide actionable strategies based on the findings.

Guidelines:
- Identify at least 5 items for each SWOT quadrant.
- Ensure strengths and weaknesses are internal, opportunities and threats are external.
- Prioritise items within each quadrant by significance.
- Cross-reference SWOT items to generate strategies:
  - SO strategies (leverage strengths to exploit opportunities)
  - WO strategies (overcome weaknesses by leveraging opportunities)
  - ST strategies (use strengths to mitigate threats)
  - WT strategies (defensive strategies to minimise weaknesses and avoid threats)
- Provide a clear action plan.`;

/**
 * Build a SWOT Analysis prompt.
 *
 * @param {object} params
 * @param {string} params.subject - The subject of analysis (business, product, project).
 * @param {string} params.context - Internal and external context.
 * @param {string} [params.industry] - Industry context.
 * @param {string} [params.objectives] - Strategic objectives.
 * @returns {string}
 */
export function buildPrompt({ subject, context, industry, objectives }) {
  const parts = [
    '## Subject of Analysis',
    subject,
    '',
    '## Context',
    context,
  ];

  if (industry) parts.push('', '## Industry', industry);
  if (objectives) parts.push('', '## Strategic Objectives', objectives);

  parts.push('', '## Request', 'Perform a comprehensive SWOT analysis with actionable strategies derived from cross-referencing the quadrants.');

  // Append JSON output instruction
  parts.push('',
    '## Output Format',
    'After your analysis, include a structured JSON block with EXACTLY this format (use these exact markers):',
    '<!-- AI_JSON_START -->',
    JSON.stringify({
      swot: {
        strengths: ['Strength 1 description', 'Strength 2 description'],
        weaknesses: ['Weakness 1 description', 'Weakness 2 description'],
        opportunities: ['Opportunity 1 description', 'Opportunity 2 description'],
        threats: ['Threat 1 description', 'Threat 2 description'],
      },
    }),
    '<!-- AI_JSON_END -->',
  );

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['subject', 'context'],
  maxInputLength: 50_000,
};

/** @type {string} */
export const expectedFormat = `
- **Strengths** (internal, prioritised)
- **Weaknesses** (internal, prioritised)
- **Opportunities** (external, prioritised)
- **Threats** (external, prioritised)
- **Strategy Matrix** (SO, WO, ST, WT strategies)
- **Action Plan** (prioritised next steps)
`;
