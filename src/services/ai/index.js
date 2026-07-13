/**
 * Public API for the AI module.
 *
 * Future AI features import from here:
 *   import { generateText, getAvailableTools } from '../services/ai';
 *
 * To add a new AI subsystem:
 *   1. Create your module directory under src/services/ai/
 *   2. Create a barrel index.js in that directory
 *   3. Export it from this file
 *
 * Never import from `providers/` or `providerManager.js` directly.
 */

// ─── Core (unchanged) ───────────────────────────────────────────
export {
  generateText,
  generateStream,
  saveAnalysis,
  getAnalyses,
  deleteAnalysis,
  getAvailableTools,
  isToolRegistered,
  getToolInfo,
  clearCache,
  getCacheStats,
} from './aiService';

export {
  getActiveProvider,
  setActiveProvider,
  getProvider,
  getAvailableProviders,
  getActiveProviderName,
  getDefaultProviderName,
  initProviderManager,
  resetProviderManager,
} from './providerManager';

export {
  AI_PROVIDERS,
  AI_TOOL_TYPES,
  AI_TOOL_REGISTRY,
  PROVIDER_CONFIGS,
  DEFAULT_GENERATION_CONFIG,
} from './config';

export {
  AiError,
  AiConfigurationError,
  AiProviderError,
  AiRateLimitError,
  AiTimeoutError,
  AiContentFilterError,
} from './errors';

// ─── Prompt Architecture ───────────────────────────────────────
export {
  businessAdvisor,
  requirementAnalyzer,
  decisionSimulation,
  futureLab,
  socialMediaAnalysis,
  swotAnalysis,
  marketingStrategy,
  financialForecast,
  competitorAnalysis,
  launchReadiness,
  reportGenerator,
  pitchDeckAssistant,
  meetingNotes,
  riskAssessment,
  documentAnalyzer,
} from './prompts';

// ─── Template System ───────────────────────────────────────────
export {
  renderTemplate,
  registerTemplate,
  getTemplate,
  promptBuilder,
  TEMPLATES,
} from './templates';

// ─── Conversation Memory ───────────────────────────────────────
export { ConversationMemory, MEMORY_EVENTS, memoryEventBus } from './memory';

// ─── AI Usage Analytics ────────────────────────────────────────
export { AnalyticsTracker, getAnalytics } from './analytics';

// ─── Token & Cost Tracking ─────────────────────────────────────
export { UsageTracker, PRICING_TABLE, estimateCost, TOKEN_UNITS } from './usage';

// ─── AI Cache ──────────────────────────────────────────────────
export { AiCache } from './cache';

// ─── AI Logger ─────────────────────────────────────────────────
export { AiLogger } from './logger';

// ─── Tool Modules ──────────────────────────────────────────────
export {
  BusinessAdvisorTool,
  RequirementAnalyzerTool,
  DecisionSimulationTool,
  FutureLabTool,
  SWOTTool,
  MarketingTool,
  RiskTool,
  LaunchReadinessTool,
  SocialAnalysisTool,
  CompetitorAnalysisTool,
  FinancialForecastTool,
  ReportGenerationTool,
  PitchDeckAssistantTool,
  MeetingNotesTool,
  DocumentAnalyzerTool,
} from './tools';

// ─── Vision-Ready Architecture ─────────────────────────────────
export {
  imageAnalyzer,
  documentProcessor,
  multimodalBuilder,
} from './vision';

// ─── AI Utilities ──────────────────────────────────────────────
export {
  markdownFormatter,
  jsonParser,
  responseValidator,
  retryHelpers,
  chunkParser,
  promptSanitizer,
} from './utils';

// ─── Action Registry (Phase B1) ───────────────────────────────
export {
  registerAction,
  getActionsForTool,
  executeAction,
  rollbackAction,
  getAllActions,
  getAction,
  getActionLog,
  requiresApproval,
  getSafetyLevel,
} from './actions';

// ─── Base Tool Class ───────────────────────────────────────────
export { BaseTool } from './tools/_BaseTool';
