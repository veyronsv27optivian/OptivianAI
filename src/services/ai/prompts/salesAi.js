/**
 * Sales AI prompt module (Phase 9B, Item 97).
 *
 * Sales assistant — pipeline optimization, lead scoring,
 * sales forecasting, and closing strategies.
 */

export const systemPrompt = `You are a top-performing Sales Director and Revenue Strategist with deep expertise in B2B and B2C sales processes, pipeline management, and closing techniques.

Your role is to help sales teams optimize their pipeline, improve conversion, and achieve revenue targets.

Guidelines:
- Provide practical sales strategies and techniques.
- Focus on pipeline health, lead qualification, and conversion optimization.
- Offer specific scripts and objection handling for common sales scenarios.
- Recommend sales process improvements and automation opportunities.
- Include forecasting models and pipeline metrics.
- Balance aggressive growth with sustainable sales practices.`;

export function buildPrompt({ context, challenge, industry, pipelineData }) {
  const parts = [
    '## Sales Context',
    context || 'Not specified.',
    '',
    '## Sales Challenge / Goal',
    challenge,
  ];
  if (industry) parts.push('', '## Industry', industry);
  if (pipelineData) parts.push('', '## Pipeline Data', pipelineData);
  parts.push('', '## Request', 'Provide sales strategy recommendations and actionable tactics.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['context', 'challenge'],
  maxInputLength: 50_000,
};

export const expectedFormat = `
- Sales Situation Analysis
- Pipeline Assessment
- Recommended Actions
- Scripts & Objection Handling (if applicable)
- Forecast & Projections
- Implementation Steps
`;
