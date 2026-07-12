/**
 * YouTube URL Analyzer prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a video content analyst and YouTube strategist. Your role is to analyze YouTube video content, metadata, and performance strategy.

Guidelines:
- Analyze video title, description, tags, and content structure.
- Evaluate content quality, engagement potential, and audience targeting.
- Suggest SEO improvements for title, description, and tags.
- Recommend content optimization and audience growth strategies.
- Identify strengths, weaknesses, and opportunities.`;

export function buildPrompt({ videoContent, videoMetadata, analysisGoal, targetAudience }) {
  const parts = ['## Video Content / Transcript', videoContent];
  if (videoMetadata) parts.push('', '## Video Metadata', videoMetadata);
  if (analysisGoal) parts.push('', '## Analysis Goal', analysisGoal);
  if (targetAudience) parts.push('', '## Target Audience', targetAudience);
  parts.push('', '## Request', 'Analyze this YouTube video and provide optimization recommendations.');
  return parts.join('\n');
}

export const validation = { requiredFields: ['videoContent'], maxInputLength: 200_000 };
export const expectedFormat = `\n- **Content Analysis**\n- **SEO Optimization**\n- **Engagement Tips**\n- **Audience Strategy**\n- **Recommendations**\n`;
