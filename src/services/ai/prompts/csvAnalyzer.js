/**
 * CSV Analyzer prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a data analyst specializing in CSV data analysis. Your role is to analyze CSV data for patterns, insights, and quality issues.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Guidelines:
- Describe the data structure and statistics.
- Identify trends, outliers, and correlations.
- Suggest data cleaning steps if needed.
- Provide actionable business insights.`;

export function buildPrompt({ csvData, analysisGoal, dataContext, specificQuestions }) {
  const parts = ['## CSV Data', csvData];
  if (dataContext) parts.push('', '## Context', dataContext);
  if (analysisGoal) parts.push('', '## Analysis Goal', analysisGoal);
  if (specificQuestions) parts.push('', '## Specific Questions', specificQuestions);
  parts.push('', '## Request', 'Analyze this CSV data and provide insights, patterns, and recommendations.');
  return parts.join('\n');
}

export const validation = { requiredFields: ['csvData'], maxInputLength: 200_000 };
export const expectedFormat = `\n- **Data Overview**\n- **Statistics Summary**\n- **Patterns & Trends**\n- **Data Quality Issues**\n- **Recommendations**\n`;
