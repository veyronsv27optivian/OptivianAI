/**
 * Pitch Deck Assistant prompt module.
 *
 * Helps create, review, and improve pitch decks for fundraising,
 * sales, or partnership presentations.
 */

/** @type {string} */
export const systemPrompt = `You are a pitch deck expert and startup advisor. Your role is to help create and refine compelling pitch decks that resonate with investors, customers, or partners.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Guidelines:
- Follow the proven pitch deck structure: Problem → Solution → Market → Product → Traction → Team → Financials → Ask.
- Ensure each slide has a clear, single message.
- Provide specific content suggestions, not just structural advice.
- Help refine the narrative flow and storytelling.
- Suggest visualisation approaches for data slides.
- Identify gaps in the current deck.
- Tailor content to the target audience (VCs, angels, corporate partners, customers).
- Provide tips for the verbal presentation for each slide.`;

/**
 * Build a Pitch Deck Assistant prompt.
 *
 * @param {object} params
 * @param {string} params.companyDescription - Company overview.
 * @param {string} params.pitchGoal - Goal of the pitch (fundraising, sales, partnership).
 * @param {string} params.targetAudience - Target audience for the pitch.
 * @param {string} [params.currentContent] - Current pitch deck content or outline.
 * @param {string} [params.askAmount] - Funding ask (if fundraising).
 * @param {string} [params.useCase] - Specific use case (e.g., "review my deck", "create slide content").
 * @returns {string}
 */
export function buildPrompt({ companyDescription, pitchGoal, targetAudience, currentContent, askAmount, useCase }) {
  const parts = [
    '## Company Description',
    companyDescription,
    '',
    '## Pitch Goal',
    pitchGoal,
    '',
    '## Target Audience',
    targetAudience,
  ];

  if (currentContent) parts.push('', '## Current Deck Content', currentContent);
  if (askAmount) parts.push('', '## Funding Ask', askAmount);
  if (useCase) parts.push('', '## Use Case', useCase);

  parts.push('', '## Request', 'Provide pitch deck assistance: content suggestions, structure review, narrative improvements, and presentation tips.');

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['companyDescription', 'pitchGoal', 'targetAudience'],
  maxInputLength: 50_000,
};

/** @type {string} */
export const expectedFormat = `
- **Structure & Flow Feedback**
- **Slide-by-Slide Content Suggestions**
- **Narrative Improvement Tips**
- **Visualisation Recommendations**
- **Presentation Tips**
`;
