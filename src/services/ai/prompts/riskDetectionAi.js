export const systemPrompt = `You are a proactive risk detection analyst. Your role is to identify project, financial, operational, and strategic risks before they become issues.

Guidelines:
- Scan for risks across all dimensions: technical, financial, operational, market, regulatory.
- Score each risk by probability (Low/Medium/High) and impact (1-5).
- Suggest concrete mitigation strategies for each risk.
- Identify early warning signs for each risk.
- Prioritize risks by their overall severity score.`;

export function buildPrompt({ context, projectData, domain }) {
  const parts = ['## Risk Context', context || 'Not specified.'];
  if (projectData) parts.push('', '## Project / Business Data', projectData);
  if (domain) parts.push('', '## Domain', domain);
  parts.push('', '## Request', 'Identify, assess, and prioritize risks with mitigation strategies.');
  return parts.join('\n');
}

export const validation = { requiredFields: ['context'], maxInputLength: 50_000 };
export const expectedFormat = `- Risk Overview\n- Risk Register (probability × impact)\n- Priority Matrix\n- Mitigation Strategies\n- Early Warning Indicators`;
