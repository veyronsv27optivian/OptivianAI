import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Loader2, ArrowRight, X, Zap, Brain,
  Target, ShieldAlert, BarChart3, Lightbulb, AlertTriangle,
  MessageSquare, Lock, FileText, Users, TrendingUp,
  DollarSign, HeartHandshake, BadgeCheck, Package, UserCircle,
  Palette, Search, PenTool, Presentation, Mail,
  Sliders, History, Server, ScrollText,
  FileSearch, FileSignature, FileSpreadsheet,
  Globe, Video, List, Star,
} from 'lucide-react';
import { getToolRecommendations } from '../../services/ai/toolRecommender';
import { AI_TOOL_TYPES } from '../../services/ai';
import Card from '../ui/Card';

/**
 * Map tool types to icon components for display.
 */
function getToolIcon(type) {
  const iconMap = {
    [AI_TOOL_TYPES.BUSINESS_ADVISOR]: Brain,
    [AI_TOOL_TYPES.STRATEGY_REPORT]: Target,
    [AI_TOOL_TYPES.DECISION_SIMULATION]: BarChart3,
    [AI_TOOL_TYPES.LAUNCH_READINESS]: BadgeCheck,
    [AI_TOOL_TYPES.RISK_DETECTION]: ShieldAlert,
    [AI_TOOL_TYPES.REQUIREMENT_ANALYZER]: ScrollText,
    [AI_TOOL_TYPES.COMPETITIVE_ANALYSIS]: TrendingUp,
    [AI_TOOL_TYPES.MARKET_RESEARCH]: Globe,
    [AI_TOOL_TYPES.PRODUCT_ANALYZER]: Package,
    [AI_TOOL_TYPES.SOCIAL_ANALYSIS]: MessageSquare,
    [AI_TOOL_TYPES.SEO_ANALYSIS]: Search,
    [AI_TOOL_TYPES.PERFORMANCE_ANALYSIS]: DollarSign,
    [AI_TOOL_TYPES.BUSINESS_PLAN]: FileText,
    [AI_TOOL_TYPES.PREDICTIVE_ANALYTICS]: Lightbulb,
    [AI_TOOL_TYPES.STARTUP_VALIDATOR]: BadgeCheck,
    [AI_TOOL_TYPES.CONTENT_GENERATION]: TrendingUp,
    [AI_TOOL_TYPES.SALES_ADVISOR]: TrendingUp,
    [AI_TOOL_TYPES.FINANCIAL_ADVISOR]: DollarSign,
    [AI_TOOL_TYPES.HR_ADVISOR]: Users,
    [AI_TOOL_TYPES.CUSTOMER_PERSONA]: UserCircle,
    [AI_TOOL_TYPES.BRAND_ANALYSIS]: Palette,
    [AI_TOOL_TYPES.EMAIL_GENERATOR]: Mail,
    [AI_TOOL_TYPES.PROPOSAL_GENERATOR]: FileSignature,
    [AI_TOOL_TYPES.PRESENTATION_GENERATOR]: Presentation,
    [AI_TOOL_TYPES.PITCH_DECK_ASSISTANT]: Presentation,
    [AI_TOOL_TYPES.REPORT_GENERATION]: FileText,
    [AI_TOOL_TYPES.AI_BRAINSTORM]: Zap,
    [AI_TOOL_TYPES.MEETING_NOTES]: MessageSquare,
    [AI_TOOL_TYPES.DATA_EXTRACTION]: FileText,
    [AI_TOOL_TYPES.RESUME_ANALYZER]: FileSearch,
    [AI_TOOL_TYPES.CONTRACT_ANALYZER]: FileSignature,
    [AI_TOOL_TYPES.PDF_ANALYZER]: FileText,
    [AI_TOOL_TYPES.WORD_ANALYZER]: FileText,
    [AI_TOOL_TYPES.EXCEL_ANALYZER]: FileSpreadsheet,
    [AI_TOOL_TYPES.CSV_ANALYZER]: FileSpreadsheet,
    [AI_TOOL_TYPES.POWERPOINT_ANALYZER]: Presentation,
    [AI_TOOL_TYPES.WEBSITE_ANALYZER]: Globe,
    [AI_TOOL_TYPES.YOUTUBE_ANALYZER]: Video,
    [AI_TOOL_TYPES.CUSTOM_ASSISTANT]: Sparkles,
  };
  return iconMap[type] || Sparkles;
}

function getToolColor(type) {
  const colorMap = {
    [AI_TOOL_TYPES.BUSINESS_ADVISOR]: 'from-blue-500 to-blue-600',
    [AI_TOOL_TYPES.STRATEGY_REPORT]: 'from-violet-500 to-violet-600',
    [AI_TOOL_TYPES.DECISION_SIMULATION]: 'from-cyan-500 to-cyan-600',
    [AI_TOOL_TYPES.LAUNCH_READINESS]: 'from-emerald-500 to-emerald-600',
    [AI_TOOL_TYPES.RISK_DETECTION]: 'from-red-500 to-red-600',
    [AI_TOOL_TYPES.PERFORMANCE_ANALYSIS]: 'from-emerald-500 to-emerald-600',
    [AI_TOOL_TYPES.PREDICTIVE_ANALYTICS]: 'from-amber-500 to-amber-600',
    [AI_TOOL_TYPES.WEBSITE_ANALYZER]: 'from-blue-500 to-blue-600',
    [AI_TOOL_TYPES.YOUTUBE_ANALYZER]: 'from-red-500 to-red-600',
  };
  return colorMap[type] || 'from-slate-500 to-slate-600';
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/**
 * Tool Recommender — suggests the right AI specialist based on what the user describes.
 */
export default function ToolRecommender({ onSelectTool }) {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || q.length < 3) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setRecommendations([]);

    try {
      const results = await getToolRecommendations(q);
      setRecommendations(results);
      if (results.length === 0) {
        setError('No specific tool matches your request. Try browsing the categories below or being more specific.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery('');
    setRecommendations([]);
    setHasSearched(false);
    setError(null);
  };

  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-premium">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground dark:text-slate-100">
              What do you want to do?
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Describe your goal and AI will recommend the best specialist tool
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
            loading
              ? 'border-blue-400 bg-blue-50/30 dark:bg-blue-900/10'
              : hasSearched && recommendations.length > 0
                ? 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-900/10'
                : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/90 focus-within:border-blue-400 dark:focus-within:border-blue-500'
          }`}>
            <div className="pl-3.5 pr-0">
              {loading ? (
                <Loader2 size={18} className="text-blue-500 animate-spin" />
              ) : (
                <Sparkles size={18} className="text-slate-400 dark:text-slate-500" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., I want to analyze my competitors, create a business plan, assess risks..."
              className="flex-1 px-3 py-3.5 bg-transparent text-sm text-foreground dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              disabled={loading}
            />
            <div className="flex items-center gap-1 pr-2">
              {query && !loading && (
                <button
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
                >
                  <X size={16} />
                </button>
              )}
              <button
                onClick={handleSearch}
                disabled={!query.trim() || query.trim().length < 3 || loading}
                className="p-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 px-1">
            Press Enter to get recommendations
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30"
            >
              <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recommendations */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-5 space-y-3"
            >
              {/* Skeleton cards */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-700/30">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-600" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/3" />
                    <div className="h-2 bg-slate-100 dark:bg-slate-600/50 rounded w-2/3" />
                    <div className="h-2 bg-slate-100 dark:bg-slate-600/50 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {!loading && recommendations.length > 0 && (
            <motion.div
              key="results"
              variants={container}
              initial="hidden"
              animate="visible"
              className="mt-5 space-y-2"
            >
              <div className="flex items-center gap-2 mb-3">
                <Star size={14} className="text-amber-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Recommended Tools
                </span>
              </div>

              {recommendations.map((rec, i) => {
                const Icon = getToolIcon(rec.type);
                const gradient = getToolColor(rec.type);

                return (
                  <motion.div
                    key={rec.type}
                    variants={item}
                    className="group relative"
                  >
                    <button
                      onClick={() => onSelectTool?.(rec.type, rec.label)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:border-blue-200 dark:hover:border-blue-700/50 hover:shadow-md dark:hover:shadow-premium-lg transition-all duration-200 text-left active:scale-[0.99]"
                    >
                      {/* Icon */}
                      <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                        <Icon size={18} className="text-white" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {rec.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                            {rec.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {rec.reason}
                        </p>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 p-2 rounded-lg opacity-0 group-hover:opacity-100 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-all duration-200">
                        <ArrowRight size={16} />
                      </div>
                    </button>

                    {/* Confidence indicator */}
                    {i === 0 && rec.confidence >= 70 && (
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 shadow-sm">
                        Best match
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Example prompts (shown when no search yet) */}
        {!hasSearched && !loading && (
          <div className="mt-5">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Try something like:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Analyze my competitors',
                'Create a business plan',
                'Assess project risks',
                'Write a marketing email',
                'Analyze this PDF',
                'Validate my startup idea',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    setQuery(example);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
