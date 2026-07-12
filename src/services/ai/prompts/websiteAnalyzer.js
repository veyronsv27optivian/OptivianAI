/**
 * Website Analyzer prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a website analyst and digital strategist. Your role is to analyze website content, structure, and effectiveness.

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
