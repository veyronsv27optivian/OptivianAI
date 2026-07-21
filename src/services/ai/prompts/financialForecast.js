/**
 * Financial Forecast prompt module.
 *
 * Generates financial projections, revenue forecasts, cash flow analysis,
 * and budgeting recommendations for businesses.
 */

/** @type {string} */
export const systemPrompt = `You are a financial analyst and forecasting expert. Your role is to create detailed financial projections and provide actionable financial insights.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Guidelines:
- Base projections on provided historical data and reasonable assumptions.
- Clearly state all assumptions underlying the forecast.
- Provide best-case, baseline, and worst-case scenarios.
- Include revenue projections, expense breakdowns, and cash flow analysis.
- Calculate key financial metrics: gross margin, net margin, burn rate, runway, ROI, payback period.
- Highlight key risks to the financial projections.
- Recommend actions to improve financial health.`;

/**
 * Build a Financial Forecast prompt.
 *
 * @param {object} params
 * @param {string} params.businessModel - Description of business model and revenue streams.
 * @param {string} params.historicalData - Recent financial data (revenue, expenses, etc.).
 * @param {string} params.forecastPeriod - Forecast period (e.g., "12 months", "3 years").
 * @param {string} [params.marketContext] - Market conditions and growth rates.
 * @param {string} [params.assumptions] - Key assumptions for the forecast.
 * @returns {string}
 */
export function buildPrompt({ businessModel, historicalData, forecastPeriod, marketContext, assumptions }) {
  const parts = [
    '## Business Model & Revenue Streams',
    businessModel,
    '',
    '## Historical Financial Data',
    historicalData,
    '',
    '## Forecast Period',
    forecastPeriod,
  ];

  if (marketContext) parts.push('', '## Market Context', marketContext);
  if (assumptions) parts.push('', '## Key Assumptions', assumptions);

  parts.push('', '## Request', 'Generate detailed financial projections with scenario analysis, key metrics, and actionable recommendations.');

  // Append JSON output instruction
  parts.push('',
    '## Output Format',
    'After your analysis, include a structured JSON block with EXACTLY this format (use these exact markers):',
    '<!-- AI_JSON_START -->',
    JSON.stringify({
      scenarios: {
        bestCase: { revenue: [{ month: 'Jan', value: 50000 }] },
        baseline: { revenue: [{ month: 'Jan', value: 40000 }] },
        worstCase: { revenue: [{ month: 'Jan', value: 30000 }] },
      },
      metrics: { grossMargin: 60, burnRate: 50000, runway: 12 },
    }),
    '<!-- AI_JSON_END -->',
  );

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['businessModel', 'historicalData', 'forecastPeriod'],
  maxInputLength: 100_000,
};

/** @type {string} */
export const expectedFormat = `
- **Executive Summary**
- **Assumptions** (stated clearly)
- **Scenario Analysis** (best/baseline/worst case)
- **Revenue Forecast** (monthly/quarterly breakdown)
- **Expense Projections**
- **Cash Flow Analysis**
- **Key Financial Metrics**
- **Risk Assessment & Recommendations**
`;
