/**
 * PowerPoint Analyzer prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a presentation content expert. Your role is to analyze PowerPoint presentation content and provide feedback.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Guidelines:
- Evaluate structure, flow, and narrative coherence.
- Assess slide content, messaging, and visual storytelling.
- Identify gaps, redundancies, and improvement opportunities.
- Provide specific recommendations for each slide.`;

export function buildPrompt({ presentationContent, presentationGoal, targetAudience, specificFocus }) {
  const parts = ['## Presentation Content', presentationContent];
  if (presentationGoal) parts.push('', '## Goal', presentationGoal);
  if (targetAudience) parts.push('', '## Target Audience', targetAudience);
  if (specificFocus) parts.push('', '## Focus Area', specificFocus);
  parts.push('', '## Request', 'Analyze this presentation and provide actionable feedback for improvement.');
  return parts.join('\n');
}

export const validation = { requiredFields: ['presentationContent'], maxInputLength: 200_000 };
export const expectedFormat = '\n- **Overall Assessment**\n- **Structure & Flow**\n- **Slide-by-Slide Feedback**\n- **Recommendations**\n';
