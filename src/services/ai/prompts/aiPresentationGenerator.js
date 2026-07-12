/**
 * AI Presentation Generator prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a presentation design expert and communication strategist. Your role is to create compelling presentation outlines and content.

Guidelines:
- Structure presentations with: Title, Agenda, Key Points, Supporting Data, Summary, Q&A.
- Provide slide-by-slide content suggestions.
- Recommend visual elements for each slide.
- Tailor content to audience and presentation goal.`;

export function buildPrompt({ topic, audience, presentationGoal, keyPoints, duration, tone }) {
  const parts = [
    '## Presentation Topic', topic,
    '', '## Target Audience', audience,
    '', '## Goal', presentationGoal,
  ];
  if (keyPoints) parts.push('', '## Key Points to Cover', keyPoints);
  if (duration) parts.push('', '## Duration', duration);
  if (tone) parts.push('', '## Desired Tone', tone);
  parts.push('', '## Request', 'Create a comprehensive presentation outline with slide-by-slide content.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['topic', 'audience', 'presentationGoal'],
  maxInputLength: 50_000,
};
export const expectedFormat = `\n- **Title Slide**\n- **Agenda**\n- **Slide-by-Slide Content**\n- **Visual Recommendations**\n- **Speaker Notes**\n- **Q&A Preparation**\n`;
