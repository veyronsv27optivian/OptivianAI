/**
 * Launch Readiness prompt module.
 *
 * Evaluates a product or service launch readiness across multiple
 * dimensions and provides a readiness score with improvement areas.
 */

/** @type {string} */
export const systemPrompt = `You are a launch readiness expert and project manager. Your role is to evaluate how prepared a product or service is for launch across multiple dimensions.

Evaluation dimensions:
1. Product Readiness – Is the product complete and tested?
2. Market Readiness – Is the market prepared?
3. Operational Readiness – Are processes, support, and infrastructure ready?
4. Financial Readiness – Is the budget and pricing in place?
5. Legal/Compliance Readiness – Are regulations and legal requirements met?
6. Team Readiness – Is the team trained and prepared?
7. Marketing Readiness – Are campaigns and materials ready?

For each dimension, provide a score (0-100), a status (Red/Yellow/Green), and specific action items to improve readiness.`;

/**
 * Build a Launch Readiness prompt.
 *
 * @param {object} params
 * @param {string} params.productDescription - Product or service to launch.
 * @param {string} params.targetLaunchDate - Planned launch date.
 * @param {string} [params.checklist] - Current launch checklist / status.
 * @param {string} [params.teamSize] - Size of the launch team.
 * @param {string} [params.budget] - Launch budget.
 * @returns {string}
 */
export function buildPrompt({ productDescription, targetLaunchDate, checklist, teamSize, budget }) {
  const parts = [
    '## Product / Service',
    productDescription,
    '',
    '## Target Launch Date',
    targetLaunchDate,
  ];

  if (checklist) parts.push('', '## Current Launch Checklist', checklist);
  if (teamSize) parts.push('', '## Team Size', teamSize);
  if (budget) parts.push('', '## Budget', budget);

  parts.push('', '## Request', 'Evaluate launch readiness across all dimensions. Provide scores, status, and specific action items to improve readiness before launch.');

  // Append JSON output instruction
  parts.push('',
    '## Output Format',
    'After your analysis, include a structured JSON block with EXACTLY this format (use these exact markers):',
    '<!-- AI_JSON_START -->',
    JSON.stringify({
      overallScore: 72,
      status: 'Yellow',
      dimensions: [
        { name: 'Product', score: 80, status: 'Green', actionItems: ['Finish testing', 'Fix bugs'] },
        { name: 'Market', score: 65, status: 'Yellow', actionItems: ['Finalize messaging'] },
      ],
      criticalGaps: ['Missing compliance approval', 'Team not fully trained'],
    }),
    '<!-- AI_JSON_END -->',
  );

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['productDescription', 'targetLaunchDate'],
  maxInputLength: 50_000,
};

/** @type {string} */
export const expectedFormat = `
- **Overall Readiness Score** (0-100)
- **Dimension Scores** (7 dimensions, each with score, status, action items)
- **Critical Gaps** (must-fix items before launch)
- **Launch Timeline Recommendations**
- **Risk Assessment**
`;
