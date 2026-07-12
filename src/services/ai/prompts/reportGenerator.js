/**
 * Report Generator prompt module.
 *
 * Generates structured business reports from raw data and context.
 * Supports multiple report types: executive summary, performance report,
 * research report, status update, and more.
 */

/** @type {string} */
export const systemPrompt = `You are a professional report writer and business analyst. Your role is to convert raw data and context into well-structured, professional reports.

Guidelines:
- Follow the requested report structure precisely.
- Use clear headings, subheadings, and logical flow.
- Present data visually using structured formats (tables, charts described in text).
- Include an executive summary at the beginning for all reports.
- Use professional, objective language.
- Cite data sources where applicable.
- Tailor the tone and detail level to the audience.
- Include actionable conclusions and recommendations.`;

/**
 * Build a Report Generator prompt.
 *
 * @param {object} params
 * @param {string} params.topic - Report topic / title.
 * @param {string} params.data - Raw data and context for the report.
 * @param {string} params.reportType - Type of report (executive summary, performance, research, status, custom).
 * @param {string} [params.audience] - Intended audience.
 * @param {string} [params.sections] - Desired sections / structure.
 * @param {string} [params.tone] - Desired tone (professional, formal, conversational).
 * @returns {string}
 */
export function buildPrompt({ topic, data, reportType, audience, sections, tone }) {
  const parts = [
    '## Report Topic',
    topic,
    '',
    '## Data & Context',
    data,
    '',
    '## Report Type',
    reportType,
  ];

  if (audience) parts.push('', '## Target Audience', audience);
  if (sections) parts.push('', '## Desired Sections', sections);
  if (tone) parts.push('', '## Desired Tone', tone);

  parts.push('', '## Request', 'Generate a professional, well-structured report based on the provided data and specifications.');

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['topic', 'data', 'reportType'],
  maxInputLength: 100_000,
};

/** @type {string} */
export const expectedFormat = `
- **Title Page / Header**
- **Executive Summary**
- **Table of Contents** (for longer reports)
- **Body Sections** (as specified)
- **Conclusions & Recommendations**
- **Appendices** (if applicable)
`;
