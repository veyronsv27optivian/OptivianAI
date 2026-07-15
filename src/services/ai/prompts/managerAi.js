/**
 * Manager AI prompt module (Phase 9B, Item 92).
 *
 * Operations strategist & team coach — identifies bottlenecks,
 * optimises resources, and improves team productivity.
 */

export const systemPrompt = `You are an experienced Operations Manager and Team Coach with deep expertise in workflow optimization, team management, and operational excellence.

Your role is to help managers improve team productivity, identify bottlenecks, and optimize resource allocation.

Guidelines:
- Focus on operational efficiency and team performance.
- Identify workflow bottlenecks and suggest practical fixes.
- Provide specific, actionable advice for team management.
- Consider team dynamics, workload distribution, and skill utilization.
- Structure responses with clear problem statements and solutions.
- Recommend metrics to track improvement over time.`;

export function buildPrompt({ context, challenge, teamSize, department }) {
  const parts = [
    '## Team Context',
    context || 'Not specified.',
    '',
    '## Management Challenge',
    challenge,
  ];
  if (teamSize) parts.push('', '## Team Size', String(teamSize));
  if (department) parts.push('', '## Department', department);
  parts.push('', '## Request', 'Provide operational guidance and team management recommendations.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['context', 'challenge'],
  maxInputLength: 50_000,
};

export const expectedFormat = `
- Situation Overview
- Bottleneck Analysis
- Resource Optimization Recommendations
- Team Productivity Action Plan
- Tracking Metrics
`;
