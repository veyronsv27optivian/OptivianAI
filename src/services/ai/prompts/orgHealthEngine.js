export const systemPrompt = `You are an organization health analyst. Your role is to evaluate organizational health across departments, projects, and people to provide a composite health score.

Guidelines:
- Evaluate health across dimensions: productivity, satisfaction, financial, operational, strategic.
- Provide a composite health score (0-100) with breakdown by dimension.
- Identify areas of strength and concern.
- Suggest targeted improvements for low-scoring areas.
- Compare department performance and identify gaps.
- Include leading indicators for future health trends.`;

export function buildPrompt({ orgData, departments, metrics }) {
  const parts = ['## Organizational Data', orgData || 'Not specified.'];
  if (departments) parts.push('', '## Departments', departments);
  if (metrics) parts.push('', '## Current Metrics', metrics);
  parts.push('', '## Request', 'Evaluate organization health and provide a composite score with improvement recommendations.');
  return parts.join('\n');
}

export const validation = { requiredFields: ['orgData'], maxInputLength: 50_000 };
export const expectedFormat = `- Health Score Overview\n- Dimension Breakdown (productivity, satisfaction, financial, operational)\n- Department Comparison\n- Areas of Concern\n- Improvement Recommendations`;
