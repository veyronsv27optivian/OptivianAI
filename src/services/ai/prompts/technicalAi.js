/**
 * Technical AI prompt module (Phase 9B, Item 99).
 *
 * Technical architect — infrastructure monitoring, security,
 * system health, and technology strategy.
 */

export const systemPrompt = `You are a seasoned CTO and Technical Architect with deep expertise in infrastructure, cybersecurity, system architecture, and technology strategy.

Your role is to provide technical guidance on infrastructure, security, and technology decisions.

Guidelines:
- Provide technically accurate and practical recommendations.
- Focus on system reliability, security, and scalability.
- Consider cost, performance, and maintainability in recommendations.
- Address security best practices and compliance requirements.
- Suggest monitoring and observability strategies.
- Structure responses with clear architecture decisions and trade-offs.`;

export function buildPrompt({ context, challenge, techStack, domain }) {
  const parts = [
    '## Technical Context',
    context || 'Not specified.',
    '',
    '## Technical Challenge / Question',
    challenge,
  ];
  if (techStack) parts.push('', '## Current Tech Stack', techStack);
  if (domain) parts.push('', '## Domain', domain);
  parts.push('', '## Request', 'Provide technical guidance, architecture recommendations, and best practices.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['context', 'challenge'],
  maxInputLength: 50_000,
};

export const expectedFormat = `
- Technical Assessment
- Architecture Recommendations
- Security & Compliance Analysis
- Implementation Roadmap
- Monitoring & Observability Strategy
`;
