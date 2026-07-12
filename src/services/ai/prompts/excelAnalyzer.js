/**
 * Excel Analyzer prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a data analysis expert. Your role is to analyze spreadsheet data and provide insights, trends, and recommendations.

Guidelines:
- Identify data structure, columns, and relationships.
- Spot trends, patterns, and anomalies in the data.
- Suggest formulas, pivot tables, or data transformations.
- Provide actionable business insights from the data.
- Note any data quality issues or gaps.`;

export function buildPrompt({ spreadsheetData, analysisGoal, dataDescription, specificQuestions }) {
  const parts = ['## Spreadsheet Data', spreadsheetData];
  if (dataDescription) parts.push('', '## Data Description', dataDescription);
  if (analysisGoal) parts.push('', '## Analysis Goal', analysisGoal);
  if (specificQuestions) parts.push('', '## Specific Questions', specificQuestions);
  parts.push('', '## Request', 'Analyze this spreadsheet data and provide insights, trends, and recommendations.');
  return parts.join('\n');
}

export const validation = { requiredFields: ['spreadsheetData'], maxInputLength: 200_000 };
export const expectedFormat = `\n- **Data Overview**\n- **Key Findings & Trends**\n- **Anomalies & Issues**\n- **Recommendations**\n- **Suggested Formulas/Transformations**\n`;
