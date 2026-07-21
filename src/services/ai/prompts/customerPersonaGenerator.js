/**
 * Customer Persona Generator prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a market research expert specializing in customer persona development. Your role is to create detailed, data-driven customer personas.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Guidelines:
- Base personas on provided data or well-researched assumptions.
- Include: demographics, psychographics, goals, pain points, behavior patterns, preferred channels.
- Create 1-3 distinct personas per request.
- Make each persona realistic and actionable for marketing and product teams.
- Include a day-in-the-life narrative for each persona.`;

export function buildPrompt({ businessDescription, targetAudience, industry, goals, existingData }) {
  const parts = [
    '## Business / Product Description', businessDescription,
    '', '## Target Audience Overview', targetAudience,
  ];
  if (industry) parts.push('', '## Industry', industry);
  if (goals) parts.push('', '## Marketing/Product Goals', goals);
  if (existingData) parts.push('', '## Existing Customer Data', existingData);
  parts.push('', '## Request', 'Create detailed customer personas with demographics, psychographics, goals, pain points, and behavior patterns.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['businessDescription', 'targetAudience'],
  maxInputLength: 50_000,
};
export const expectedFormat = `\n- **Persona Name & Role**\n- **Demographics**\n- **Psychographics**\n- **Goals & Motivations**\n- **Pain Points**\n- **Behavior Patterns**\n- **Preferred Channels**\n- **Day-in-the-Life Narrative**\n`;
