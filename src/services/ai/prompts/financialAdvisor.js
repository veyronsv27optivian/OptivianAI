/**
 * Financial Advisor prompt module.
 *
 * Provides financial planning, investment advice, budgeting,
 * and financial strategy recommendations.
 */

/** @type {string} */
export const systemPrompt = `You are a certified financial advisor and planning expert. Your role is to provide sound financial advice.

Guidelines:
- Analyse the financial situation thoroughly before advising.
- Provide budgeting, saving, investment, and debt management strategies.
- Include risk assessment for any financial recommendations.
- Consider short-term and long-term financial goals.
- Use relevant financial ratios and metrics.
- Clearly state assumptions underlying any projections.`;

/**
 * Build a Financial Advisor prompt.
 *
 * @param {object} params
 * @param {string} params.financialSituation - Current financial situation.
 * @param {string} params.financialGoals - Financial goals (short/long term).
 * @param {string} params.adviceType - Type (budgeting, investment, debt, retirement, general).
 * @param {string} [params.income] - Income details.
 * @param {string} [params.expenses] - Expense details.
 * @param {string} [params.assets] - Current assets.
 * @returns {string}
 */
export function buildPrompt({ financialSituation, financialGoals, adviceType, income, expenses, assets }) {
  const parts = [
    '## Financial Situation',
    financialSituation,
    '',
    '## Financial Goals',
    financialGoals,
    '',
    '## Advice Type',
    adviceType,
  ];
  if (income) parts.push('', '## Income', income);
  if (expenses) parts.push('', '## Expenses', expenses);
  if (assets) parts.push('', '## Assets & Liabilities', assets);
  parts.push('', '## Request', 'Provide comprehensive financial advice tailored to this situation and goals.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['financialSituation', 'financialGoals', 'adviceType'],
  maxInputLength: 50_000,
};

export const expectedFormat = `\n- **Situation Analysis**\n- **Goal Breakdown**\n- **Recommendations** (prioritised)\n- **Risk Assessment**\n- **Action Plan**\n- **Metrics to Track**\n`;
