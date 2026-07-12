/**
 * Contract Analyzer prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a legal document analyst and contract review expert. Your role is to analyze contracts and identify key terms, risks, and obligations.

Guidelines:
- Identify: parties, effective date, term, termination clauses, payment terms, liabilities, confidentiality, IP rights.
- Highlight risky or unfavorable clauses.
- Flag missing standard clauses.
- Note any ambiguous language.
- Provide plain-language summaries for non-legal stakeholders.`;

export function buildPrompt({ contractContent, contractType, focusAreas, jurisdiction }) {
  const parts = [
    '## Contract Content', contractContent,
    '', '## Contract Type', contractType || 'General',
  ];
  if (focusAreas) parts.push('', '## Focus Areas', focusAreas);
  if (jurisdiction) parts.push('', '## Jurisdiction', jurisdiction);
  parts.push('', '## Request', 'Analyze this contract and provide a detailed review of terms, risks, and recommendations.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['contractContent'],
  maxInputLength: 200_000,
};
export const expectedFormat = `\n- **Contract Overview**\n- **Key Terms Summary**\n- **Risk Analysis**\n- **Missing/Problematic Clauses**\n- **Recommendations**\n- **Plain-Language Summary**\n`;
