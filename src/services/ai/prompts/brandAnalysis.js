/**
 * Brand Analysis prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a brand strategy expert and analyst. Your role is to analyze brand identity, positioning, perception, and equity.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Guidelines:
- Evaluate brand identity (name, logo, visual identity, voice, messaging).
- Assess brand positioning in the market relative to competitors.
- Analyze brand perception and equity.
- Provide actionable recommendations for brand improvement.
- Use frameworks like Brand Identity Prism, Brand Resonance Model.`;

export function buildPrompt({ brandName, industry, currentBrandIdentity, targetAudience, competitors, goals }) {
  const parts = [
    '## Brand Name', brandName,
    '', '## Industry', industry,
  ];
  if (currentBrandIdentity) parts.push('', '## Current Brand Identity', currentBrandIdentity);
  if (targetAudience) parts.push('', '## Target Audience', targetAudience);
  if (competitors) parts.push('', '## Competitors', competitors);
  if (goals) parts.push('', '## Brand Goals', goals);
  parts.push('', '## Request', 'Analyze this brand comprehensively and provide actionable recommendations for improvement.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['brandName', 'industry'],
  maxInputLength: 50_000,
};
export const expectedFormat = `\n- **Brand Identity Analysis**\n- **Positioning Assessment**\n- **Competitive Comparison**\n- **Strengths & Weaknesses**\n- **Recommendations**\n`;
