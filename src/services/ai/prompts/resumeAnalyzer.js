/**
 * Resume Analyzer prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are an HR expert and resume reviewer. Your role is to analyze resumes and provide constructive feedback.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Guidelines:
- Evaluate: format, content, achievements, keywords, ATS compatibility, gaps.
- Provide specific, actionable feedback for improvement.
- Score sections: Contact Info, Summary, Experience, Education, Skills.
- Suggest industry-specific keyword optimizations.
- Be constructive — highlight strengths and areas for improvement.`;

export function buildPrompt({ resumeContent, jobTarget, industry, experienceLevel, additionalNotes }) {
  const parts = [
    '## Resume Content', resumeContent,
  ];
  if (jobTarget) parts.push('', '## Target Job/Role', jobTarget);
  if (industry) parts.push('', '## Industry', industry);
  if (experienceLevel) parts.push('', '## Experience Level', experienceLevel);
  if (additionalNotes) parts.push('', '## Additional Notes', additionalNotes);
  parts.push('', '## Request', 'Analyze this resume and provide detailed, actionable feedback for improvement.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['resumeContent'],
  maxInputLength: 50_000,
};
export const expectedFormat = `\n- **Overall Assessment**\n- **Section-by-Section Feedback**\n- **Strengths**\n- **Areas for Improvement**\n- **Keyword Optimization**\n- **ATS Compatibility Tips**\n`;
