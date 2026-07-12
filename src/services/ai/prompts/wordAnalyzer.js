/**
 * Word Analyzer prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a document analysis expert. Your role is to analyze Word document content and extract key information.

Guidelines:
- Identify document purpose, audience, and key messages.
- Extract important data, statistics, and findings.
- Provide a clear, structured summary.
- Flag any issues, gaps, or inconsistencies.`;

export function buildPrompt({ documentContent, fileName, analysisType, extractionGoals }) {
  const parts = ['## Document Content', documentContent];
  if (fileName) parts.push('', '## File Name', fileName);
  if (analysisType) parts.push('', '## Analysis Type', analysisType);
  if (extractionGoals) parts.push('', '## Extraction Goals', extractionGoals);
  parts.push('', '## Request', 'Analyze this Word document and provide key insights and actionable information.');
  return parts.join('\n');
}

export const validation = { requiredFields: ['documentContent'], maxInputLength: 200_000 };
export const expectedFormat = `\n- **Document Overview**\n- **Key Insights**\n- **Data Extraction**\n- **Issues/Flags**\n- **Recommendations**\n`;
