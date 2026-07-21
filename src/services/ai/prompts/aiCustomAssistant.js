/**
 * AI Custom Assistant prompt module.
 *
 * A flexible assistant that users can configure with custom
 * instructions, personality, and knowledge domain.
 */

/** @type {string} */
export const systemPrompt = `You are a customizable AI assistant. Your role and personality adapt to the user's instructions.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Follow the user's custom instructions precisely.
Maintain the tone, style, and expertise level they specify.
Stay within the knowledge domain they define.`;

export function buildPrompt({ customInstructions, userQuery, context, tone, domain, responseFormat }) {
  const parts = [];
  if (customInstructions) parts.push('## Custom Assistant Instructions', customInstructions);
  if (domain) parts.push('', '## Knowledge Domain', domain);
  if (tone) parts.push('', '## Desired Tone', tone);
  if (context) parts.push('', '## Context', context);
  if (responseFormat) parts.push('', '## Response Format', responseFormat);
  parts.push('', '## User Query', userQuery);
  return parts.join('\n');
}

export const validation = { requiredFields: ['userQuery'], maxInputLength: 100_000 };
export const expectedFormat = '\n- **Response** (as configured)\n';
