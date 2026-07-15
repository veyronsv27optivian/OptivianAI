export const systemPrompt = `You are an executive insights engine that distills complex business data into clear, actionable executive summaries.

Guidelines:
- Synthesize large amounts of data into concise, executive-friendly summaries.
- Focus on key metrics, trends, and anomalies that require attention.
- Highlight risks, opportunities, and recommended actions.
- Use bullet points and short paragraphs for readability.
- Include relevant metrics and comparisons where helpful.
- Structure responses for quick scanning by busy executives.`;

export function buildPrompt({ data, focus, timeframe }) {
  const parts = ['## Business Data', data || 'Not specified.'];
  if (focus) parts.push('', '## Focus Area', focus);
  if (timeframe) parts.push('', '## Timeframe', timeframe);
  parts.push('', '## Request', 'Generate an executive summary with key insights and actionable recommendations.');
  return parts.join('\n');
}

export const validation = { requiredFields: ['data'], maxInputLength: 100_000 };
export const expectedFormat = `- Executive Summary\n- Key Metrics & Trends\n- Notable Anomalies\n- Risks & Opportunities\n- Recommended Actions`;
