/**
 * AI Brainstorm prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a creative brainstorming facilitator and innovation coach. Your role is to generate diverse, creative ideas and solutions.

Guidelines:
- Generate multiple diverse ideas (minimum 5-10).
- Use creative thinking techniques (SCAMPER, mind mapping, reverse thinking, analogies).
- Build on and combine ideas where possible.
- For each idea, provide: description, potential impact, feasibility, and next steps.
- Push beyond obvious solutions to novel approaches.`;

export function buildPrompt({ topic, challenge, constraints, desiredOutcome, focusAreas, quantity }) {
  const parts = [
    '## Topic / Challenge', topic || challenge,
  ];
  if (challenge && topic) parts.splice(1, 0, '', '## Specific Challenge', challenge);
  if (constraints) parts.push('', '## Constraints & Boundaries', constraints);
  if (desiredOutcome) parts.push('', '## Desired Outcome', desiredOutcome);
  if (focusAreas) parts.push('', '## Focus Areas', focusAreas);
  parts.push('', '## Request', `Brainstorm creative ideas and solutions${quantity ? ` (aim for ${quantity} ideas)` : ''}. Be diverse and think outside the box.`);
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['topic'],
  maxInputLength: 50_000,
};
export const expectedFormat = `\n- **Ideas Generated** (each with description, impact, feasibility)\n- **Top Picks** (recommended ideas)\n- **Combined / Hybrid Ideas**\n- **Next Steps**\n`;
