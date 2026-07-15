/**
 * Centralized AI configuration.
 *
 * All provider metadata, environment variable mappings, model names, and the
 * tool registry live here.  Adding a new AI tool requires only a new entry in
 * AI_TOOL_REGISTRY + a system prompt stored with the feature.
 */

// ─── Provider identifiers ────────────────────────────────────────

/** @enum {string} */
export const AI_PROVIDERS = {
  GEMINI: 'gemini',
  DEEPSEEK: 'deepseek',
  QWEN: 'qwen',
  OPENAI_VIA_OPENROUTER: 'openai',
};

// ─── Tool (feature) types ────────────────────────────────────────
// Each future AI tool registers a key here so the registry stays in one place.

/** @enum {string} */
export const AI_TOOL_TYPES = {
  BUSINESS_ADVISOR: 'business_advisor',
  REQUIREMENT_ANALYZER: 'requirement_analyzer',
  DECISION_SIMULATION: 'decision_simulation',
  RISK_DETECTION: 'risk_detection',
  LAUNCH_READINESS: 'launch_readiness',
  SOCIAL_ANALYSIS: 'social_analysis',
  COMPETITIVE_ANALYSIS: 'competitive_analysis',
  REPORT_GENERATION: 'report_generation',
  // ── New tools ──────────────────────────────────────────────
  BUSINESS_PLAN: 'business_plan',
  SALES_ADVISOR: 'sales_advisor',
  FINANCIAL_ADVISOR: 'financial_advisor',
  HR_ADVISOR: 'hr_advisor',
  STARTUP_VALIDATOR: 'startup_validator',
  PRODUCT_ANALYZER: 'product_analyzer',
  CUSTOMER_PERSONA: 'customer_persona',
  BRAND_ANALYSIS: 'brand_analysis',
  SEO_ANALYSIS: 'seo_analysis',
  PROPOSAL_GENERATOR: 'proposal_generator',
  PRESENTATION_GENERATOR: 'presentation_generator',
  EMAIL_GENERATOR: 'email_generator',
  AI_BRAINSTORM: 'ai_brainstorm',
  CUSTOM_ASSISTANT: 'custom_assistant',
  RESUME_ANALYZER: 'resume_analyzer',
  CONTRACT_ANALYZER: 'contract_analyzer',
  PDF_ANALYZER: 'pdf_analyzer',
  WORD_ANALYZER: 'word_analyzer',
  EXCEL_ANALYZER: 'excel_analyzer',
  CSV_ANALYZER: 'csv_analyzer',
  POWERPOINT_ANALYZER: 'powerpoint_analyzer',
  WEBSITE_ANALYZER: 'website_analyzer',
  YOUTUBE_ANALYZER: 'youtube_analyzer',

  // ── Role-Specific AI Assistants (Phase 9B, Items 91-99) ──
  EXECUTIVE_AI: 'executive_ai',
  MANAGER_AI: 'manager_ai',
  EMPLOYEE_AI: 'employee_ai',
  FINANCE_AI: 'finance_ai',
  HR_SPECIFIC_AI: 'hr_specific_ai',
  MARKETING_SPECIFIC_AI: 'marketing_ai',
  SALES_SPECIFIC_AI: 'sales_ai',
  OPERATIONS_AI: 'operations_ai',
  TECHNICAL_AI: 'technical_ai',

  // ── Phase 9C: AI Project Orchestration (Items 101-108) ──
  INTELLIGENT_DELEGATION: 'intelligent_delegation',
  DECISION_SUPPORT: 'decision_support',
  RISK_DETECTION_AI: 'risk_detection_ai',
  EXECUTIVE_INSIGHTS: 'executive_insights',
  ORG_HEALTH_ENGINE: 'org_health_engine',
  CROSS_DEPT_INTELLIGENCE: 'cross_dept_intelligence',

  // ── Phase 9C Extension: Full Orchestration (Items 100, 102, 106) ──
  AI_PROJECT_ORCHESTRATION: 'ai_project_orchestration',
  WORKFLOW_AUTOMATION: 'workflow_automation',
  PREDICTIVE_ANALYTICS_TOOL: 'predictive_analytics_tool',

  // ── Direct / canonical tool type names (used by prompt resolution) ──
  // These are the canonical internal names. The UI in AI.jsx and
  // ToolRecommender uses alias names (STRATEGY_REPORT, PERFORMANCE_ANALYSIS,
  // etc.) that get mapped to these through _resolvePromptModule in aiService.js.
  // This dual-key pattern allows the same tool to be accessed by both its
  // alias (UI-facing) and canonical (internal) name without duplication.
  SWOT_ANALYSIS: 'swot_analysis',               // Alias: STRATEGY_REPORT
  FINANCIAL_FORECAST: 'financial_forecast',      // Alias: PERFORMANCE_ANALYSIS
  FUTURE_LAB: 'future_lab',                      // Alias: PREDICTIVE_ANALYTICS
  MARKETING_STRATEGY: 'marketing_strategy',      // Alias: CONTENT_GENERATION
  MEETING_NOTES: 'meeting_notes',                // Alias: SUMMARIZATION
  DOCUMENT_ANALYZER: 'document_analyzer',         // Alias: DATA_EXTRACTION — generic fallback, prefer specific (pdf, word, excel, csv, ppt)
  PITCH_DECK_ASSISTANT: 'pitch_deck_assistant',
};

// ─── Provider configuration ──────────────────────────────────────
//
// Each provider defines:
//   name             — Display name
//   endpoint         — API endpoint URL
//   envKey           — Primary env var for API key
//   fallbackEnvKey   — Shared fallback env var (VITE_OPENROUTER_API_KEY)
//   envModel         — Env var for model override
//   defaultModel     — Fallback model if env var is not set
//   supportsStreaming — Whether streaming is supported
//   supportsVision   — Whether vision/image analysis is supported
//   isDefault        — Whether this is the default provider
//   priority         — Fallback order (1 = tried first)
//

export const PROVIDER_CONFIGS = {
  [AI_PROVIDERS.GEMINI]: {
    name: 'Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    envKey: 'VITE_GEMINI_API_KEY',
    envModel: 'VITE_GEMINI_MODEL',
    defaultModel: 'gemini-2.0-flash',
    supportsStreaming: true,
    supportsVision: true,
    isDefault: true,
    priority: 1,     // tried first when auto-fallback is active
  },
  [AI_PROVIDERS.DEEPSEEK]: {
    name: 'DeepSeek',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    envKey: 'VITE_DEEPSEEK_API_KEY',
    envModel: 'VITE_DEEPSEEK_MODEL',
    defaultModel: 'deepseek/deepseek-r1:free',
    supportsStreaming: true,
    supportsVision: false,
    isDefault: false,
    priority: 2,     // fallback after Gemini
  },
  [AI_PROVIDERS.QWEN]: {
    name: 'Qwen VL',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    envKey: 'VITE_QWEN_API_KEY',
    envModel: 'VITE_QWEN_MODEL',
    defaultModel: 'qwen/qwen2.5-vl-72b-instruct:free',
    supportsStreaming: true,
    supportsVision: true,
    isDefault: false,
    priority: 3,     // fallback after DeepSeek
  },
  [AI_PROVIDERS.OPENAI_VIA_OPENROUTER]: {
    name: 'OpenAI',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    envKey: 'VITE_OPENROUTER_API_KEY',
    envModel: 'VITE_OPENROUTER_OPENAI_MODEL',
    defaultModel: 'openai/gpt-4o-mini',
    supportsStreaming: true,
    supportsVision: true,
    isDefault: false,
    priority: 4,     // user-chosen via OpenRouter
  },
};

/**
 * Sorted list of providers by priority (ascending).
 * Useful when iterating the fallback chain.
 */
export const PROVIDERS_BY_PRIORITY = Object.values(PROVIDER_CONFIGS)
  .sort((a, b) => a.priority - b.priority);

// ─── Tool registry ───────────────────────────────────────────────
// Every tool defines:
//   id           — matches AI_TOOL_TYPES
//   label        — human-readable name
//   description  — short explanation
//   requiredCapabilities — ['text'] and/or ['vision']
//
// The system prompt for each tool lives in the tool's own module
// (to be built later) and is passed via options.systemPrompt.

/** @type {Object<string, {id: string, label: string, description: string, requiredCapabilities: string[]}>} */
export const AI_TOOL_REGISTRY = {
  [AI_TOOL_TYPES.BUSINESS_ADVISOR]: {
    id: AI_TOOL_TYPES.BUSINESS_ADVISOR,
    label: 'Business Advisor',
    description: 'Strategic business advice and recommendations',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.REQUIREMENT_ANALYZER]: {
    id: AI_TOOL_TYPES.REQUIREMENT_ANALYZER,
    label: 'Requirement Analyzer',
    description: 'Analyze and refine project requirements',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.DECISION_SIMULATION]: {
    id: AI_TOOL_TYPES.DECISION_SIMULATION,
    label: 'Decision Simulation',
    description: 'Simulate business decisions and outcomes',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.RISK_DETECTION]: {
    id: AI_TOOL_TYPES.RISK_DETECTION,
    label: 'Risk Detection',
    description: 'Identify and assess business risks',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.LAUNCH_READINESS]: {
    id: AI_TOOL_TYPES.LAUNCH_READINESS,
    label: 'Launch Readiness',
    description: 'Evaluate launch readiness score',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.SOCIAL_ANALYSIS]: {
    id: AI_TOOL_TYPES.SOCIAL_ANALYSIS,
    label: 'Social Analysis',
    description: 'Analyze social media presence and strategy',
    requiredCapabilities: ['text', 'vision'],
  },
  [AI_TOOL_TYPES.COMPETITIVE_ANALYSIS]: {
    id: AI_TOOL_TYPES.COMPETITIVE_ANALYSIS,
    label: 'Competitive Analysis',
    description: 'Analyze competitive landscape and positioning',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.REPORT_GENERATION]: {
    id: AI_TOOL_TYPES.REPORT_GENERATION,
    label: 'Report Generation',
    description: 'Auto-generate structured reports',
    requiredCapabilities: ['text'],
  },
  // ── New Tool Registrations ─────────────────────────────────
  [AI_TOOL_TYPES.BUSINESS_PLAN]: {
    id: AI_TOOL_TYPES.BUSINESS_PLAN,
    label: 'Business Plan Generator',
    description: 'Generate comprehensive business plans',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.SALES_ADVISOR]: {
    id: AI_TOOL_TYPES.SALES_ADVISOR,
    label: 'Sales Advisor',
    description: 'AI-powered sales strategies and coaching',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.FINANCIAL_ADVISOR]: {
    id: AI_TOOL_TYPES.FINANCIAL_ADVISOR,
    label: 'Financial Advisor',
    description: 'Financial planning and investment advice',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.HR_ADVISOR]: {
    id: AI_TOOL_TYPES.HR_ADVISOR,
    label: 'HR Advisor',
    description: 'HR policies, hiring, and employee management',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.STARTUP_VALIDATOR]: {
    id: AI_TOOL_TYPES.STARTUP_VALIDATOR,
    label: 'Startup Validator',
    description: 'Validate startup ideas and business models',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.PRODUCT_ANALYZER]: {
    id: AI_TOOL_TYPES.PRODUCT_ANALYZER,
    label: 'Product Analyzer',
    description: 'Analyze product-market fit and features',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.CUSTOMER_PERSONA]: {
    id: AI_TOOL_TYPES.CUSTOMER_PERSONA,
    label: 'Customer Persona Generator',
    description: 'Create detailed customer personas',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.BRAND_ANALYSIS]: {
    id: AI_TOOL_TYPES.BRAND_ANALYSIS,
    label: 'Brand Analysis',
    description: 'Analyze brand identity and positioning',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.SEO_ANALYSIS]: {
    id: AI_TOOL_TYPES.SEO_ANALYSIS,
    label: 'SEO Analysis',
    description: 'Analyze and optimize SEO performance',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.PROPOSAL_GENERATOR]: {
    id: AI_TOOL_TYPES.PROPOSAL_GENERATOR,
    label: 'AI Proposal Generator',
    description: 'Generate professional business proposals',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.PRESENTATION_GENERATOR]: {
    id: AI_TOOL_TYPES.PRESENTATION_GENERATOR,
    label: 'AI Presentation Generator',
    description: 'Create compelling presentation outlines',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.EMAIL_GENERATOR]: {
    id: AI_TOOL_TYPES.EMAIL_GENERATOR,
    label: 'AI Email Generator',
    description: 'Generate professional emails for any context',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.AI_BRAINSTORM]: {
    id: AI_TOOL_TYPES.AI_BRAINSTORM,
    label: 'AI Brainstorm',
    description: 'Brainstorm ideas and solutions creatively',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.CUSTOM_ASSISTANT]: {
    id: AI_TOOL_TYPES.CUSTOM_ASSISTANT,
    label: 'AI Custom Assistant',
    description: 'Configure a custom AI assistant for your needs',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.RESUME_ANALYZER]: {
    id: AI_TOOL_TYPES.RESUME_ANALYZER,
    label: 'Resume Analyzer',
    description: 'Analyze resumes and provide feedback',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.CONTRACT_ANALYZER]: {
    id: AI_TOOL_TYPES.CONTRACT_ANALYZER,
    label: 'Contract Analyzer',
    description: 'Analyze contracts for risks and terms',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.PDF_ANALYZER]: {
    id: AI_TOOL_TYPES.PDF_ANALYZER,
    label: 'PDF Analyzer',
    description: 'Extract and analyze PDF content',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.WORD_ANALYZER]: {
    id: AI_TOOL_TYPES.WORD_ANALYZER,
    label: 'Word Analyzer',
    description: 'Analyze Word document content',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.EXCEL_ANALYZER]: {
    id: AI_TOOL_TYPES.EXCEL_ANALYZER,
    label: 'Excel Analyzer',
    description: 'Analyze spreadsheet data and formulas',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.CSV_ANALYZER]: {
    id: AI_TOOL_TYPES.CSV_ANALYZER,
    label: 'CSV Analyzer',
    description: 'Analyze CSV data for insights',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.POWERPOINT_ANALYZER]: {
    id: AI_TOOL_TYPES.POWERPOINT_ANALYZER,
    label: 'PowerPoint Analyzer',
    description: 'Analyze PowerPoint presentation content',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.WEBSITE_ANALYZER]: {
    id: AI_TOOL_TYPES.WEBSITE_ANALYZER,
    label: 'Website Analyzer',
    description: 'Analyze website content and structure',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.YOUTUBE_ANALYZER]: {
    id: AI_TOOL_TYPES.YOUTUBE_ANALYZER,
    label: 'YouTube URL Analyzer',
    description: 'Analyze YouTube video content and metadata',
    requiredCapabilities: ['text'],
  },

  // ── Direct / canonical tool type entries ───────────────────
  [AI_TOOL_TYPES.SWOT_ANALYSIS]: {
    id: AI_TOOL_TYPES.SWOT_ANALYSIS,
    label: 'SWOT Analysis',
    description: 'Analyze strengths, weaknesses, opportunities, and threats',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.FINANCIAL_FORECAST]: {
    id: AI_TOOL_TYPES.FINANCIAL_FORECAST,
    label: 'Financial Forecast',
    description: 'Project revenue, expenses, and cash flow',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.FUTURE_LAB]: {
    id: AI_TOOL_TYPES.FUTURE_LAB,
    label: 'Future Lab',
    description: 'Explore future trends and scenarios',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.MARKETING_STRATEGY]: {
    id: AI_TOOL_TYPES.MARKETING_STRATEGY,
    label: 'Marketing Strategy',
    description: 'Develop marketing strategies and campaigns',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.MEETING_NOTES]: {
    id: AI_TOOL_TYPES.MEETING_NOTES,
    label: 'Meeting Notes',
    description: 'Summarize meetings with action items',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.DOCUMENT_ANALYZER]: {
    id: AI_TOOL_TYPES.DOCUMENT_ANALYZER,
    label: 'Document Analyzer',
    description: 'Extract key insights from documents',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.PITCH_DECK_ASSISTANT]: {
    id: AI_TOOL_TYPES.PITCH_DECK_ASSISTANT,
    label: 'Pitch Deck Assistant',
    description: 'Create and refine investor pitch decks',
    requiredCapabilities: ['text'],
  },

  // ── Role-Specific AI Assistants (Phase 9B) ───────────────────
  [AI_TOOL_TYPES.EXECUTIVE_AI]: {
    id: AI_TOOL_TYPES.EXECUTIVE_AI,
    label: 'Executive AI',
    description: 'Virtual Chief Executive Advisor — strategy, market dynamics, org health',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.MANAGER_AI]: {
    id: AI_TOOL_TYPES.MANAGER_AI,
    label: 'Manager AI',
    description: 'Operations strategist & team coach — bottlenecks, resources, productivity',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.EMPLOYEE_AI]: {
    id: AI_TOOL_TYPES.EMPLOYEE_AI,
    label: 'Employee AI',
    description: 'Personal workplace assistant — tasks, schedule, documents, collaboration',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.FINANCE_AI]: {
    id: AI_TOOL_TYPES.FINANCE_AI,
    label: 'Finance AI',
    description: 'Financial advisor — budgets, forecasts, cost optimization, investment insights',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.HR_SPECIFIC_AI]: {
    id: AI_TOOL_TYPES.HR_SPECIFIC_AI,
    label: 'HR AI',
    description: 'HR assistant — recruitment, performance reviews, satisfaction analysis',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.MARKETING_SPECIFIC_AI]: {
    id: AI_TOOL_TYPES.MARKETING_SPECIFIC_AI,
    label: 'Marketing AI',
    description: 'Marketing strategist — campaigns, content strategy, brand health',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.SALES_SPECIFIC_AI]: {
    id: AI_TOOL_TYPES.SALES_SPECIFIC_AI,
    label: 'Sales AI',
    description: 'Sales assistant — pipeline optimization, lead scoring, forecasting',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.OPERATIONS_AI]: {
    id: AI_TOOL_TYPES.OPERATIONS_AI,
    label: 'Operations AI',
    description: 'Operations analyst — workflow efficiency, resource allocation',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.TECHNICAL_AI]: {
    id: AI_TOOL_TYPES.TECHNICAL_AI,
    label: 'Technical AI',
    description: 'Technical architect — infrastructure monitoring, security, system health',
    requiredCapabilities: ['text'],
  },

  // ── Phase 9C: AI Project Orchestration ───────────────────
  [AI_TOOL_TYPES.INTELLIGENT_DELEGATION]: {
    id: AI_TOOL_TYPES.INTELLIGENT_DELEGATION,
    label: 'Intelligent Task Delegation',
    description: 'AI assigns tasks based on skills, workload, and availability',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.DECISION_SUPPORT]: {
    id: AI_TOOL_TYPES.DECISION_SUPPORT,
    label: 'AI Decision Support',
    description: 'AI presents options with probability analysis for executive decisions',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.RISK_DETECTION_AI]: {
    id: AI_TOOL_TYPES.RISK_DETECTION_AI,
    label: 'AI Risk Detection',
    description: 'Proactive identification of project, financial, and operational risks',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.EXECUTIVE_INSIGHTS]: {
    id: AI_TOOL_TYPES.EXECUTIVE_INSIGHTS,
    label: 'Executive Insights Engine',
    description: 'AI distills complex data into actionable executive summaries',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.ORG_HEALTH_ENGINE]: {
    id: AI_TOOL_TYPES.ORG_HEALTH_ENGINE,
    label: 'Organization Health Engine',
    description: 'Real-time composite score across departments, projects, and people',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.CROSS_DEPT_INTELLIGENCE]: {
    id: AI_TOOL_TYPES.CROSS_DEPT_INTELLIGENCE,
    label: 'Cross-Department Intelligence',
    description: 'AI identifies synergies and friction points between departments',
    requiredCapabilities: ['text'],
  },

  // ── Phase 9C Extension: Full Orchestration ───────────────────
  [AI_TOOL_TYPES.AI_PROJECT_ORCHESTRATION]: {
    id: AI_TOOL_TYPES.AI_PROJECT_ORCHESTRATION,
    label: 'AI Project Orchestration',
    description: 'Full workflow: objective → plan → assign → monitor execution',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.WORKFLOW_AUTOMATION]: {
    id: AI_TOOL_TYPES.WORKFLOW_AUTOMATION,
    label: 'Workflow Automation',
    description: 'AI automates repetitive business processes across departments',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.PREDICTIVE_ANALYTICS_TOOL]: {
    id: AI_TOOL_TYPES.PREDICTIVE_ANALYTICS_TOOL,
    label: 'Predictive Analytics',
    description: 'AI forecasts trends, revenue, and resource needs',
    requiredCapabilities: ['text'],
  },
};

// ─── Default generation parameters ───────────────────────────────

export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  maxOutputTokens: 2048,
  topP: 0.95,
  topK: 40,
};

// ─── Env var keys ────────────────────────────────────────────────

export const ENV_KEYS = {
  DEFAULT_PROVIDER: 'VITE_AI_DEFAULT_PROVIDER',
  GEMINI_API_KEY: 'VITE_GEMINI_API_KEY',
  GEMINI_MODEL: 'VITE_GEMINI_MODEL',
  DEEPSEEK_API_KEY: 'VITE_DEEPSEEK_API_KEY',
  DEEPSEEK_MODEL: 'VITE_DEEPSEEK_MODEL',
  QWEN_API_KEY: 'VITE_QWEN_API_KEY',
  QWEN_MODEL: 'VITE_QWEN_MODEL',
  OPENROUTER_OPENAI_MODEL: 'VITE_OPENROUTER_OPENAI_MODEL',
  OPENROUTER_API_KEY: 'VITE_OPENROUTER_API_KEY',
  OPENROUTER_REFERRER: 'VITE_OPENROUTER_REFERRER',
  OPENROUTER_TITLE: 'VITE_OPENROUTER_TITLE',

  // ── CORS Proxy (for Website & YouTube analyzers) ──────────
  CORS_PROXY_URL: 'VITE_CORS_PROXY_URL',
};
