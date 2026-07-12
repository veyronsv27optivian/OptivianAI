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
  STRATEGY_REPORT: 'strategy_report',
  SENTIMENT_ANALYSIS: 'sentiment_analysis',
  COMPETITIVE_ANALYSIS: 'competitive_analysis',
  MARKET_RESEARCH: 'market_research',
  CONTENT_GENERATION: 'content_generation',
  PERFORMANCE_ANALYSIS: 'performance_analysis',
  PREDICTIVE_ANALYTICS: 'predictive_analytics',
  CUSTOMER_INSIGHTS: 'customer_insights',
  WORKFLOW_OPTIMIZATION: 'workflow_optimization',
  COMPLIANCE_CHECK: 'compliance_check',
  REPORT_GENERATION: 'report_generation',
  DATA_EXTRACTION: 'data_extraction',
  SUMMARIZATION: 'summarization',
  CODE_REVIEW: 'code_review',
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
};

// ─── Provider configuration ──────────────────────────────────────

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
    priority: 3,     // final fallback
  },
  [AI_PROVIDERS.OPENAI_VIA_OPENROUTER]: {
    name: 'OpenAI',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    envKey: 'VITE_DEEPSEEK_API_KEY',
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
  [AI_TOOL_TYPES.STRATEGY_REPORT]: {
    id: AI_TOOL_TYPES.STRATEGY_REPORT,
    label: 'Strategy Report',
    description: 'Generate comprehensive strategy reports',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.SENTIMENT_ANALYSIS]: {
    id: AI_TOOL_TYPES.SENTIMENT_ANALYSIS,
    label: 'Sentiment Analysis',
    description: 'Analyze sentiment from text or social media',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.COMPETITIVE_ANALYSIS]: {
    id: AI_TOOL_TYPES.COMPETITIVE_ANALYSIS,
    label: 'Competitive Analysis',
    description: 'Analyze competitive landscape and positioning',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.MARKET_RESEARCH]: {
    id: AI_TOOL_TYPES.MARKET_RESEARCH,
    label: 'Market Research',
    description: 'Research market trends and opportunities',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.CONTENT_GENERATION]: {
    id: AI_TOOL_TYPES.CONTENT_GENERATION,
    label: 'Content Generation',
    description: 'Generate marketing copy, emails, and content',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.PERFORMANCE_ANALYSIS]: {
    id: AI_TOOL_TYPES.PERFORMANCE_ANALYSIS,
    label: 'Performance Analysis',
    description: 'Analyze business performance metrics',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.PREDICTIVE_ANALYTICS]: {
    id: AI_TOOL_TYPES.PREDICTIVE_ANALYTICS,
    label: 'Predictive Analytics',
    description: 'Forecast trends and outcomes',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.CUSTOMER_INSIGHTS]: {
    id: AI_TOOL_TYPES.CUSTOMER_INSIGHTS,
    label: 'Customer Insights',
    description: 'Extract actionable customer insights',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.WORKFLOW_OPTIMIZATION]: {
    id: AI_TOOL_TYPES.WORKFLOW_OPTIMIZATION,
    label: 'Workflow Optimization',
    description: 'Analyze and optimize business workflows',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.COMPLIANCE_CHECK]: {
    id: AI_TOOL_TYPES.COMPLIANCE_CHECK,
    label: 'Compliance Check',
    description: 'Review against regulatory requirements',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.REPORT_GENERATION]: {
    id: AI_TOOL_TYPES.REPORT_GENERATION,
    label: 'Report Generation',
    description: 'Auto-generate structured reports',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.DATA_EXTRACTION]: {
    id: AI_TOOL_TYPES.DATA_EXTRACTION,
    label: 'Data Extraction',
    description: 'Extract structured data from text',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.SUMMARIZATION]: {
    id: AI_TOOL_TYPES.SUMMARIZATION,
    label: 'Summarization',
    description: 'Summarize lengthy content',
    requiredCapabilities: ['text'],
  },
  [AI_TOOL_TYPES.CODE_REVIEW]: {
    id: AI_TOOL_TYPES.CODE_REVIEW,
    label: 'Code Review',
    description: 'Review and analyze code quality',
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
  OPENROUTER_OPENAI_MODEL: 'VITE_OPENROUTER_OPENAI_MODEL',
  OPENROUTER_REFERRER: 'VITE_OPENROUTER_REFERRER',
  OPENROUTER_TITLE: 'VITE_OPENROUTER_TITLE',
};
