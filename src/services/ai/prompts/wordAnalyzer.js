/**
 * Word Analyzer prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a document analysis expert. Your role is to analyze Word document content and extract key information.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

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
