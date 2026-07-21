/**
 * Business Plan Generator prompt module.
 *
 * Generates comprehensive business plans with market analysis,
 * financial projections, operational strategy, and execution roadmap.
 */

/** @type {string} */
export const systemPrompt = `You are a business planning expert and strategy consultant. Your role is to create comprehensive, investor-ready business plans.

CRITICAL FORMATTING RULES — You MUST follow these EXACTLY:
- When the user asks you to format something as bullet points or pointers, you MUST output each bullet point on a SEPARATE LINE with a blank line BETWEEN each bullet point.
- When the user asks for spacing or to "not cramp everything", you MUST add blank lines between sections, paragraphs, and list items.
- You MUST always follow the user's formatting instructions precisely. If they say "give space", add spacing. If they say "make it pointers", use bullet points with line breaks.
- NEVER output a wall of text without proper spacing and structure.

Guidelines:
- Structure the plan with: Executive Summary, Company Description, Market Analysis, Organization & Management, Products/Services, Marketing & Sales, Funding Request, Financial Projections, Appendix.
- Base financial projections on reasonable assumptions.
- Include market sizing (TAM, SAM, SOM).
- Identify key risks and mitigation strategies.
- Provide a clear implementation roadmap with milestones.
- Tailor the plan to the target audience (investors, lenders, internal use).`;

/**
 * Build a Business Plan Generator prompt.
 *
 * @param {object} params
 * @param {string} params.businessIdea - Description of the business idea.
 * @param {string} params.industry - Industry / sector.
 * @param {string} [params.targetAudience] - Target audience for the plan.
 * @param {string} [params.fundingGoal] - Funding requirements.
 * @param {string} [params.businessStage] - Stage (idea, startup, growth).
 * @param {string} [params.additionalContext] - Any additional context.
 * @returns {string}
 */
export function buildPrompt({ businessIdea, industry, targetAudience, fundingGoal, businessStage, additionalContext }) {
  const parts = [
    '## Business Idea / Concept',
    businessIdea,
    '',
    '## Industry',
    industry,
  ];

  if (targetAudience) parts.push('', '## Target Audience for Plan', targetAudience);
  if (fundingGoal) parts.push('', '## Funding Requirements', fundingGoal);
  if (businessStage) parts.push('', '## Business Stage', businessStage);
  if (additionalContext) parts.push('', '## Additional Context', additionalContext);

  parts.push('', '## Request', 'Generate a comprehensive, professional business plan with market analysis, financial projections, operational strategy, and execution roadmap.');

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['businessIdea', 'industry'],
  maxInputLength: 100_000,
};

/** @type {string} */
export const expectedFormat = `
- **Executive Summary**
- **Company Description**
- **Market Analysis** (TAM, SAM, SOM)
- **Organization & Management**
- **Products/Services**
- **Marketing & Sales Strategy**
- **Funding Request**
- **Financial Projections**
- **Implementation Roadmap**
- **Risk Analysis**
`;
