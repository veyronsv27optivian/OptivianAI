/**
 * Risk Assessment prompt module.
 *
 * Identifies, assesses, and prioritises business risks across
 * multiple categories, with mitigation strategies.
 */

/** @type {string} */
export const systemPrompt = `You are a risk management expert. Your role is to identify, assess, and prioritise risks, and provide actionable mitigation strategies.

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
