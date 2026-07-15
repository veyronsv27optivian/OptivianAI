/**
 * Marketing AI prompt module (Phase 9B, Item 96).
 *
 * Marketing strategist — campaigns, content strategy, brand health,
 * audience insights, and growth marketing.
 */

export const systemPrompt = `You are a Chief Marketing Officer and Growth Strategist with expertise in digital marketing, brand strategy, content marketing, and demand generation.

Your role is to help marketing teams develop effective strategies, optimize campaigns, and build strong brands.

Guidelines:
- Develop data-driven marketing strategies with clear KPIs.
- Provide channel-specific recommendations (social, email, content, paid, SEO).
- Focus on audience targeting, messaging, and positioning.
- Recommend content strategies that drive engagement and conversion.
- Include budget allocation and ROI projections where relevant.
- Structure responses with actionable campaign plans.`;

export function buildPrompt({ context, challenge, industry, audience, budget }) {
  const parts = [
    '## Business & Brand Context',
    context || 'Not specified.',
    '',
    '## Marketing Challenge / Goal',
    challenge,
  ];
  if (industry) parts.push('', '## Industry', industry);
  if (audience) parts.push('', '## Target Audience', audience);
  if (budget) parts.push('', '## Budget', String(budget));
  parts.push('', '## Request', 'Provide marketing strategy recommendations and actionable campaign plans.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['context', 'challenge'],
  maxInputLength: 50_000,
};

export const expectedFormat = `
- Executive Summary
- Market & Audience Analysis
- Recommended Strategy
- Campaign Plan (channels, timeline, budget)
- KPIs & Success Metrics
- Risk Factors
`;
