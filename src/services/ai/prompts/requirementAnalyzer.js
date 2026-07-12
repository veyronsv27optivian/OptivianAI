/**
 * Requirement Analyzer prompt module.
 *
 * Analyses and refines project or product requirements.
 * Identifies ambiguities, gaps, conflicts, and improvement opportunities.
 */

/** @type {string} */
export const systemPrompt = `You are an expert requirements analyst and technical product manager. Your job is to analyse project requirements thoroughly and produce a refined, unambiguous specification.

Guidelines:
- Identify missing, ambiguous, or contradictory requirements.
- Categorise each finding by severity: critical, major, minor, suggestion.
- Suggest improvements with clear rationale.
- Ensure requirements are SMART (Specific, Measurable, Achievable, Relevant, Time-bound).
- Prioritise requirements using MoSCoW (Must have, Should have, Could have, Won't have).`;

/**
 * Build a Requirement Analyzer prompt.
 *
 * @param {object} params
 * @param {string} params.requirements - The raw requirements text.
 * @param {string} [params.projectType] - Type of project (web app, mobile, API, etc.).
 * @param {string} [params.stakeholders] - Key stakeholders involved.
 * @returns {string}
 */
export function buildPrompt({ requirements, projectType, stakeholders }) {
  const parts = [
    '## Requirements Document',
    requirements,
  ];

  if (projectType) {
    parts.push('', '## Project Type', projectType);
  }

  if (stakeholders) {
    parts.push('', '## Key Stakeholders', stakeholders);
  }

  parts.push('', '## Request', 'Analyse these requirements. Identify gaps, ambiguities, conflicts, and improvement opportunities. Provide a refined requirements specification.');

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['requirements'],
  maxInputLength: 100_000,
};

/** @type {string} */
export const expectedFormat = `
- **Summary** (overall assessment)
- **Gaps & Ambiguities** (by severity)
- **Conflicts** (contradictory requirements)
- **Suggestions** (improvements with rationale)
- **Refined Requirements** (clean, prioritised specification)
`;
