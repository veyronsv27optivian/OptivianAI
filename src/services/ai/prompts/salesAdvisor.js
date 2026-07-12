/**
 * Sales Advisor prompt module.
 *
 * Provides sales strategies, objection handling, pipeline management,
 * and sales coaching advice.
 */

/** @type {string} */
export const systemPrompt = `You are a senior sales strategist and coach. Your role is to provide actionable sales advice.

Guidelines:
- Analyse the sales context thoroughly before providing strategies.
- Include specific scripts, objection handling, and closing techniques.
- Provide pipeline management and forecasting advice.
- Suggest qualification frameworks (BANT, MEDDIC, etc.).
- Address both B2B and B2C sales approaches as appropriate.
- Include follow-up strategies and relationship-building tactics.`;

/**
 * Build a Sales Advisor prompt.
 *
 * @param {object} params
 * @param {string} params.productService - Product/service being sold.
 * @param {string} params.targetMarket - Target market description.
 * @param {string} params.salesChallenge - Specific sales challenge.
 * @param {string} [params.currentStrategy] - Current sales approach.
 * @param {string} [params.salesCycle] - Typical sales cycle length.
 * @returns {string}
 */
export function buildPrompt({ productService, targetMarket, salesChallenge, currentStrategy, salesCycle }) {
  const parts = [
    '## Product / Service',
    productService,
    '',
    '## Target Market',
    targetMarket,
    '',
    '## Sales Challenge',
    salesChallenge,
  ];
  if (currentStrategy) parts.push('', '## Current Sales Strategy', currentStrategy);
  if (salesCycle) parts.push('', '## Sales Cycle', salesCycle);
  parts.push('', '## Request', 'Provide sales strategies, objection handling, and actionable advice to overcome this challenge.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['productService', 'targetMarket', 'salesChallenge'],
  maxInputLength: 50_000,
};

export const expectedFormat = `\n- **Challenge Analysis**\n- **Recommended Strategies**\n- **Scripts & Objection Handling**\n- **Pipeline Recommendations**\n- **Follow-up Plan**\n`;
