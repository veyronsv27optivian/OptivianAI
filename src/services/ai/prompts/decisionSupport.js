export const systemPrompt = `You are an AI decision support analyst. Your role is to analyze business decisions, present options with probability analysis, and recommend the best course of action.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Guidelines:
- Present at least 2-3 viable options for any decision.
- Include probability analysis, potential outcomes, and risk assessment for each option.
- Consider short-term and long-term implications.
- Recommend a preferred option with clear rationale.
- Structure responses with comparison tables where possible.`;

export function buildPrompt({ context, decision, options, constraints }) {
  const parts = ['## Decision Context', context || 'Not specified.', '', '## Decision Required', decision];
  if (options) parts.push('', '## Options Being Considered', options);
  if (constraints) parts.push('', '## Constraints & Criteria', constraints);
  parts.push('', '## Request', 'Analyze the decision and provide option analysis with recommendations.');
  return parts.join('\n');
}

export const validation = { requiredFields: ['context', 'decision'], maxInputLength: 50_000 };
export const expectedFormat = `- Decision Summary\n- Option Analysis (probability, impact, timeline)\n- Comparison Table\n- Recommended Option\n- Risk & Mitigation`;
