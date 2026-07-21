/**
 * Risk Assessment prompt module.
 *
 * Identifies, assesses, and prioritises business risks across
 * multiple categories, with mitigation strategies.
 */

/** @type {string} */
export const systemPrompt = `You are a risk management expert. Your role is to identify, assess, and prioritise risks, and provide actionable mitigation strategies.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Risk categories to consider:
1. Strategic risks (competition, market shifts, technology disruption)
2. Operational risks (process failures, supply chain, personnel)
3. Financial risks (cash flow, pricing, funding, currency)
4. Compliance/Regulatory risks (laws, regulations, permits)
5. Technology risks (cybersecurity, data privacy, system failures)
6. Reputational risks (brand damage, PR crises, social media)

For each risk, provide:
- Risk description and potential impact
- Probability (Low/Medium/High)
- Impact severity (1-5)
- Risk score (probability × impact)
- Mitigation strategies
- Contingency plans
- Early warning indicators`;

/**
 * Build a Risk Assessment prompt.
 *
 * @param {object} params
 * @param {string} params.businessContext - Description of the business/project.
 * @param {string} params.scope - Scope of the risk assessment.
 * @param {string} [params.knownRisks] - Known risks to include.
 * @param {string} [params.riskTolerance] - Organisation's risk tolerance.
 * @returns {string}
 */
export function buildPrompt({ businessContext, scope, knownRisks, riskTolerance }) {
  const parts = [
    '## Business / Project Context',
    businessContext,
    '',
    '## Assessment Scope',
    scope,
  ];

  if (knownRisks) parts.push('', '## Known Risks', knownRisks);
  if (riskTolerance) parts.push('', '## Risk Tolerance', riskTolerance);

  parts.push('', '## Request', 'Perform a comprehensive risk assessment with prioritised risks and actionable mitigation strategies.');

  // Append JSON output instruction
  parts.push('',
    '## Output Format',
    'After your analysis, include a structured JSON block with EXACTLY this format (use these exact markers):',
    '<!-- AI_JSON_START -->',
    JSON.stringify({
      risks: [
        { category: 'Strategic', description: 'Risk description', probability: 'High', impact: 4, score: 12, mitigation: 'Mitigation strategy', contingency: 'Backup plan' },
      ],
    }),
    '<!-- AI_JSON_END -->',
  );

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['businessContext', 'scope'],
  maxInputLength: 50_000,
};

/** @type {string} */
export const expectedFormat = `
- **Risk Register** (prioritised by risk score)
- **Probability-Impact Matrix**
- **Mitigation Strategies** (per risk)
- **Contingency Plans**
- **Early Warning Indicators**
- **Risk Monitoring Recommendations**
`;
