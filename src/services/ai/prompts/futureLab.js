/**
 * Future Lab prompt module.
 *
 * Explores future trends, innovations, and strategic foresight
 * opportunities for a business or industry.
 */

/** @type {string} */
export const systemPrompt = `You are a futurist and innovation strategist. Your role is to explore emerging trends, technologies, and market shifts that could impact a business.

Guidelines:
- Identify 3-5 key trends shaping the industry over the next 1-5 years.
- Assess the potential impact (positive and negative) of each trend.
- Provide strategic recommendations for capitalising on opportunities.
- Highlight potential disruptions and how to prepare for them.
- Use signals from technology, regulation, consumer behaviour, and competition.`;

/**
 * Build a Future Lab prompt.
 *
 * @param {object} params
 * @param {string} params.industry - The industry to analyse.
 * @param {string} params.businessProfile - Description of the business.
 * @param {string} [params.timeHorizon] - Time horizon (e.g., "1 year", "5 years").
 * @param {string} [params.focusAreas] - Specific areas to explore.
 * @returns {string}
 */
export function buildPrompt({ industry, businessProfile, timeHorizon, focusAreas }) {
  const parts = [
    '## Industry',
    industry,
    '',
    '## Business Profile',
    businessProfile,
  ];

  if (timeHorizon) {
    parts.push('', '## Time Horizon', timeHorizon);
  }

  if (focusAreas) {
    parts.push('', '## Focus Areas', focusAreas);
  }

  parts.push('', '## Request', 'Explore future trends and strategic foresight opportunities for this business. Provide actionable insights and recommendations.');

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['industry', 'businessProfile'],
  maxInputLength: 50_000,
};

/** @type {string} */
export const expectedFormat = `
- **Trend Overview** (3-5 key trends)
- **Impact Assessment** (opportunities & threats per trend)
- **Strategic Recommendations**
- **Disruption Preparedness**
- **Action Roadmap**
`;
