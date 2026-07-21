/**
 * Main AI service – the single entry point for all AI features.
 *
 * Every future AI tool (Business Advisor, Requirement Analyzer, etc.)
 * imports this module instead of calling providers directly.  This
 * guarantees consistent error handling, provider fallback, analytics
 * persistence, and a unified API.
 *
 * Integrated subsystems (added without breaking existing API):
 *   - Prompt Architecture   – Auto-resolve prompts from prompt modules
 *   - Logger                – Structured request logging
 *   - Analytics             – AI usage analytics tracking
 *   - Cache                 – Intelligent response caching
 *   - Usage Tracking        – Token & cost tracking
 *   - Conversation Memory   – Session-based context injection
 */
import { supabase } from '../supabase';
import { AI_TOOL_TYPES, AI_TOOL_REGISTRY, DEFAULT_GENERATION_CONFIG } from './config';
import { getActiveProvider, getProvider, withFallback, initProviderManager } from './providerManager';
import { AiError, AiConfigurationError } from './errors';
import { AiLogger } from './logger';
import { AnalyticsTracker } from './analytics';
import { UsageTracker } from './usage';
import { AiCache } from './cache';
import { sendNotificationEmail, isEmailConfigured } from '../emailService';

// ─── Prompt module static imports ───────────────────────────────
import * as _businessAdvisor from './prompts/businessAdvisor';
import * as _requirementAnalyzer from './prompts/requirementAnalyzer';
import * as _decisionSimulation from './prompts/decisionSimulation';
import * as _futureLab from './prompts/futureLab';
import * as _socialMediaAnalysis from './prompts/socialMediaAnalysis';
import * as _swotAnalysis from './prompts/swotAnalysis';
import * as _marketingStrategy from './prompts/marketingStrategy';
import * as _financialForecast from './prompts/financialForecast';
import * as _competitorAnalysis from './prompts/competitorAnalysis';
import * as _launchReadiness from './prompts/launchReadiness';
import * as _reportGenerator from './prompts/reportGenerator';
import * as _pitchDeckAssistant from './prompts/pitchDeckAssistant';
import * as _meetingNotes from './prompts/meetingNotes';
import * as _riskAssessment from './prompts/riskAssessment';
import * as _documentAnalyzer from './prompts/documentAnalyzer';
import * as _businessPlanGenerator from './prompts/businessPlanGenerator';
import * as _salesAdvisor from './prompts/salesAdvisor';
import * as _financialAdvisor from './prompts/financialAdvisor';
import * as _hrAdvisor from './prompts/hrAdvisor';
import * as _startupValidator from './prompts/startupValidator';
import * as _productAnalyzer from './prompts/productAnalyzer';
import * as _customerPersonaGenerator from './prompts/customerPersonaGenerator';
import * as _brandAnalysis from './prompts/brandAnalysis';
import * as _seoAnalysis from './prompts/seoAnalysis';
import * as _aiProposalGenerator from './prompts/aiProposalGenerator';
import * as _aiPresentationGenerator from './prompts/aiPresentationGenerator';
import * as _aiEmailGenerator from './prompts/aiEmailGenerator';
import * as _aiBrainstorm from './prompts/aiBrainstorm';
import * as _aiCustomAssistant from './prompts/aiCustomAssistant';
import * as _resumeAnalyzer from './prompts/resumeAnalyzer';
import * as _contractAnalyzer from './prompts/contractAnalyzer';
import * as _pdfAnalyzer from './prompts/pdfAnalyzer';
import * as _wordAnalyzer from './prompts/wordAnalyzer';
import * as _excelAnalyzer from './prompts/excelAnalyzer';
import * as _csvAnalyzer from './prompts/csvAnalyzer';
import * as _powerpointAnalyzer from './prompts/powerpointAnalyzer';
import * as _websiteAnalyzer from './prompts/websiteAnalyzer';
import * as _youtubeAnalyzer from './prompts/youtubeAnalyzer';

// ── Phase 9B: Role-Specific AI Assistants ───────────────────
import * as _executiveAi from './prompts/executiveAi';
import * as _managerAi from './prompts/managerAi';
import * as _employeeAi from './prompts/employeeAi';
import * as _financeAi from './prompts/financeAi';
import * as _hrSpecificAi from './prompts/hrSpecificAi';
import * as _marketingAi from './prompts/marketingAi';
import * as _salesAi from './prompts/salesAi';
import * as _operationsAi from './prompts/operationsAi';
import * as _technicalAi from './prompts/technicalAi';

// ── Phase 9C: AI Project Orchestration ───────────────────
import * as _intelligentDelegation from './prompts/intelligentDelegation';
import * as _decisionSupport from './prompts/decisionSupport';
import * as _riskDetectionAi from './prompts/riskDetectionAi';
import * as _executiveInsights from './prompts/executiveInsights';
import * as _orgHealthEngine from './prompts/orgHealthEngine';
import * as _crossDeptIntelligence from './prompts/crossDeptIntelligence';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;

// Auto-initialize on first import
initProviderManager();

// ─── Shared cache instance ───────────────────────────────────────
const _cache = new AiCache({ defaultTTL: 5 * 60 * 1000 });

// ─── Prompt module auto-resolution ───────────────────────────────
/**
 * Resolve a prompt module for the given tool type using static imports.
 *
 * This allows AI tools to either:
 *   a) Use a dedicated prompt module (recommended)
 *   b) Pass systemPrompt directly via options (legacy)
 *
 * @param {string} toolType
 * @returns {{ systemPrompt: string, buildPrompt: Function }|null}
 */
function _resolvePromptModule(toolType) {
  const promptModules = {
    [AI_TOOL_TYPES.BUSINESS_ADVISOR]: _businessAdvisor,
    [AI_TOOL_TYPES.REQUIREMENT_ANALYZER]: _requirementAnalyzer,
    [AI_TOOL_TYPES.DECISION_SIMULATION]: _decisionSimulation,
    [AI_TOOL_TYPES.RISK_DETECTION]: _riskAssessment,
    [AI_TOOL_TYPES.LAUNCH_READINESS]: _launchReadiness,
    [AI_TOOL_TYPES.SOCIAL_ANALYSIS]: _socialMediaAnalysis,
    [AI_TOOL_TYPES.STRATEGY_REPORT]: _swotAnalysis,
    [AI_TOOL_TYPES.COMPETITIVE_ANALYSIS]: _competitorAnalysis,
    [AI_TOOL_TYPES.MARKET_RESEARCH]: _marketingStrategy,
    [AI_TOOL_TYPES.CONTENT_GENERATION]: _marketingStrategy,
    [AI_TOOL_TYPES.PERFORMANCE_ANALYSIS]: _financialForecast,
    [AI_TOOL_TYPES.PREDICTIVE_ANALYTICS]: _futureLab,
    [AI_TOOL_TYPES.REPORT_GENERATION]: _reportGenerator,
    [AI_TOOL_TYPES.SUMMARIZATION]: _meetingNotes,
    [AI_TOOL_TYPES.DATA_EXTRACTION]: _documentAnalyzer,
    // Canonical / direct tool type names
    [AI_TOOL_TYPES.SWOT_ANALYSIS]: _swotAnalysis,
    [AI_TOOL_TYPES.FINANCIAL_FORECAST]: _financialForecast,
    [AI_TOOL_TYPES.FUTURE_LAB]: _futureLab,
    [AI_TOOL_TYPES.MARKETING_STRATEGY]: _marketingStrategy,
    [AI_TOOL_TYPES.MEETING_NOTES]: _meetingNotes,
    [AI_TOOL_TYPES.DOCUMENT_ANALYZER]: _documentAnalyzer,
    [AI_TOOL_TYPES.PITCH_DECK_ASSISTANT]: _pitchDeckAssistant,
  [AI_TOOL_TYPES.BUSINESS_PLAN]: _businessPlanGenerator,
  [AI_TOOL_TYPES.SALES_ADVISOR]: _salesAdvisor,
  [AI_TOOL_TYPES.FINANCIAL_ADVISOR]: _financialAdvisor,
  [AI_TOOL_TYPES.HR_ADVISOR]: _hrAdvisor,
  [AI_TOOL_TYPES.STARTUP_VALIDATOR]: _startupValidator,
  [AI_TOOL_TYPES.PRODUCT_ANALYZER]: _productAnalyzer,
  [AI_TOOL_TYPES.CUSTOMER_PERSONA]: _customerPersonaGenerator,
  [AI_TOOL_TYPES.BRAND_ANALYSIS]: _brandAnalysis,
  [AI_TOOL_TYPES.SEO_ANALYSIS]: _seoAnalysis,
  [AI_TOOL_TYPES.PROPOSAL_GENERATOR]: _aiProposalGenerator,
  [AI_TOOL_TYPES.PRESENTATION_GENERATOR]: _aiPresentationGenerator,
  [AI_TOOL_TYPES.EMAIL_GENERATOR]: _aiEmailGenerator,
  [AI_TOOL_TYPES.AI_BRAINSTORM]: _aiBrainstorm,
  [AI_TOOL_TYPES.CUSTOM_ASSISTANT]: _aiCustomAssistant,
  [AI_TOOL_TYPES.RESUME_ANALYZER]: _resumeAnalyzer,
  [AI_TOOL_TYPES.CONTRACT_ANALYZER]: _contractAnalyzer,
  [AI_TOOL_TYPES.PDF_ANALYZER]: _pdfAnalyzer,
  [AI_TOOL_TYPES.WORD_ANALYZER]: _wordAnalyzer,
  [AI_TOOL_TYPES.EXCEL_ANALYZER]: _excelAnalyzer,
  [AI_TOOL_TYPES.CSV_ANALYZER]: _csvAnalyzer,
  [AI_TOOL_TYPES.POWERPOINT_ANALYZER]: _powerpointAnalyzer,
  [AI_TOOL_TYPES.WEBSITE_ANALYZER]: _websiteAnalyzer,
  [AI_TOOL_TYPES.YOUTUBE_ANALYZER]: _youtubeAnalyzer,
  // ── Phase 9B: Role-Specific AI Assistants ───────────────────
  [AI_TOOL_TYPES.EXECUTIVE_AI]: _executiveAi,
  [AI_TOOL_TYPES.MANAGER_AI]: _managerAi,
  [AI_TOOL_TYPES.EMPLOYEE_AI]: _employeeAi,
  [AI_TOOL_TYPES.FINANCE_AI]: _financeAi,
  [AI_TOOL_TYPES.HR_SPECIFIC_AI]: _hrSpecificAi,
  [AI_TOOL_TYPES.MARKETING_SPECIFIC_AI]: _marketingAi,
  [AI_TOOL_TYPES.SALES_SPECIFIC_AI]: _salesAi,
  [AI_TOOL_TYPES.OPERATIONS_AI]: _operationsAi,
  [AI_TOOL_TYPES.TECHNICAL_AI]: _technicalAi,
  // ── Phase 9C: AI Project Orchestration ───────────────────
  [AI_TOOL_TYPES.INTELLIGENT_DELEGATION]: _intelligentDelegation,
  [AI_TOOL_TYPES.DECISION_SUPPORT]: _decisionSupport,
  [AI_TOOL_TYPES.RISK_DETECTION_AI]: _riskDetectionAi,
  [AI_TOOL_TYPES.EXECUTIVE_INSIGHTS]: _executiveInsights,
  [AI_TOOL_TYPES.ORG_HEALTH_ENGINE]: _orgHealthEngine,
  [AI_TOOL_TYPES.CROSS_DEPT_INTELLIGENCE]: _crossDeptIntelligence,
  };

  return promptModules[toolType] || null;
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Generate text for a given AI tool / feature.
 *
 * This is the primary method every feature will call.
 *
 * Enhanced with:
 *   - Auto-resolution of prompt modules
 *   - Structured request logging
 *   - Analytics tracking
 *   - Response caching
 *   - Usage (token/cost) tracking
 *
 * @param {string}  toolType     One of AI_TOOL_TYPES values
 * @param {string}  prompt       The user's prompt / question
 * @param {object}  [options]
 * @param {string}  [options.systemPrompt]    Tool-specific system prompt
 * @param {number}  [options.temperature]
 * @param {number}  [options.maxTokens]
 * @param {number}  [options.topP]
 * @param {boolean} [options.useFallback=true]  Whether to try backup providers on failure
 * @param {boolean} [options.requireVision=false] Requires vision capability
 * @param {string}  [options.forceProvider]      Pin to a specific provider name
 * @param {boolean} [options.useCache=true]      Whether to check/use cache
 * @param {boolean} [options.skipLogging=false]  Skip logging (for internal calls)
 * @param {object}  [options.analytics]          Additional analytics context
 * @param {string}  [options.analytics.organizationId]
 * @param {string}  [options.analytics.userId]
 * @returns {Promise<{
 *   text: string,
 *   finishReason: string,
 *   usage: object|null,
 *   modelUsed: string,
 *   provider: string,
 *   toolType: string,
 * }>}
 */
export async function generateText(toolType, prompt, options = {}) {
  if (!prompt?.trim()) {
    throw new AiError('Prompt is required', 'AI_INVALID_INPUT');
  }

  const tool = AI_TOOL_REGISTRY[toolType];
  if (!tool) {
    throw new AiConfigurationError(
      `Unknown tool type "${toolType}". Valid types: ${Object.keys(AI_TOOL_REGISTRY).join(', ')}`,
    );
  }

  // ── Auto-resolve system prompt from prompt modules ──────────
  const promptModule = _resolvePromptModule(toolType);
  const systemPrompt = options.systemPrompt || promptModule?.systemPrompt || undefined;

  const genOptions = {
    systemPrompt,
    conversationHistory: options.conversationHistory,
    temperature: options.temperature ?? DEFAULT_GENERATION_CONFIG.temperature,
    maxTokens: options.maxTokens ?? DEFAULT_GENERATION_CONFIG.maxOutputTokens,
    topP: options.topP ?? DEFAULT_GENERATION_CONFIG.topP,
  };

  const requireVision = options.requireVision ?? tool.requiredCapabilities.includes('vision');
  const useFallback = options.useFallback ?? true;
  const useCache = options.useCache ?? true;
  const skipLogging = options.skipLogging ?? false;

  const startTime = Date.now();
  const logId = skipLogging ? null : AiLogger.logStart({ provider: 'pending', feature: toolType });

  // ── Check cache ─────────────────────────────────────────────
  if (useCache && !options.forceProvider) {
    const cached = _cache.get({ provider: '', model: '', prompt, systemPrompt, options: genOptions });
    if (cached.hit) {
      if (!skipLogging && logId) {
        AiLogger.logComplete(logId, {
          status: 'success',
          metadata: { cached: true, executionTime: Date.now() - startTime },
        });
      }
      return { ...cached.data, toolType };
    }
  }

  async function callProvider(provider) {
    return provider.generateText(prompt, genOptions);
  }

  let result;
  let providerUsed;
  let modelUsed = '';

  try {
    if (options.forceProvider) {
      // Pin to a specific provider
      const provider = getProvider(options.forceProvider);
      if (!provider) {
        throw new AiConfigurationError(`Provider "${options.forceProvider}" not found`);
      }
      if (!provider.isAvailable()) {
        throw new AiConfigurationError(
          `Provider "${provider.getProviderInfo().name}" is not configured`,
        );
      }
      result = await provider.generateText(prompt, genOptions);
      providerUsed = options.forceProvider;
      modelUsed = provider.model;
    } else if (useFallback) {
      const fb = await withFallback(callProvider, { requireVision });
      result = fb.result;
      providerUsed = fb.providerUsed;
      modelUsed = result.modelUsed || '';
    } else {
      const provider = getActiveProvider();
      result = await provider.generateText(prompt, genOptions);
      providerUsed = provider.getProviderInfo().name.toLowerCase();
      modelUsed = provider.model;
    }

    const enrichedResult = { ...result, toolType };
    const latency = Date.now() - startTime;

    // ── Cache the result ─────────────────────────────────────
    if (useCache) {
      _cache.set({ provider: providerUsed, model: modelUsed, prompt, systemPrompt, options: genOptions }, enrichedResult);
    }

    // ── Logger ───────────────────────────────────────────────
    if (!skipLogging && logId) {
      AiLogger.logComplete(logId, {
        status: 'success',
        metadata: { executionTime: latency, cached: false },
      });
    }

    // ── Analytics ────────────────────────────────────────────
    const analyticsCtx = options.analytics || {};
    AnalyticsTracker.trackSuccess({
      provider: providerUsed,
      model: modelUsed || result.modelUsed || '',
      latency,
      feature: toolType,
      organizationId: analyticsCtx.organizationId,
      userId: analyticsCtx.userId,
      tokenUsage: result.usage || null,
    });

    // ── Usage Tracking ───────────────────────────────────────
    if (result.usage) {
      UsageTracker.trackUsage({
        provider: providerUsed,
        model: modelUsed || result.modelUsed || '',
        promptTokens: result.usage.promptTokens || result.usage.prompt_tokens,
        completionTokens: result.usage.completionTokens || result.usage.completion_tokens,
        totalTokens: result.usage.totalTokens || result.usage.total_tokens,
        latency,
        success: true,
        feature: toolType,
        organizationId: analyticsCtx.organizationId,
        userId: analyticsCtx.userId,
      });
    }

    return enrichedResult;
  } catch (err) {
    const latency = Date.now() - startTime;

    // ── Logger (error) ───────────────────────────────────────
    if (!skipLogging && logId) {
      AiLogger.logComplete(logId, {
        status: 'error',
        error: err.message,
        metadata: { executionTime: latency },
      });
    }

    // ── Analytics (error) ────────────────────────────────────
    const analyticsCtx = options.analytics || {};
    AnalyticsTracker.trackFailure({
      provider: providerUsed || 'unknown',
      model: modelUsed || '',
      latency,
      feature: toolType,
      errorCode: err.code || 'AI_ERROR',
      errorMessage: err.message,
      organizationId: analyticsCtx.organizationId,
      userId: analyticsCtx.userId,
    });

    throw err;
  }
}

/**
 * Stream-generated text for a given AI tool.
 * Calls the callback with partial text chunks as they arrive.
 *
 * @param {string}  toolType     One of AI_TOOL_TYPES values
 * @param {string}  prompt       The user's prompt
 * @param {object}  [options]
 * @param {string}  [options.systemPrompt]
 * @param {number}  [options.temperature]
 * @param {number}  [options.maxTokens]
 * @param {boolean} [options.useFallback=true]
 * @param {string}  [options.forceProvider]
 * @param {function} options.onChunk     Called with partial text string
 * @param {function} [options.onComplete] Called with final result object
 * @param {function} [options.onError]    Called with error
 * @param {boolean}  [options.skipLogging=false]
 * @param {object}   [options.analytics]  Additional analytics context
 * @returns {Promise<void>}
 */
export async function generateStream(toolType, prompt, options = {}) {
  const { onChunk, onComplete, onError, ...rest } = options;

  if (typeof onChunk !== 'function') {
    throw new AiError('options.onChunk callback is required for streaming', 'AI_INVALID_INPUT');
  }

  const startTime = Date.now();
  const logId = options.skipLogging ? null : AiLogger.logStart({ provider: 'pending', feature: toolType });

  // Auto-resolve system prompt from prompt modules
  const promptModule = _resolvePromptModule(toolType);
  const systemPrompt = rest.systemPrompt || promptModule?.systemPrompt || undefined;

  try {
    let fullText = '';
    let providerUsed = '';
    let modelUsed = '';

    const provider = options.forceProvider
      ? getProvider(options.forceProvider)
      : getActiveProvider();

    if (!provider) {
      throw new AiConfigurationError('No provider available for streaming');
    }

    const info = provider.getProviderInfo();
    providerUsed = info.name.toLowerCase();
    modelUsed = provider.model;

    const genOptions = {
      systemPrompt,
      conversationHistory: rest.conversationHistory,
      temperature: rest.temperature ?? DEFAULT_GENERATION_CONFIG.temperature,
      maxTokens: rest.maxTokens ?? DEFAULT_GENERATION_CONFIG.maxOutputTokens,
    };

    const generator = provider.generateStream(prompt, genOptions);

    for await (const chunk of generator) {
      if (!chunk.done && chunk.text) {
        fullText += chunk.text;
        onChunk(chunk.text, fullText);
      }
    }

    const latency = Date.now() - startTime;

    // ── Logger ───────────────────────────────────────────────
    if (!options.skipLogging && logId) {
      AiLogger.logComplete(logId, {
        status: 'success',
        metadata: { executionTime: latency, streaming: true },
      });
    }

    // ── Analytics ────────────────────────────────────────────
    const analyticsCtx = options.analytics || {};
    AnalyticsTracker.trackSuccess({
      provider: providerUsed,
      model: modelUsed,
      latency,
      feature: toolType,
      organizationId: analyticsCtx.organizationId,
      userId: analyticsCtx.userId,
    });

    if (typeof onComplete === 'function') {
      onComplete({
        text: fullText,
        finishReason: 'stop',
        usage: null,
        modelUsed,
        provider: providerUsed,
        toolType,
      });
    }
  } catch (err) {
    const latency = Date.now() - startTime;

    // ── Logger (error) ───────────────────────────────────────
    if (!options.skipLogging && logId) {
      AiLogger.logComplete(logId, {
        status: 'error',
        error: err.message,
        metadata: { executionTime: latency, streaming: true },
      });
    }

    // ── Analytics (error) ────────────────────────────────────
    const analyticsCtx = options.analytics || {};
    AnalyticsTracker.trackFailure({
      provider: 'unknown',
      model: '',
      latency,
      feature: toolType,
      errorCode: err.code || 'AI_ERROR',
      errorMessage: err.message,
      organizationId: analyticsCtx.organizationId,
      userId: analyticsCtx.userId,
    });

    if (typeof onError === 'function') {
      onError(err);
    } else {
      console.error('[AI] Streaming error:', err);
      throw err;
    }
  }
}

// ─── Persistence (Supabase ai_analyses) ──────────────────────────

/**
 * Save an AI analysis result to the `ai_analyses` table.
 *
 * @param {object}  params
 * @param {string}  params.organizationId  UUID of the org
 * @param {string}  params.profileId       UUID of the profile that triggered the analysis
 * @param {string}  params.type            One of AI_TOOL_TYPES
 * @param {object}  params.inputData       Structured input (prompt, context, etc.)
 * @param {object}  params.outputData      Structured output (text, scores, etc.)
 * @param {string}  [params.modelUsed]
 * @param {number}  [params.score]         Numeric score (0-100) if applicable
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
// ─── Dev mode localStorage helpers ─────────────────────────────

function devGet() {
  try {
    return JSON.parse(localStorage.getItem('optivian_dev_ai_analyses') || '[]');
  } catch {
    return [];
  }
}

function devSet(data) {
  localStorage.setItem('optivian_dev_ai_analyses', JSON.stringify(data));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Persistence (Supabase ai_analyses) ──────────────────────────

/**
 * Save an AI analysis result to the `ai_analyses` table.
 *
 * @param {object}  params
 * @param {string}  params.organizationId  UUID of the org
 * @param {string}  params.profileId       UUID of the profile that triggered the analysis
 * @param {string}  params.type            One of AI_TOOL_TYPES
 * @param {object}  params.inputData       Structured input (prompt, context, etc.)
 * @param {object}  params.outputData      Structured output (text, scores, etc.)
 * @param {string}  [params.modelUsed]
 * @param {number}  [params.score]         Numeric score (0-100) if applicable
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function saveAnalysis({
  organizationId,
  profileId,
  type,
  inputData,
  outputData,
  modelUsed,
  score,
}) {
  if (!organizationId || !profileId || !type) {
    return {
      data: null,
      error: { message: 'organizationId, profileId, and type are required' },
    };
  }

  if (DEV_MODE) {
    const analyses = devGet();
    const entry = {
      id: uid(),
      organization_id: organizationId,
      type,
      input_data: inputData || {},
      output_data: outputData || {},
      model_used: modelUsed || null,
      score: score ?? null,
      created_by: profileId,
      created_at: new Date().toISOString(),
    };
    analyses.push(entry);
    devSet(analyses);

    // In dev mode, email is logged to console
    if (isEmailConfigured()) {
      const profiles = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
      const p = profiles.find(pr => pr.id === profileId || pr.user_id === profileId);
      if (p?.email) {
        sendNotificationEmail('ai_report', p.email, {
          userName: p.full_name || p.email?.split('@')[0] || 'User',
          reportName: AI_TOOL_REGISTRY[type]?.label || type,
          reportType: AI_TOOL_REGISTRY[type]?.label || type,
          reportUrl: `${window.location.origin}/#/app/ai`,
          summary: 'Your AI analysis is complete. View it in the AI Platform.',
        }).catch(() => {});
      }
    }

    return { data: entry, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('ai_analyses')
      .insert({
        organization_id: organizationId,
        type,
        input_data: inputData || {},
        output_data: outputData || {},
        model_used: modelUsed || null,
        score: score ?? null,
        created_by: profileId,
      })
      .select()
      .single();

    // Notify user via email that AI analysis is complete (fire-and-forget, safe fail)
    if (!error && isEmailConfigured()) {
      supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', profileId)
        .single()
        .then(({ data: profileData }) => {
          if (profileData?.email) {
            sendNotificationEmail('ai_report', profileData.email, {
              userName: profileData.full_name || profileData.email?.split('@')[0] || 'User',
              reportName: AI_TOOL_REGISTRY[type]?.label || type,
              reportType: AI_TOOL_REGISTRY[type]?.label || type,
              reportUrl: `${window.location.origin}/#/app/ai`,
              summary: 'Your AI analysis is complete. View it in the AI Platform.',
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }

    return { data, error };
  } catch (err) {
    console.error('[AI] Failed to save analysis:', err);
    return { data: null, error: { message: err.message } };
  }
}

/**
 * Fetch analyses from the `ai_analyses` table, optionally filtered.
 *
 * @param {object}  params
 * @param {string}  params.organizationId
 * @param {string}  [params.type]         Filter by tool type
 * @param {number}  [params.limit=50]
 * @param {number}  [params.offset=0]
 * @param {string}  [params.orderBy='created_at']
 * @param {boolean} [params.ascending=false]
 * @returns {Promise<{ data: Array<object>, error: object|null }>}
 */
export async function getAnalyses({
  organizationId,
  type,
  limit = 50,
  offset = 0,
  orderBy = 'created_at',
  ascending = false,
}) {
  if (!organizationId) {
    return { data: [], error: { message: 'organizationId is required' } };
  }

  if (DEV_MODE) {
    let analyses = devGet()
      .filter((a) => a.organization_id === organizationId)
      .sort((a, b) => new Date(b[orderBy || 'created_at']) - new Date(a[orderBy || 'created_at']));

    if (type) {
      analyses = analyses.filter((a) => a.type === type);
    }

    return {
      data: analyses.slice(offset, offset + limit),
      error: null,
    };
  }

  try {
    let query = supabase
      .from('ai_analyses')
      .select('*')
      .eq('organization_id', organizationId)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    return { data: data || [], error };
  } catch (err) {
    console.error('[AI] Failed to fetch analyses:', err);
    return { data: [], error: { message: err.message } };
  }
}

/**
 * Delete an analysis record.
 * @param {string} analysisId
 * @returns {Promise<{ error: object|null }>}
 */
export async function deleteAnalysis(analysisId) {
  if (DEV_MODE) {
    const analyses = devGet().filter((a) => a.id !== analysisId);
    devSet(analyses);
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('ai_analyses')
      .delete()
      .eq('id', analysisId);
    return { error };
  } catch (err) {
    console.error('[AI] Failed to delete analysis:', err);
    return { error: { message: err.message } };
  }
}

// ─── Utility ─────────────────────────────────────────────────────

/**
 * List all registered AI tools/features with their metadata.
 * UIs can call this to dynamically render tool selectors or cards.
 *
 * @returns {Array<{ id: string, label: string, description: string, requiredCapabilities: string[] }>}
 */
export function getAvailableTools() {
  return Object.values(AI_TOOL_REGISTRY);
}

/**
 * Check whether a specific tool type is registered.
 * @param {string} toolType
 * @returns {boolean}
 */
export function isToolRegistered(toolType) {
  return !!AI_TOOL_REGISTRY[toolType];
}

/**
 * Get tool metadata by type.
 * @param {string} toolType
 * @returns {{ id: string, label: string, description: string, requiredCapabilities: string[] }|undefined}
 */
export function getToolInfo(toolType) {
  return AI_TOOL_REGISTRY[toolType];
}

// ─── Cache Control ───────────────────────────────────────────────

/**
 * Clear the AI response cache.
 */
export function clearCache() {
  _cache.clear();
}

/**
 * Get cache statistics.
 * @returns {{ size: number, maxEntries: number, oldestEntry: number|null, newestEntry: number|null }}
 */
export function getCacheStats() {
  return _cache.getStats();
}
