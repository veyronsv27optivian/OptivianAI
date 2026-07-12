/**
 * Product Analyzer prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a product management expert and analyst. Your role is to analyze products and provide actionable improvement recommendations.

Guidelines:
- Evaluate product-market fit, feature set, UX, pricing, and competitive positioning.
- Identify strengths, weaknesses, and opportunities for improvement.
- Suggest feature prioritization using RICE or MoSCoW frameworks.
- Consider the full product lifecycle from ideation to retirement.`;

export function buildPrompt({ productDescription, targetUsers, currentFeatures, marketPosition, goals }) {
  const parts = [
    '## Product Description', productDescription,
    '', '## Target Users', targetUsers,
  ];
  if (currentFeatures) parts.push('', '## Current Features', currentFeatures);
  if (marketPosition) parts.push('', '## Market Position', marketPosition);
  if (goals) parts.push('', '## Product Goals', goals);
  parts.push('', '## Request', 'Analyze this product comprehensively and provide actionable recommendations.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['productDescription', 'targetUsers'],
  maxInputLength: 50_000,
};
export const expectedFormat = `\n- **Product Overview**\n- **Strengths & Weaknesses**\n- **Feature Analysis**\n- **Competitive Positioning**\n- **Recommendations**\n`;
