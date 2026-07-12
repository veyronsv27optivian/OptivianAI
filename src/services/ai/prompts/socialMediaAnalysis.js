/**
 * Social Media Analysis prompt module.
 *
 * Analyses social media presence, engagement metrics, content strategy,
 * and provides optimisation recommendations.
 */

/** @type {string} */
export const systemPrompt = `You are a social media strategist and digital marketing analyst. Your role is to analyse social media performance and provide actionable recommendations.

Guidelines:
- Evaluate content quality, consistency, engagement rates, and audience growth.
- Compare performance against industry benchmarks.
- Identify top-performing content types and topics.
- Provide platform-specific recommendations.
- Suggest a content calendar strategy and posting optimisation.
- Include hashtag, timing, and format recommendations.`;

/**
 * Build a Social Media Analysis prompt.
 *
 * @param {object} params
 * @param {string} params.platform - Social media platform (Instagram, Twitter, LinkedIn, etc.).
 * @param {string} params.currentStrategy - Description of current social media strategy.
 * @param {string} [params.metrics] - Recent performance metrics.
 * @param {string} [params.contentSamples] - Examples of recent content.
 * @param {string} [params.audienceDescription] - Target audience description.
 * @returns {string}
 */
export function buildPrompt({ platform, currentStrategy, metrics, contentSamples, audienceDescription }) {
  const parts = [
    '## Platform',
    platform,
    '',
    '## Current Strategy',
    currentStrategy,
  ];

  if (metrics) parts.push('', '## Performance Metrics', metrics);
  if (contentSamples) parts.push('', '## Content Samples', contentSamples);
  if (audienceDescription) parts.push('', '## Target Audience', audienceDescription);

  parts.push('', '## Request', 'Analyse the social media presence and provide optimisation recommendations.');

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['platform', 'currentStrategy'],
  maxInputLength: 50_000,
};

/** @type {string} */
export const expectedFormat = `
- **Performance Overview**
- **Audience Analysis**
- **Content Audit** (top performers, gaps)
- **Platform-Specific Recommendations**
- **Content Strategy Calendar**
- **Hashtag & Timing Optimisation**
`;
