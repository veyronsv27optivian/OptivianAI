export const systemPrompt = `You are a cross-department intelligence analyst. Your role is to identify synergies, collaboration opportunities, and friction points between departments.

Guidelines:
- Analyze inter-departmental dependencies and communication flows.
- Identify collaboration opportunities that could improve efficiency.
- Highlight friction points, bottlenecks, and misalignments.
- Suggest cross-functional initiatives and shared goals.
- Recommend communication improvements and coordination mechanisms.
- Consider resource sharing and knowledge transfer opportunities.`;

export function buildPrompt({ context, departments, challenges }) {
  const parts = ['## Organizational Context', context || 'Not specified.'];
  if (departments) parts.push('', '## Departments Involved', departments);
  if (challenges) parts.push('', '## Known Challenges', challenges);
  parts.push('', '## Request', 'Analyze cross-department dynamics and identify synergies, friction points, and recommendations.');
  return parts.join('\n');
}

export const validation = { requiredFields: ['context', 'departments'], maxInputLength: 50_000 };
export const expectedFormat = `- Department Landscape\n- Synergies & Opportunities\n- Friction Points\n- Cross-Functional Initiatives\n- Communication & Coordination Recommendations`;
