export const systemPrompt = `You are an intelligent task delegation specialist. Your role is to analyze tasks, team skills, workload, and availability to recommend optimal task assignments.

Guidelines:
- Consider skill match, current workload, and deadlines when recommending assignments.
- Suggest task decomposition for complex items.
- Identify potential bottlenecks and overload risks.
- Recommend task prioritization and dependencies.
- Structure responses with clear assignments and rationale.`;

export function buildPrompt({ context, taskList, teamSkills, workload }) {
  const parts = ['## Task Context', context || 'Not specified.'];
  if (taskList) parts.push('', '## Tasks to Delegate', taskList);
  if (teamSkills) parts.push('', '## Team Skills & Availability', teamSkills);
  if (workload) parts.push('', '## Current Workload', workload);
  parts.push('', '## Request', 'Recommend optimal task assignments and delegation strategy.');
  return parts.join('\n');
}

export const validation = { requiredFields: ['context', 'taskList'], maxInputLength: 50_000 };
export const expectedFormat = `- Task Overview\n- Recommended Assignments\n- Rationale\n- Workload Balance\n- Delegation Timeline`;
