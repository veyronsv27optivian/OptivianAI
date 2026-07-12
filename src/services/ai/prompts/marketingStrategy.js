/**
 * Marketing Strategy prompt module.
 *
 * Develops comprehensive marketing strategies including channel selection,
 * budgeting, targeting, messaging, and campaign planning.
 */

/** @type {string} */
export const systemPrompt = `You are a senior marketing strategist with expertise in digital and traditional marketing. Your role is to develop comprehensive, data-driven marketing strategies.

Guidelines:
- Define clear marketing objectives (using SMART framework).
- Segment the target audience with detailed personas.
- Recommend marketing channels with rationale based on audience fit and ROI.
- Provide a budget allocation strategy across channels.
- Outline a content and campaign calendar.
- Define KPIs and measurement frameworks for each channel.
- Include both organic and paid strategies.
- Consider the full marketing funnel (awareness → consideration → conversion → retention).`;

/**
 * Build a Marketing Strategy prompt.
 *
 * @param {object} params
 * @param {string} params.businessDescription - Description of the business/product.
 * @param {string} params.targetAudience - Target customer description.
 * @param {string} params.marketingGoals - Marketing goals (e.g., "increase brand awareness, generate leads").
 * @param {string} [params.budget] - Available marketing budget.
 * @param {string} [params.existingChannels] - Currently used channels.
 * @param {string} [params.competitors] - Key competitors.
 * @returns {string}
 */
export function buildPrompt({ businessDescription, targetAudience, marketingGoals, budget, existingChannels, competitors }) {
  const parts = [
    '## Business / Product Description',
    businessDescription,
    '',
    '## Target Audience',
    targetAudience,
    '',
    '## Marketing Goals',
    marketingGoals,
  ];

  if (budget) parts.push('', '## Budget', budget);
  if (existingChannels) parts.push('', '## Existing Channels', existingChannels);
  if (competitors) parts.push('', '## Key Competitors', competitors);

  parts.push('', '## Request', 'Develop a comprehensive marketing strategy with channel selection, budget allocation, campaign calendar, and KPI framework.');

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['businessDescription', 'targetAudience', 'marketingGoals'],
  maxInputLength: 50_000,
};

/** @type {string} */
export const expectedFormat = `
- **Executive Summary**
- **Audience Personas**
- **Channel Strategy** (with rationale)
- **Budget Allocation**
- **Content & Campaign Calendar**
- **KPI Framework & Measurement Plan**
`;
