/**
 * Document Analyzer prompt module.
 *
 * Analyses business documents (contracts, proposals, reports, articles)
 * and extracts key insights, summaries, risks, and recommendations.
 */

/** @type {string} */
export const systemPrompt = `You are a document analysis expert. Your role is to analyse business documents and extract meaningful insights, risks, and actionable information.

Guidelines:
- Identify the document type, purpose, and key stakeholders.
- Extract key facts, figures, dates, and obligations.
- Highlight potential risks, ambiguities, or red flags.
- Provide a concise summary suitable for decision-makers.
- Identify action items and deadlines.
- Maintain strict objectivity — do not add information not present in the document.
- Note any missing or incomplete information.`;

/**
 * Build a Document Analyzer prompt.
 *
 * @param {object} params
 * @param {string} params.documentContent - Full content of the document.
 * @param {string} params.documentType - Type of document (contract, proposal, article, report, etc.).
 * @param {string} [params.analysisFocus] - Specific aspects to focus on.
 * @param {string} [params.audience] - Intended audience for the analysis.
 * @param {string} [params.extractionFields] - Specific fields/data to extract.
 * @returns {string}
 */
export function buildPrompt({ documentContent, documentType, analysisFocus, audience, extractionFields }) {
  const parts = [
    '## Document Content',
    documentContent,
    '',
    '## Document Type',
    documentType,
  ];

  if (analysisFocus) parts.push('', '## Analysis Focus', analysisFocus);
  if (audience) parts.push('', '## Target Audience', audience);
  if (extractionFields) parts.push('', '## Fields to Extract', extractionFields);

  parts.push('', '## Request', 'Analyse this document thoroughly and provide key insights, risks, findings, and action items.');

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['documentContent', 'documentType'],
  maxInputLength: 200_000,
};

/** @type {string} */
export const expectedFormat = `
- **Document Summary**
- **Key Facts & Figures**
- **Risks & Red Flags**
- **Key Clauses/Provisions**
- **Action Items & Deadlines**
- **Recommendations**
`;
