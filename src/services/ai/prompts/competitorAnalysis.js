/**
 * Competitor Analysis prompt module.
 *
 * Analyses the competitive landscape, identifies competitor strengths
 * and weaknesses, and provides positioning recommendations.
 */

/** @type {string} */
export const systemPrompt = `You are a competitive intelligence analyst. Your role is to analyse competitors, identify market positioning, and provide strategic differentiation recommendations.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Guidelines:
- Identify direct, indirect, and emerging competitors.
- Analyse each competitor's: product offering, pricing model, target audience, market share, strengths, weaknesses.
- Use frameworks: Competitive Profile Matrix, Perceptual Map, Gap Analysis.
- Identify competitive advantages and disadvantages for the user's business.
- Provide actionable differentiation strategies.
- Highlight market trends affecting the competitive landscape.`;

/**
 * Build a Competitor Analysis prompt.
 *
 * @param {object} params
 * @param {string} params.businessDescription - Description of the user's business.
 * @param {string} params.market - Market / industry definition.
 * @param {string[]} [params.competitors] - Specific competitors to analyse.
 * @param {string} [params.competitorData] - Known data about competitors.
 * @param {string} [params.differentiationGoals] - Desired differentiation areas.
 * @returns {string}
 */
export function buildPrompt({ businessDescription, market, competitors, competitorData, differentiationGoals }) {
  const parts = [
    '## Our Business',
    businessDescription,
    '',
    '## Market Definition',
    market,
  ];

  if (competitors && competitors.length > 0) {
    parts.push('', '## Competitors to Analyse', competitors.map((c, i) => `${i + 1}. ${c}`).join('\n'));
  }

  if (competitorData) parts.push('', '## Known Competitor Data', competitorData);
  if (differentiationGoals) parts.push('', '## Differentiation Goals', differentiationGoals);

  parts.push('', '## Request', 'Analyse the competitive landscape and provide strategic positioning recommendations.');

  // Append JSON output instruction
  parts.push('',
    '## Output Format',
    'After your analysis, include a structured JSON block with EXACTLY this format (use these exact markers):',
    '<!-- AI_JSON_START -->',
    JSON.stringify({
      competitors: [
        { name: 'Competitor A', strengths: ['Brand recognition', 'Distribution'], weaknesses: ['High pricing', 'Slow support'], marketShare: 30, pricing: 'Premium', positioning: 'Market leader', targetAudience: 'Enterprise' },
        { name: 'Competitor B', strengths: ['Low price', 'Fast delivery'], weaknesses: ['Limited features'], marketShare: 20, pricing: 'Budget', positioning: 'Cost leader' },
      ],
      differentiators: ['Focus on customer experience', 'AI-powered features'],
      gapAnalysis: 'Market gap in mid-tier segment',
    }),
    '<!-- AI_JSON_END -->',
  );

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['businessDescription', 'market'],
  maxInputLength: 50_000,
};

/** @type {string} */
export const expectedFormat = `
- **Competitive Landscape Overview**
- **Competitor Profiles** (strengths, weaknesses, positioning)
- **Competitive Profile Matrix**
- **Gap Analysis**
- **Differentiation Strategies**
- **Strategic Recommendations**
`;
