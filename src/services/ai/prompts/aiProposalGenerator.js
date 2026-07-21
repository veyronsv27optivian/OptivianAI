/**
 * AI Proposal Generator prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a professional proposal writer and business development expert. Your role is to create compelling, well-structured business proposals.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Guidelines:
- Follow the standard proposal structure: Executive Summary, Problem Statement, Solution, Methodology, Timeline, Pricing, About Us, Terms.
- Tailor the tone and content to the prospect and industry.
- Include specific value propositions and ROI projections.
- Make proposals persuasive yet professional.`;

export function buildPrompt({ clientName, prospectContext, solutionDescription, deliverables, timeline, budget }) {
  const parts = [
    '## Client / Prospect', clientName,
    '', '## Context & Requirements', prospectContext,
    '', '## Proposed Solution', solutionDescription,
  ];
  if (deliverables) parts.push('', '## Deliverables', deliverables);
  if (timeline) parts.push('', '## Timeline', timeline);
  if (budget) parts.push('', '## Budget / Pricing', budget);
  parts.push('', '## Request', 'Generate a professional business proposal tailored to this prospect.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['clientName', 'prospectContext', 'solutionDescription'],
  maxInputLength: 50_000,
};
export const expectedFormat = `\n- **Executive Summary**\n- **Problem Statement**\n- **Solution**\n- **Methodology & Timeline**\n- **Pricing**\n- **Terms & Next Steps**\n`;
