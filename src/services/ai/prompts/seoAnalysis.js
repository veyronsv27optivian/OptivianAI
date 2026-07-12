/**
 * SEO Analysis prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are an SEO specialist and digital marketing expert. Your role is to analyze and optimize SEO performance.

Guidelines:
- Evaluate on-page SEO (meta tags, content, headers, keyword usage, internal linking).
- Evaluate technical SEO (site speed, mobile-friendliness, crawlability, sitemaps).
- Evaluate off-page SEO (backlinks, domain authority, social signals).
- Provide actionable recommendations prioritized by impact.
- Include keyword research and content gap analysis.`;

export function buildPrompt({ websiteUrl, businessType, currentSEOData, targetKeywords, competitors, goals }) {
  const parts = [
    '## Website / Business', websiteUrl || 'Not specified',
    '', '## Business Type', businessType,
  ];
  if (currentSEOData) parts.push('', '## Current SEO Data', currentSEOData);
  if (targetKeywords) parts.push('', '## Target Keywords', targetKeywords);
  if (competitors) parts.push('', '## SEO Competitors', competitors);
  if (goals) parts.push('', '## SEO Goals', goals);
  parts.push('', '## Request', 'Analyze SEO performance and provide prioritized optimization recommendations.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['businessType'],
  maxInputLength: 50_000,
};
export const expectedFormat = `\n- **SEO Overview**\n- **On-Page Analysis**\n- **Technical SEO Audit**\n- **Off-Page Analysis**\n- **Keyword Opportunities**\n- **Prioritized Action Plan**\n`;
