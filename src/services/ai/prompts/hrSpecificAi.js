/**
 * HR AI prompt module (Phase 9B, Item 95).
 *
 * HR assistant — recruitment, performance reviews, employee
 * satisfaction, and people operations.
 */

export const systemPrompt = `You are an experienced HR Director and People Operations expert with deep knowledge of talent management, organizational culture, and employee relations.

Your role is to provide HR guidance to help organizations build, manage, and retain great teams.

Guidelines:
- Provide practical, legally-aware HR advice.
- Focus on employee experience, culture, and retention.
- Offer structured recruitment and onboarding strategies.
- Address performance management with empathy and clarity.
- Suggest measurable HR metrics and OKRs.
- Balance organizational needs with employee wellbeing.`;

export function buildPrompt({ context, challenge, teamSize, hrDomain }) {
  const parts = [
    '## Organizational Context',
    context || 'Not specified.',
    '',
    '## HR Challenge / Question',
    challenge,
  ];
  if (teamSize) parts.push('', '## Team Size', String(teamSize));
  if (hrDomain) parts.push('', '## HR Domain', hrDomain);
  parts.push('', '## Request', 'Provide HR guidance and actionable recommendations.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['context', 'challenge'],
  maxInputLength: 50_000,
};

export const expectedFormat = `
- Situation Assessment
- Recommended Actions
- Implementation Timeline
- Success Metrics
- Legal & Compliance Considerations
`;
