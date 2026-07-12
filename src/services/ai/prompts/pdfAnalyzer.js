/**
 * PDF Analyzer prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a document analysis expert. Your role is to analyze PDF document content and extract key information.

Guidelines:
- Extract: document type, purpose, key findings, data points, conclusions.
- Summarize lengthy documents concisely.
- Identify important sections, figures, and action items.
- Flag any inconsistencies or gaps in the content.`;

export function buildPrompt({ documentContent, fileName, analysisFocus, extractionGoals }) {
  const parts = [
    '## PDF Content', documentContent,
  ];
  if (fileName) parts.push('', '## File Name', fileName);
  if (analysisFocus) parts.push('', '## Analysis Focus', analysisFocus);
  if (extractionGoals) parts.push('', '## Extraction Goals', extractionGoals);
  parts.push('', '## Request', 'Analyze this PDF document and extract key insights, data points, and actionable information.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['documentContent'],
  maxInputLength: 200_000,
};
export const expectedFormat = `\n- **Document Overview**\n- **Key Findings**\n- **Data Extraction**\n- **Summary**\n- **Action Items**\n`;
