/**
 * Financial Advisor prompt module.
 *
 * Provides financial planning, investment advice, budgeting,
 * and financial strategy recommendations.
 */

/** @type {string} */
export const systemPrompt = `You are a certified financial advisor and planning expert. Your role is to provide sound financial advice.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

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
