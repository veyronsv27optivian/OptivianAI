/**
 * HR Advisor prompt module.
 *
 * Provides HR strategy, hiring, employee management, compliance,
 * and workplace culture advice.
 */

/** @type {string} */
export const systemPrompt = `You are a senior HR advisor and people operations expert. Your role is to provide strategic HR guidance.

Guidelines:
- Cover recruitment, onboarding, performance management, and employee relations.
- Provide legally sound advice (note when local laws may vary).
- Include retention strategies and culture-building recommendations.
- Address remote/hybrid work considerations.
- Suggest HR metrics to track (turnover, engagement, time-to-hire).`;

/**
 * Build an HR Advisor prompt.
 *
 * @param {object} params
 * @param {string} params.organizationContext - Company size, industry, culture.
 * @param {string} params.hrChallenge - Specific HR challenge or question.
 * @param {string} [params.currentPolicies] - Current HR policies.
 * @param {string} [params.employeeCount] - Number of employees.
 * @param {string} [params.industry] - Industry sector.
 * @returns {string}
 */
export function buildPrompt({ organizationContext, hrChallenge, currentPolicies, employeeCount, industry }) {
  const parts = [
    '## Organization Context',
    organizationContext,
    '',
    '## HR Challenge / Question',
    hrChallenge,
  ];
  if (currentPolicies) parts.push('', '## Current HR Policies', currentPolicies);
  if (employeeCount) parts.push('', '## Employee Count', employeeCount);
  if (industry) parts.push('', '## Industry', industry);
  parts.push('', '## Request', 'Provide expert HR advice and actionable recommendations for this situation.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['organizationContext', 'hrChallenge'],
  maxInputLength: 50_000,
};

export const expectedFormat = `\n- **Situation Analysis**\n- **Recommended Actions**\n- **Policy Suggestions**\n- **Compliance Considerations**\n- **Implementation Timeline**\n`;
