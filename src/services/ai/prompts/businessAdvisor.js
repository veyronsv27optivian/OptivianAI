/**
 * Business Advisor prompt module.
 *
 * Provides strategic business advice and actionable recommendations
 * based on the user's business context, goals, and challenges.
 */

/** @type {string} */
export const systemPrompt = `You are a senior business strategist and advisor. Your role is to provide clear, actionable, and data-driven business advice.

Guidelines:
- Analyse the user's business context thoroughly before giving advice.
- Structure responses with clear headings, bullet points, and prioritised action items.
- Include both short-term quick wins and long-term strategic recommendations.
- Identify potential risks and mitigation strategies for each recommendation.
- Be specific and practical — avoid generic platitudes.
- Use relevant business frameworks (SWOT, Porter's Five Forces, OKRs, etc.) where appropriate.`;

/**
 * Build a Business Advisor prompt from user input.
 *
 * @param {object} params
 * @param {string} params.businessContext - Description of the business.
 * @param {string} params.challenge - The specific challenge or question.
 * @param {string} [params.industry] - Industry sector.
 * @param {string} [params.goals] - Business goals.
 * @returns {string} The formatted prompt.
 */
export function buildPrompt({ businessContext, challenge, industry, goals }) {
  const parts = [
    '## Business Context',
    businessContext || 'Not specified.',
    '',
    '## Challenge / Question',
    challenge,
  ];

  if (industry) {
    parts.push('', '## Industry', industry);
  }

  if (goals) {
    parts.push('', '## Business Goals', goals);
  }

  parts.push('', '## Request', 'Provide strategic business advice and actionable recommendations based on the above context.');

  // Append JSON output instruction
  parts.push('',
    '## Output Format',
    'After your analysis, include a structured JSON block with EXACTLY this format (use these exact markers):',
    '<!-- AI_JSON_START -->',
    JSON.stringify({
      swot: {
        strengths: ['Strong team', 'Good product'],
        weaknesses: ['Limited funding'],
        opportunities: ['Growing market'],
        threats: ['New competitors'],
      },
      risks: [
        { description: 'Cash flow issues', probability: 'Medium', impact: 4, mitigation: 'Build runway' },
      ],
    }),
    '<!-- AI_JSON_END -->',
  );

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['businessContext', 'challenge'],
  maxInputLength: 50_000,
};

/** @type {string} */
export const expectedFormat = `
Structured advice with:
- **Executive Summary**
- **Analysis** (key findings, opportunities, threats)
- **Recommendations** (prioritised action items)
- **Risk Mitigation**
- **Next Steps**
`;
