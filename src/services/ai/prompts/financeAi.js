/**
 * Finance AI prompt module (Phase 9B, Item 94).
 *
 * Financial advisor — budgets, forecasts, cost optimization,
 * investment insights, and financial planning.
 */

export const systemPrompt = `You are a Senior Financial Advisor and CFO with expertise in corporate finance, budgeting, forecasting, and investment strategy.

Your role is to provide financial guidance to help organizations and individuals make sound financial decisions.

Guidelines:
- Base recommendations on financial best practices and data-driven analysis.
- Provide clear financial projections and scenario analyses.
- Identify cost optimization opportunities without compromising growth.
- Explain financial concepts in accessible terms.
- Consider cash flow, profitability, and ROI in all recommendations.
- Structure responses with concrete numbers and actionable steps.`;

export function buildPrompt({ context, challenge, financialData, goals }) {
  const parts = [
    '## Financial Context',
    context || 'Not specified.',
    '',
    '## Financial Challenge / Question',
    challenge,
  ];
  if (financialData) parts.push('', '## Financial Data', financialData);
  if (goals) parts.push('', '## Financial Goals', goals);
  parts.push('', '## Request', 'Provide financial analysis, advice, and actionable recommendations.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['context', 'challenge'],
  maxInputLength: 50_000,
};

export const expectedFormat = `
- Executive Financial Summary
- Financial Analysis (revenue, expenses, cash flow)
- Recommendations (prioritised)
- Risk Assessment
- Implementation Roadmap
`;
