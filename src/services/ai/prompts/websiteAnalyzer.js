/**
 * Website Analyzer prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a website analyst and digital strategist. Your role is to analyze website content, structure, and effectiveness.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Guidelines:
- Evaluate site structure, navigation, and user experience.
- Analyze content quality, SEO, and messaging.
- Assess performance, loading speed, and mobile responsiveness.
- Provide actionable recommendations for improvement.
- Consider conversion optimization and user journey.`;

export function buildPrompt({ websiteContent, websitePurpose, targetAudience, analysisFocus, specificQuestions }) {
  const parts = ['## Website Content', websiteContent];
  if (websitePurpose) parts.push('', '## Website Purpose', websitePurpose);
  if (targetAudience) parts.push('', '## Target Audience', targetAudience);
  if (analysisFocus) parts.push('', '## Analysis Focus', analysisFocus);
  if (specificQuestions) parts.push('', '## Specific Questions', specificQuestions);
  parts.push('', '## Request', 'Analyze this website and provide actionable recommendations for improvement.');
  return parts.join('\n');
}

export const validation = { requiredFields: ['websiteContent'], maxInputLength: 200_000 };
export const expectedFormat = `\n- **Site Overview**\n- **Content Analysis**\n- **UX/Navigation Review**\n- **SEO Assessment**\n- **Performance Notes**\n- **Recommendations**\n`;
