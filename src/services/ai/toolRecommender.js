/**
 * Tool Recommender — AI-powered specialist tool suggestion engine.
 *
 * Takes a user's description of what they want to do and recommends
 * the best AI tool(s) for the job. Uses keyword matching for instant
 * results and AI analysis for complex or ambiguous queries.
 */

import { AI_TOOL_TYPES } from './config';

// ─── Tool definitions with keywords and descriptions ──────────────

const TOOL_PROFILES = [
  {
    type: AI_TOOL_TYPES.BUSINESS_ADVISOR,
    label: 'Business Advisor',
    description: 'Get strategic business advice, recommendations, and actionable insights for your challenges',
    keywords: ['business', 'strategy', 'advice', 'consult', 'growth', 'improve', 'revenue', 'profit', 'challenge', 'problem', 'solution', 'suggestion', 'recommendation', 'execute', 'execute', 'scale', 'optimize', 'pivot'],
    category: 'Advisory & Strategy',
  },
  {
    type: AI_TOOL_TYPES.STRATEGY_REPORT,
    label: 'SWOT Analysis',
    description: 'Analyze strengths, weaknesses, opportunities, and threats for any business or project',
    keywords: ['swot', 'strength', 'weakness', 'opportunity', 'threat', 'position', 'competitive', 'advantage', 'disadvantage', 'internal', 'external'],
    category: 'Advisory & Strategy',
  },
  {
    type: AI_TOOL_TYPES.DECISION_SIMULATION,
    label: 'Decision Simulator',
    description: 'Simulate outcomes of business decisions before you make them',
    keywords: ['decision', 'simulate', 'scenario', 'what if', 'outcome', 'compare', 'option', 'tradeoff', 'trade-off', 'risk vs', 'choose', 'choice', 'consequence'],
    category: 'Advisory & Strategy',
  },
  {
    type: AI_TOOL_TYPES.LAUNCH_READINESS,
    label: 'Launch Readiness',
    description: 'Evaluate how ready your product, service, or project is for launch',
    keywords: ['launch', 'readiness', 'go live', 'release', 'ship', 'product launch', 'deploy', 'rollout', 'ready', 'prepare', 'countdown'],
    category: 'Advisory & Strategy',
  },
  {
    type: AI_TOOL_TYPES.RISK_DETECTION,
    label: 'Risk Assessment',
    description: 'Identify, assess, and prioritize risks in your projects and business',
    keywords: ['risk', 'danger', 'threat', 'vulnerability', 'safety', 'hazard', 'uncertainty', 'mitigate', 'prevent', 'worst case', 'exposure', 'issue'],
    category: 'Advisory & Strategy',
  },
  {
    type: AI_TOOL_TYPES.REQUIREMENT_ANALYZER,
    label: 'Requirement Analyzer',
    description: 'Analyze, refine, and validate project requirements and specifications',
    keywords: ['requirement', 'specification', 'spec', 'scope', 'project requirement', 'functional', 'technical spec', 'user story', 'acceptance', 'document requirement'],
    category: 'Analysis & Research',
  },
  {
    type: AI_TOOL_TYPES.COMPETITIVE_ANALYSIS,
    label: 'Competitor Analysis',
    description: 'Analyze your competitive landscape, competitors, and market positioning',
    keywords: ['competitor', 'competition', 'competitive', 'rival', 'market landscape', 'industry analysis', 'benchmark', 'market share', 'differentiate', 'positioning', 'competitive advantage'],
    category: 'Analysis & Research',
  },
  {
    type: AI_TOOL_TYPES.MARKET_RESEARCH,
    label: 'Market Research',
    description: 'Research market trends, opportunities, and customer segments',
    keywords: ['market research', 'market size', 'market trend', 'industry trend', 'market opportunity', 'target market', 'demographic', 'market analysis', 'TAM', 'SAM', 'SOM', 'market segment'],
    category: 'Analysis & Research',
  },
  {
    type: AI_TOOL_TYPES.PRODUCT_ANALYZER,
    label: 'Product Analyzer',
    description: 'Analyze product-market fit, features, and user experience',
    keywords: ['product', 'product market fit', 'feature', 'ux', 'user experience', 'product review', 'product strategy', 'roadmap', 'backlog', 'product improvement', 'pmf'],
    category: 'Analysis & Research',
  },
  {
    type: AI_TOOL_TYPES.SOCIAL_ANALYSIS,
    label: 'Social Media Analysis',
    description: 'Analyze social media presence, engagement, and content strategy',
    keywords: ['social media', 'instagram', 'twitter', 'linkedin', 'facebook', 'tiktok', 'social', 'engagement', 'follower', 'post', 'content strategy', 'social presence', 'hashtag'],
    category: 'Analysis & Research',
  },
  {
    type: AI_TOOL_TYPES.SEO_ANALYSIS,
    label: 'SEO Analysis',
    description: 'Analyze and optimize your website SEO performance',
    keywords: ['seo', 'search engine', 'ranking', 'keyword', 'google search', 'organic', 'traffic', 'backlink', 'meta', 'on page', 'off page', 'search optimization', 'google ranking'],
    category: 'Analysis & Research',
  },
  {
    type: AI_TOOL_TYPES.PERFORMANCE_ANALYSIS,
    label: 'Financial Forecast',
    description: 'Project revenue, expenses, cash flow, and create financial forecasts',
    keywords: ['financial', 'forecast', 'revenue projection', 'cash flow', 'budget', 'expense', 'profit', 'p&l', 'balance sheet', 'financial plan', 'money', 'funding', 'investor', 'unit economics'],
    category: 'Planning & Forecasting',
  },
  {
    type: AI_TOOL_TYPES.BUSINESS_PLAN,
    label: 'Business Plan Generator',
    description: 'Generate comprehensive business plans with financials and strategy',
    keywords: ['business plan', 'plan', 'startup plan', 'business model', 'canvas', 'lean canvas', 'executive summary', 'pitch', 'investor deck', 'fundraising', 'business proposal'],
    category: 'Planning & Forecasting',
  },
  {
    type: AI_TOOL_TYPES.PREDICTIVE_ANALYTICS,
    label: 'Future Lab',
    description: 'Explore future trends, scenarios, and predictive insights for your industry',
    keywords: ['future', 'trend', 'predict', 'forecast', 'scenario', 'emerging', 'next gen', 'innovation', 'disruption', 'foresight', 'future proof', 'whats next', 'upcoming'],
    category: 'Planning & Forecasting',
  },
  {
    type: AI_TOOL_TYPES.STARTUP_VALIDATOR,
    label: 'Startup Validator',
    description: 'Validate your startup idea, business model, and market potential',
    keywords: ['startup', 'validate', 'idea validation', 'mvp', 'minimum viable', 'product idea', 'business idea', 'founder', 'entrepreneur', 'venture', 'investor ready', 'proof of concept'],
    category: 'Planning & Forecasting',
  },
  {
    type: AI_TOOL_TYPES.CONTENT_GENERATION,
    label: 'Marketing Strategy',
    description: 'Develop marketing strategies, campaigns, and growth plans',
    keywords: ['marketing', 'campaign', 'growth', 'acquisition', 'conversion', 'funnel', 'lead generation', 'digital marketing', 'brand awareness', 'go to market', 'gtm', 'promotion', 'advertise'],
    category: 'Business Functions',
  },
  {
    type: AI_TOOL_TYPES.SALES_ADVISOR,
    label: 'Sales Advisor',
    description: 'Get sales strategies, scripts, pipeline management, and closing techniques',
    keywords: ['sales', 'sell', 'pipeline', 'lead', 'prospect', 'closing', 'objection', 'revenue target', 'sales strategy', 'cold email', 'outreach', 'negotiation', 'deal'],
    category: 'Business Functions',
  },
  {
    type: AI_TOOL_TYPES.FINANCIAL_ADVISOR,
    label: 'Financial Advisor',
    description: 'Get financial planning, budgeting, and investment advice',
    keywords: ['finance', 'budget', 'invest', 'saving', 'cost', 'expense tracking', 'financial health', 'money management', 'investment', 'portfolio', 'tax', 'accounting'],
    category: 'Business Functions',
  },
  {
    type: AI_TOOL_TYPES.HR_ADVISOR,
    label: 'HR Advisor',
    description: 'Get HR guidance on hiring, culture, performance, and employee management',
    keywords: ['hr', 'human resource', 'hiring', 'recruit', 'employee', 'culture', 'onboarding', 'performance review', 'payroll', 'benefit', 'policy', 'workplace', 'team building', 'retention', 'attrition'],
    category: 'Business Functions',
  },
  {
    type: AI_TOOL_TYPES.CUSTOMER_PERSONA,
    label: 'Customer Persona',
    description: 'Create detailed customer personas and audience segments',
    keywords: ['persona', 'customer', 'audience', 'buyer', 'user persona', 'demographic', 'target audience', 'customer segment', 'ideal customer', 'icp', 'user profile'],
    category: 'Business Functions',
  },
  {
    type: AI_TOOL_TYPES.BRAND_ANALYSIS,
    label: 'Brand Analysis',
    description: 'Analyze your brand identity, positioning, and messaging',
    keywords: ['brand', 'branding', 'identity', 'positioning', 'messaging', 'logo', 'brand voice', 'brand strategy', 'brand perception', 'brand audit', 'brand equity'],
    category: 'Business Functions',
  },
  {
    type: AI_TOOL_TYPES.EMAIL_GENERATOR,
    label: 'AI Email Generator',
    description: 'Generate professional emails for any business context',
    keywords: ['email', 'write email', 'draft', 'outreach', 'cold email', 'follow up', 'newsletter', 'email campaign', 'professional email', 'business email', 'mail'],
    category: 'Content Creation',
  },
  {
    type: AI_TOOL_TYPES.PROPOSAL_GENERATOR,
    label: 'AI Proposal Generator',
    description: 'Generate professional business proposals and pitches',
    keywords: ['proposal', 'bid', 'quote', 'proposition', 'business proposal', 'project proposal', 'partnership proposal', 'service proposal', 'solution proposal'],
    category: 'Content Creation',
  },
  {
    type: AI_TOOL_TYPES.PRESENTATION_GENERATOR,
    label: 'AI Presentation Generator',
    description: 'Create presentation outlines and slide structures',
    keywords: ['presentation', 'slides', 'slide deck', 'powerpoint', 'keynote', 'pitch deck', 'presentation outline', 'talk', 'speech', 'demo', 'present'],
    category: 'Content Creation',
  },
  {
    type: AI_TOOL_TYPES.PITCH_DECK_ASSISTANT,
    label: 'Pitch Deck Assistant',
    description: 'Create and refine investor pitch decks',
    keywords: ['pitch deck', 'investor pitch', 'fundraising deck', 'seed round', 'series a', 'pitch presentation', 'startup pitch', 'investor presentation'],
    category: 'Content Creation',
  },
  {
    type: AI_TOOL_TYPES.REPORT_GENERATION,
    label: 'Report Generator',
    description: 'Auto-generate structured reports with data and insights',
    keywords: ['report', 'generate report', 'summary', 'executive report', 'weekly report', 'monthly report', 'status report', 'analytics report', 'business report', 'reporting'],
    category: 'Content Creation',
  },
  {
    type: AI_TOOL_TYPES.AI_BRAINSTORM,
    label: 'AI Brainstorm',
    description: 'Brainstorm ideas, solutions, and creative concepts',
    keywords: ['brainstorm', 'idea', 'creative', 'innovation', 'think', 'suggestion', 'possibility', 'generate ideas', 'mind map', 'concept', 'inspiration', 'ideate'],
    category: 'Content Creation',
  },
  {
    type: AI_TOOL_TYPES.MEETING_NOTES,
    label: 'Meeting Notes',
    description: 'Summarize meetings with action items and key takeaways',
    keywords: ['meeting', 'meeting notes', 'minutes', 'transcript', 'summary', 'action item', 'meeting summary', 'meeting recap', 'notes', 'agenda', 'follow up meeting'],
    category: 'Content Creation',
  },
  {
    type: AI_TOOL_TYPES.DATA_EXTRACTION,
    label: 'Document Analyzer',
    description: 'Extract key insights and structured data from any document',
    keywords: ['document', 'extract', 'analyze document', 'read document', 'text analysis', 'content extraction', 'document review', 'document summary'],
    category: 'Document & File Analysis',
  },
  {
    type: AI_TOOL_TYPES.RESUME_ANALYZER,
    label: 'Resume Analyzer',
    description: 'Analyze resumes and provide detailed feedback for improvement',
    keywords: ['resume', 'cv', 'curriculum vitae', 'job application', 'career', 'candidate review', 'hire', 'recruitment screening', 'ats', 'applicant'],
    category: 'Document & File Analysis',
  },
  {
    type: AI_TOOL_TYPES.CONTRACT_ANALYZER,
    label: 'Contract Analyzer',
    description: 'Analyze contracts for risky clauses, terms, and compliance issues',
    keywords: ['contract', 'agreement', 'legal', 'terms', 'clause', 'nda', 'service agreement', 'license', 'compliance', 'regulatory', 'legal review', 'obligation'],
    category: 'Document & File Analysis',
  },
  {
    type: AI_TOOL_TYPES.PDF_ANALYZER,
    label: 'PDF Analyzer',
    description: 'Upload and analyze PDF documents for key information',
    keywords: ['pdf', 'upload pdf', 'pdf analysis', 'scan pdf', 'read pdf', 'pdf document', 'extract pdf', 'pdf content', 'convert pdf'],
    category: 'Document & File Analysis',
  },
  {
    type: AI_TOOL_TYPES.WORD_ANALYZER,
    label: 'Word Analyzer',
    description: 'Upload and analyze Word document content',
    keywords: ['word', 'docx', 'word document', 'upload word', 'doc analysis', 'word file', 'microsoft word', 'document upload'],
    category: 'Document & File Analysis',
  },
  {
    type: AI_TOOL_TYPES.EXCEL_ANALYZER,
    label: 'Excel Analyzer',
    description: 'Upload and analyze Excel spreadsheet data',
    keywords: ['excel', 'xlsx', 'spreadsheet', 'upload excel', 'sheet', 'data analysis', 'excel file', 'tabular data', 'csv', 'workbook'],
    category: 'Document & File Analysis',
  },
  {
    type: AI_TOOL_TYPES.CSV_ANALYZER,
    label: 'CSV Analyzer',
    description: 'Upload and analyze CSV data files',
    keywords: ['csv', 'upload csv', 'csv data', 'comma separated', 'data file', 'csv analysis', 'tabular', 'dataset'],
    category: 'Document & File Analysis',
  },
  {
    type: AI_TOOL_TYPES.POWERPOINT_ANALYZER,
    label: 'PowerPoint Analyzer',
    description: 'Upload and analyze PowerPoint presentation content',
    keywords: ['powerpoint', 'pptx', 'upload ppt', 'presentation analysis', 'slide analysis', 'ppt', 'powerpoint file', 'slide deck review'],
    category: 'Document & File Analysis',
  },
  {
    type: AI_TOOL_TYPES.WEBSITE_ANALYZER,
    label: 'Website Analyzer',
    description: 'Enter a URL and analyze website content, structure, and SEO',
    keywords: ['website', 'url', 'webpage', 'site', 'web', 'website analysis', 'site audit', 'web analysis', 'online presence', 'domain', 'landing page', 'webpage review'],
    category: 'Web & Media Analysis',
  },
  {
    type: AI_TOOL_TYPES.YOUTUBE_ANALYZER,
    label: 'YouTube Analyzer',
    description: 'Enter a YouTube URL to analyze video content and metadata',
    keywords: ['youtube', 'video', 'youtube video', 'channel', 'youtube analysis', 'video analysis', 'youtube url', 'content creator', 'youtuber', 'video content'],
    category: 'Web & Media Analysis',
  },
  {
    type: AI_TOOL_TYPES.CUSTOM_ASSISTANT,
    label: 'Custom Assistant',
    description: 'Create a custom AI assistant with specific instructions for any task',
    keywords: ['custom', 'assistant', 'custom ai', 'personal assistant', 'customize', 'specific task', 'tailored', 'specialized', 'custom prompt', 'configure'],
    category: 'Web & Media Analysis',
  },
];

// ─── Keyword-based matching (instant, no AI cost) ────────────────

function keywordMatch(query) {
  const q = query.toLowerCase();

  // Score each tool based on keyword matches
  const scored = TOOL_PROFILES.map(tool => {
    let score = 0;

    // Check each keyword
    for (const keyword of tool.keywords) {
      if (q.includes(keyword)) {
        score += keyword.length; // Longer keyword matches = higher confidence
      }
    }

    // Bonus for matching category
    const categoryWords = tool.category.toLowerCase().split(/[&\s]+/);
    for (const word of categoryWords) {
      if (word.length > 2 && q.includes(word)) {
        score += word.length * 0.5;
      }
    }

    return { ...tool, score };
  });

  // Filter out zero scores and sort by score descending
  const results = scored
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score);

  // Return top matches, with confidence indication
  const topScore = results[0]?.score || 0;
  return results.slice(0, 3).map(r => ({
    ...r,
    confidence: topScore > 0 ? Math.min(100, Math.round((r.score / topScore) * 100)) : 0,
  }));
}

// ─── AI-powered recommendation ────────────────────────────────────

function getToolListForPrompt() {
  return TOOL_PROFILES.map(t =>
    `- "${t.label}" (${t.category}): ${t.description}`
  ).join('\n');
}

const RECOMMENDER_SYSTEM_PROMPT = `You are a helpful AI assistant that recommends the best tool from a list of AI specialists.

Based on what the user wants to do, recommend 1-3 tools that would be most helpful.

Rules:
- Recommend only from the tool list below.
- Return a JSON array of objects with: { "type": "...", "reason": "..." }
- The "type" must be exactly one of the tool types listed.
- The "reason" should be 1-2 sentences explaining why this tool fits.
- If nothing matches well, return an empty array.
- Be concise and accurate.

Available tools:
`;

/**
 * Get AI-powered tool recommendations for a user query.
 *
 * Uses keyword matching for instant results. If keyword confidence
 * is low, falls back to AI analysis for better accuracy.
 *
 * @param {string} query - What the user wants to do.
 * @param {boolean} [useAi=true] - Whether to allow AI-powered matching.
 * @returns {Promise<Array<{type: string, label: string, description: string, category: string, reason: string, confidence: number}>>}
 */
export async function getToolRecommendations(query, useAi = true) {
  if (!query?.trim()) return [];

  // 1. Try keyword matching first (instant)
  const keywordResults = keywordMatch(query);
  const hasStrongMatch = keywordResults.length > 0 && keywordResults[0].confidence >= 70;

  // If keyword match is strong enough and not using AI, return immediately
  if (!useAi || hasStrongMatch) {
    return keywordResults.map(r => ({
      type: r.type,
      label: r.label,
      description: r.description,
      category: r.category,
      reason: 'Matches what you described based on your keywords.',
      confidence: r.confidence,
    }));
  }

  // 2. AI-powered matching for complex/ambiguous queries
  try {
    const { generateText } = await import('./aiService');
    const result = await generateText(
      'custom_assistant',
      `User query: "${query}"\n\nWhich tool(s) would you recommend and why?`,
      {
        systemPrompt: RECOMMENDER_SYSTEM_PROMPT + getToolListForPrompt(),
        temperature: 0.3,
        maxTokens: 500,
        useCache: true,
        skipLogging: true,
      }
    );

    const aiResults = parseAiResponse(result.text);

    if (aiResults.length > 0) {
      // Merge AI results with tool profiles to get labels, descriptions, etc.
      return aiResults.map(ai => {
        const profile = TOOL_PROFILES.find(p => p.type === ai.type);
        return {
          type: ai.type,
          label: profile?.label || ai.type,
          description: profile?.description || '',
          category: profile?.category || '',
          reason: ai.reason || 'Recommended based on your description.',
          confidence: 100,
        };
      });
    }
  } catch {
    // AI failed, fall back to keyword results
  }

  // 3. Fallback: return keyword results (even if weak)
  return keywordResults.map(r => ({
    type: r.type,
    label: r.label,
    description: r.description,
    category: r.category,
    reason: 'Matches what you described.',
    confidence: r.confidence,
  }));
}

/**
 * Parse AI response to extract tool recommendations.
 */
function parseAiResponse(text) {
  try {
    // Try direct JSON parse
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;

    // Try finding JSON in the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Not valid JSON, try line-by-line parsing
    const lines = text.split('\n').filter(l => l.includes('"type"'));
    return lines.map(line => {
      const typeMatch = line.match(/"type":\s*"([^"]+)"/);
      const reasonMatch = line.match(/"reason":\s*"([^"]+)"/);
      return typeMatch ? { type: typeMatch[1], reason: reasonMatch?.[1] || '' } : null;
    }).filter(Boolean);
  }
  return [];
}

/**
 * Get all tool profiles (for UI use).
 */
export function getAllToolProfiles() {
  return TOOL_PROFILES;
}

/**
 * Get a tool profile by type.
 */
export function getToolProfile(type) {
  return TOOL_PROFILES.find(t => t.type === type) || null;
}
