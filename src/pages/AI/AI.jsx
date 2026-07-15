import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Brain, Target, ShieldAlert, BarChart3, Lightbulb, AlertTriangle,
  MessageSquare, Clock, FileText, Users, TrendingUp,
  DollarSign, HeartHandshake, BadgeCheck, Package, UserCircle,
  Palette, Search, PenTool, Presentation, Mail, Zap,
  Sliders, History, Server, ScrollText,
  FileSearch, FileSignature, FileSpreadsheet,
  Globe, Video, ChevronRight, Sparkles, List,
  Bookmark, Database, UserCog, Layers, BookOpen,
  Crown, Briefcase, UserCheck, Landmark, Heart,
  Megaphone, CreditCard, Cpu, Wrench, Activity,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { AI_TOOL_TYPES, getToolInfo } from '../../services/ai';
import AIToolView from './AIToolView';
import AISettings from './AISettings';
import AIHistory from './AIHistory';
import AIProviders from './AIProviders';
import AITemplateLibrary from './AITemplateLibrary';
import AICacheManager from './AICacheManager';
import AIPersonaPresets from './AIPersonaPresets';
import AIModelComparison from './AIModelComparison';
import BatchAnalyzer from './BatchAnalyzer';
import KnowledgeBase from './KnowledgeBase';
import BusinessAdvisorForm from '../../components/ai-visualizations/BusinessAdvisorForm';
import AiUsageDashboard from '../../components/ai-visualizations/AiUsageDashboard';
import ToolRecommender from '../../components/ai-visualizations/ToolRecommender';

// ─── Tool Categories & Definitions ────────────────────────────────

const TOOL_CATEGORIES = [
  {
    id: 'advisory',
    label: 'Advisory & Strategy',
    icon: Brain,
    tools: [
      { type: AI_TOOL_TYPES.BUSINESS_ADVISOR, label: 'Business Advisor', icon: Brain, color: 'text-blue-600', bg: 'bg-blue-50' },
      { type: AI_TOOL_TYPES.STRATEGY_REPORT, label: 'SWOT Analysis', icon: Target, color: 'text-violet-600', bg: 'bg-violet-50' },
      { type: AI_TOOL_TYPES.DECISION_SIMULATION, label: 'Decision Simulator', icon: BarChart3, color: 'text-cyan-600', bg: 'bg-cyan-50' },
      { type: AI_TOOL_TYPES.LAUNCH_READINESS, label: 'Launch Readiness', icon: BadgeCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { type: AI_TOOL_TYPES.RISK_DETECTION, label: 'Risk Assessment', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis & Research',
    icon: Search,
    tools: [
      { type: AI_TOOL_TYPES.REQUIREMENT_ANALYZER, label: 'Requirement Analyzer', icon: ScrollText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { type: AI_TOOL_TYPES.COMPETITIVE_ANALYSIS, label: 'Competitor Analysis', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
      { type: AI_TOOL_TYPES.MARKET_RESEARCH, label: 'Market Research', icon: Globe, color: 'text-teal-600', bg: 'bg-teal-50' },
      { type: AI_TOOL_TYPES.PRODUCT_ANALYZER, label: 'Product Analyzer', icon: Package, color: 'text-pink-600', bg: 'bg-pink-50' },
      { type: AI_TOOL_TYPES.SOCIAL_ANALYSIS, label: 'Social Media Analysis', icon: MessageSquare, color: 'text-sky-600', bg: 'bg-sky-50' },
      { type: AI_TOOL_TYPES.SEO_ANALYSIS, label: 'SEO Analysis', icon: Search, color: 'text-green-600', bg: 'bg-green-50' },
    ],
  },
  {
    id: 'planning',
    label: 'Planning & Forecasting',
    icon: List,
    tools: [
      { type: AI_TOOL_TYPES.PERFORMANCE_ANALYSIS, label: 'Financial Forecast', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { type: AI_TOOL_TYPES.BUSINESS_PLAN, label: 'Business Plan Generator', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
      { type: AI_TOOL_TYPES.PREDICTIVE_ANALYTICS, label: 'Future Lab', icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50' },
      { type: AI_TOOL_TYPES.STARTUP_VALIDATOR, label: 'Startup Validator', icon: BadgeCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    ],
  },
  {
    id: 'business',
    label: 'Business Functions',
    icon: TrendingUp,
    tools: [
      { type: AI_TOOL_TYPES.CONTENT_GENERATION, label: 'Marketing Strategy', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
      { type: AI_TOOL_TYPES.SALES_ADVISOR, label: 'Sales Advisor', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
      { type: AI_TOOL_TYPES.FINANCIAL_ADVISOR, label: 'Financial Advisor', icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-50' },
      { type: AI_TOOL_TYPES.HR_ADVISOR, label: 'HR Advisor', icon: Users, color: 'text-sky-600', bg: 'bg-sky-50' },
      { type: AI_TOOL_TYPES.CUSTOMER_PERSONA, label: 'Customer Persona', icon: UserCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { type: AI_TOOL_TYPES.BRAND_ANALYSIS, label: 'Brand Analysis', icon: Palette, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
    ],
  },
  {
    id: 'content',
    label: 'Content Creation',
    icon: PenTool,
    tools: [
      { type: AI_TOOL_TYPES.EMAIL_GENERATOR, label: 'AI Email Generator', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
      { type: AI_TOOL_TYPES.PROPOSAL_GENERATOR, label: 'AI Proposal Generator', icon: FileSignature, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { type: AI_TOOL_TYPES.PRESENTATION_GENERATOR, label: 'AI Presentation Generator', icon: Presentation, color: 'text-orange-600', bg: 'bg-orange-50' },
      { type: AI_TOOL_TYPES.PITCH_DECK_ASSISTANT, label: 'Pitch Deck Assistant', icon: Presentation, color: 'text-rose-600', bg: 'bg-rose-50' },
      { type: AI_TOOL_TYPES.REPORT_GENERATION, label: 'Report Generator', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
      { type: AI_TOOL_TYPES.AI_BRAINSTORM, label: 'AI Brainstorm', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
      { type: AI_TOOL_TYPES.MEETING_NOTES, label: 'Meeting Notes', icon: MessageSquare, color: 'text-teal-600', bg: 'bg-teal-50' },
    ],
  },
  {
    id: 'documents',
    label: 'Document & File Analysis',
    icon: FileSearch,
    tools: [
      { type: AI_TOOL_TYPES.DATA_EXTRACTION, label: 'Document Analyzer', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
      { type: AI_TOOL_TYPES.RESUME_ANALYZER, label: 'Resume Analyzer', icon: FileSearch, color: 'text-cyan-600', bg: 'bg-cyan-50' },
      { type: AI_TOOL_TYPES.CONTRACT_ANALYZER, label: 'Contract Analyzer', icon: FileSignature, color: 'text-red-600', bg: 'bg-red-50' },
      { type: AI_TOOL_TYPES.PDF_ANALYZER, label: 'PDF Analyzer', icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50' },
      { type: AI_TOOL_TYPES.WORD_ANALYZER, label: 'Word Analyzer', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
      { type: AI_TOOL_TYPES.EXCEL_ANALYZER, label: 'Excel Analyzer', icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { type: AI_TOOL_TYPES.CSV_ANALYZER, label: 'CSV Analyzer', icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' },
      { type: AI_TOOL_TYPES.POWERPOINT_ANALYZER, label: 'PowerPoint Analyzer', icon: Presentation, color: 'text-orange-600', bg: 'bg-orange-50' },
    ],
  },
  {
    id: 'web',
    label: 'Web & Media Analysis',
    icon: Globe,
    tools: [
      { type: AI_TOOL_TYPES.WEBSITE_ANALYZER, label: 'Website Analyzer', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
      { type: AI_TOOL_TYPES.YOUTUBE_ANALYZER, label: 'YouTube Analyzer', icon: Video, color: 'text-red-600', bg: 'bg-red-50' },
      { type: AI_TOOL_TYPES.CUSTOM_ASSISTANT, label: 'Custom Assistant', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
    ],
  },
  {
    id: 'roles',
    label: 'Role-Specific AI',
    icon: Crown,
    tools: [
      { type: AI_TOOL_TYPES.EXECUTIVE_AI, label: 'Executive AI', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50' },
      { type: AI_TOOL_TYPES.MANAGER_AI, label: 'Manager AI', icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50' },
      { type: AI_TOOL_TYPES.EMPLOYEE_AI, label: 'Employee AI', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { type: AI_TOOL_TYPES.FINANCE_AI, label: 'Finance AI', icon: Landmark, color: 'text-yellow-600', bg: 'bg-yellow-50' },
      { type: AI_TOOL_TYPES.HR_SPECIFIC_AI, label: 'HR AI', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
      { type: AI_TOOL_TYPES.MARKETING_SPECIFIC_AI, label: 'Marketing AI', icon: Megaphone, color: 'text-sky-600', bg: 'bg-sky-50' },
      { type: AI_TOOL_TYPES.SALES_SPECIFIC_AI, label: 'Sales AI', icon: CreditCard, color: 'text-cyan-600', bg: 'bg-cyan-50' },
      { type: AI_TOOL_TYPES.OPERATIONS_AI, label: 'Operations AI', icon: Wrench, color: 'text-teal-600', bg: 'bg-teal-50' },
      { type: AI_TOOL_TYPES.TECHNICAL_AI, label: 'Technical AI', icon: Cpu, color: 'text-blue-600', bg: 'bg-blue-50' },
    ],
  },
  {
    id: 'orchestration',
    label: 'AI Orchestration',
    icon: Cpu,
    tools: [
      { type: AI_TOOL_TYPES.INTELLIGENT_DELEGATION, label: 'Intelligent Task Delegation', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
      { type: AI_TOOL_TYPES.DECISION_SUPPORT, label: 'AI Decision Support', icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50' },
      { type: AI_TOOL_TYPES.RISK_DETECTION_AI, label: 'AI Risk Detection', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
      { type: AI_TOOL_TYPES.EXECUTIVE_INSIGHTS, label: 'Executive Insights', icon: Brain, color: 'text-amber-600', bg: 'bg-amber-50' },
      { type: AI_TOOL_TYPES.ORG_HEALTH_ENGINE, label: 'Org Health Engine', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { type: AI_TOOL_TYPES.CROSS_DEPT_INTELLIGENCE, label: 'Cross-Dept Intelligence', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ],
  },
];



// ─── Subpages ─────────────────────────────────────────────────────

const SUBPAGES = [
  { id: 'settings', label: 'AI Settings', icon: Sliders },
  { id: 'history', label: 'AI History', icon: History },
  { id: 'providers', label: 'Provider Management', icon: Server },
  { id: 'usage', label: 'Usage Analytics', icon: BarChart3 },
  { id: 'templates', label: 'Prompt Templates', icon: Bookmark },
  { id: 'cache', label: 'Cache Manager', icon: Database },
  { id: 'personas', label: 'Persona Presets', icon: UserCog },
  { id: 'compare', label: 'Model Compare', icon: Brain },
  { id: 'batch', label: 'Batch Analysis', icon: Layers },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
];

// ─── Main Component ───────────────────────────────────────────────

export default function AI() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = user?.user_metadata?.role || 'staff';
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedSubpage, setSelectedSubpage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(TOOL_CATEGORIES.map(c => [c.id, true]))
  );
  // ── Business Advisor Form state ────────────────────────────
  const [showAdvisorForm, setShowAdvisorForm] = useState(false);

  // Parse route parameter for tool selection with useEffect
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/app/ai/settings')) {
      setSelectedSubpage('settings');
      setSelectedTool(null);
    } else if (path.startsWith('/app/ai/history')) {
      setSelectedSubpage('history');
      setSelectedTool(null);
    } else if (path.startsWith('/app/ai/usage')) {
      setSelectedSubpage('usage');
      setSelectedTool(null);
    } else if (path.startsWith('/app/ai/providers')) {
      setSelectedSubpage('providers');
      setSelectedTool(null);
    } else if (path.startsWith('/app/ai/templates')) {
      setSelectedSubpage('templates');
      setSelectedTool(null);
    } else if (path.startsWith('/app/ai/cache')) {
      setSelectedSubpage('cache');
      setSelectedTool(null);
    } else if (path.startsWith('/app/ai/personas')) {
      setSelectedSubpage('personas');
      setSelectedTool(null);
    } else if (path.startsWith('/app/ai/compare')) {
      setSelectedSubpage('compare');
      setSelectedTool(null);
    } else if (path.startsWith('/app/ai/knowledge')) {
      setSelectedSubpage('knowledge');
      setSelectedTool(null);
    } else if (path.startsWith('/app/ai/batch')) {
      setSelectedSubpage('batch');
      setSelectedTool(null);
    } else if (path === '/app/ai') {
      // Reset to dashboard view if no subpage is selected
      setSelectedSubpage(null);
      setSelectedTool(null);
    }
  }, [location.pathname]);

  // Remove the admin-only gate — all authenticated roles can access AI features
  // if (userRole !== 'admin') { ... }

  const handleSelectTool = (toolType, toolLabel) => {
    setSelectedTool({ type: toolType, label: toolLabel });
    setSelectedSubpage(null);
  };

  const handleSelectSubpage = (pageId) => {
    setSelectedSubpage(pageId);
    setSelectedTool(null);
  };

  const handleBack = () => {
    setSelectedTool(null);
    setSelectedSubpage(null);
  };

  // Filter tools based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return TOOL_CATEGORIES;
    const q = searchQuery.toLowerCase();
    return TOOL_CATEGORIES.map(cat => ({
      ...cat,
      tools: cat.tools.filter(t => t.label.toLowerCase().includes(q)),
    })).filter(cat => cat.tools.length > 0);
  }, [searchQuery]);

  // Find the selected tool's category icon
  const selectedToolIcon = useMemo(() => {
    if (!selectedTool) return null;
    for (const cat of TOOL_CATEGORIES) {
      const found = cat.tools.find(t => t.type === selectedTool.type);
      if (found) return found;
    }
    return null;
  }, [selectedTool]);

  const toggleCategory = (id) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Render subpages ─────────────────────────────────────────────
  if (selectedSubpage === 'settings') {
    return (
      <div className="h-full flex flex-col">          <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-white/10">            <button
            onClick={handleBack}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5">
            <Sliders size={20} className="text-slate-600 dark:text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Settings</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <AISettings onClose={handleBack} />
        </div>
      </div>
    );
  }

  if (selectedSubpage === 'history') {
    return (
      <div className="h-full flex flex-col">          <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-white/10">
          <button
            onClick={handleBack}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            <History size={20} className="text-slate-600 dark:text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI History</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <AIHistory />
        </div>
      </div>
    );
  }

  if (selectedSubpage === 'providers') {
    return (
      <div className="h-full flex flex-col">          <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-white/10">
          <button
            onClick={handleBack}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            <Server size={20} className="text-slate-600 dark:text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Provider Management</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <AIProviders />
        </div>
      </div>
    );
  }

  // ── Usage Analytics ──────────────────────────────────────────────
  if (selectedSubpage === 'usage') {
    return (
      <div className="h-full flex flex-col">          <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-white/10">
          <button
            onClick={handleBack}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            <BarChart3 size={20} className="text-slate-600 dark:text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Usage Analytics</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <AiUsageDashboard />
        </div>
      </div>
    );
  }

  // ── Template Library ────────────────────────────────────────────
  if (selectedSubpage === 'templates') {
    return (
      <div className="h-full flex flex-col">
        {/* Template Library subpage */}
        <AITemplateLibrary
          onClose={handleBack}
          onSelectTemplate={(t) => {
            // Load the template into a tool that matches the template's toolType
            if (t.toolType && t.toolType !== '*') {
              handleSelectTool(t.toolType, t.name);
            } else {
              // Default to Business Advisor if no specific tool type
              setSelectedTool({ type: AI_TOOL_TYPES.CUSTOM_ASSISTANT, label: t.name });
              setSelectedSubpage(null);
            }
          }}
        />
      </div>
    );
  }

  // ── Cache Manager ───────────────────────────────────────────────
  if (selectedSubpage === 'cache') {
    return (
      <div className="h-full flex flex-col">
        <AICacheManager onClose={handleBack} />
      </div>
    );
  }

  // ── Persona Presets ─────────────────────────────────────────────
  if (selectedSubpage === 'personas') {
    return (
      <div className="h-full flex flex-col">
        <AIPersonaPresets
          onClose={handleBack}
          onSelectPreset={(presetData) => {
            // Fill Business Advisor form with preset data
            setSelectedTool({
              type: AI_TOOL_TYPES.BUSINESS_ADVISOR,
              label: 'Business Advisor',
              formData: presetData,
            });
            setSelectedSubpage(null);
          }}
        />
      </div>
    );
  }

  // ── Model Comparison (Item 61) ──────────────────────────────
  if (selectedSubpage === 'compare') {
    return (
      <div className="h-full flex flex-col">
        <AIModelComparison onClose={handleBack} />
      </div>
    );
  }

  // ── Batch Document Analysis (Item 64) ───────────────────────
  if (selectedSubpage === 'batch') {
    return (
      <div className="h-full flex flex-col">
        <BatchAnalyzer onClose={handleBack} />
      </div>
    );
  }

  // ── AI Knowledge Base (Item 116) ──────────────────────────
  if (selectedSubpage === 'knowledge') {
    return (
      <div className="h-full flex flex-col">
        <KnowledgeBase onClose={handleBack} />
      </div>
    );
  }

  // ── Render tool view ────────────────────────────────────────────
  if (selectedTool) {
    const toolCfg = selectedToolIcon;

    // Business Advisor shows the form first
    if (selectedTool.type === AI_TOOL_TYPES.BUSINESS_ADVISOR && showAdvisorForm) {
      return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-white/10 bg-white dark:dark-card-metallic">
            <button
              onClick={() => setShowAdvisorForm(false)}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div className={`p-2 rounded-lg ${toolCfg?.bg || 'bg-blue-50'}`}>
              <Brain size={20} className={toolCfg?.color || 'text-blue-600'} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Business Advisor</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Fill in details for tailored advice</p>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 max-w-2xl mx-auto w-full">
            <BusinessAdvisorForm
              onSubmit={(formData) => {
                // Send structured data as the chat prompt
                setSelectedTool(prev => ({ ...prev, formData }));
                setShowAdvisorForm(false);
              }}
              onClose={() => setShowAdvisorForm(false)}
            />
          </div>
        </div>
      );
    }

    const getPlaceholder = () => {
      const placeholders = {
        [AI_TOOL_TYPES.BUSINESS_ADVISOR]: 'Describe your business challenge or question, or use the structured form above...',
        [AI_TOOL_TYPES.DECISION_SIMULATION]: 'Describe the decision you need to simulate...',
        [AI_TOOL_TYPES.RISK_DETECTION]: 'Describe the project or business context for risk assessment...',
        [AI_TOOL_TYPES.LAUNCH_READINESS]: 'Describe your product or service launch plan...',
        [AI_TOOL_TYPES.SOCIAL_ANALYSIS]: 'Describe your social media presence and strategy...',
        [AI_TOOL_TYPES.STRATEGY_REPORT]: 'What would you like a SWOT analysis on?',
        [AI_TOOL_TYPES.COMPETITIVE_ANALYSIS]: 'Describe your market and competitors...',
        [AI_TOOL_TYPES.MARKET_RESEARCH]: 'What market would you like to research?',
        [AI_TOOL_TYPES.PERFORMANCE_ANALYSIS]: 'Describe your business and financial data for forecasting...',
        [AI_TOOL_TYPES.PREDICTIVE_ANALYTICS]: 'Describe your industry and business for future trend analysis...',
        [AI_TOOL_TYPES.BUSINESS_PLAN]: 'Describe your business idea for a comprehensive business plan...',
        [AI_TOOL_TYPES.SALES_ADVISOR]: 'Describe your sales challenge or situation...',
        [AI_TOOL_TYPES.FINANCIAL_ADVISOR]: 'Describe your financial situation and goals...',
        [AI_TOOL_TYPES.HR_ADVISOR]: 'Describe your HR challenge or question...',
        [AI_TOOL_TYPES.STARTUP_VALIDATOR]: 'Describe your startup idea for validation...',
        [AI_TOOL_TYPES.PRODUCT_ANALYZER]: 'Describe your product and target users...',
        [AI_TOOL_TYPES.CUSTOMER_PERSONA]: 'Describe your business and target audience...',
        [AI_TOOL_TYPES.BRAND_ANALYSIS]: 'Describe your brand and industry...',
        [AI_TOOL_TYPES.SEO_ANALYSIS]: 'Describe your website and SEO goals...',
        [AI_TOOL_TYPES.PROPOSAL_GENERATOR]: 'Describe the proposal context and client...',
        [AI_TOOL_TYPES.PRESENTATION_GENERATOR]: 'Describe the presentation topic and audience...',
        [AI_TOOL_TYPES.EMAIL_GENERATOR]: 'Describe the email context and purpose...',
        [AI_TOOL_TYPES.AI_BRAINSTORM]: 'What topic would you like to brainstorm?',
        [AI_TOOL_TYPES.CUSTOM_ASSISTANT]: 'Configure your custom assistant and ask your question...',
        [AI_TOOL_TYPES.PITCH_DECK_ASSISTANT]: 'Describe your pitch deck needs and target investors...',
        [AI_TOOL_TYPES.MEETING_NOTES]: 'Paste the meeting transcript or notes to summarize...',
        [AI_TOOL_TYPES.RESUME_ANALYZER]: 'Paste the resume content for analysis...',
        [AI_TOOL_TYPES.CONTRACT_ANALYZER]: 'Paste the contract content for analysis...',
        [AI_TOOL_TYPES.PDF_ANALYZER]: 'Paste the PDF document content for analysis...',
        [AI_TOOL_TYPES.WORD_ANALYZER]: 'Paste the Word document content for analysis...',
        [AI_TOOL_TYPES.EXCEL_ANALYZER]: 'Paste the spreadsheet data for analysis...',
        [AI_TOOL_TYPES.CSV_ANALYZER]: 'Paste the CSV data for analysis...',
        [AI_TOOL_TYPES.POWERPOINT_ANALYZER]: 'Paste the presentation content for analysis...',
        [AI_TOOL_TYPES.WEBSITE_ANALYZER]: 'Paste the website content for analysis...',
        [AI_TOOL_TYPES.YOUTUBE_ANALYZER]: 'Paste the video transcript or description for analysis...',
        [AI_TOOL_TYPES.REPORT_GENERATION]: 'Describe the report topic and data...',
        [AI_TOOL_TYPES.SUMMARIZATION]: 'Paste the content you want summarized...',
        [AI_TOOL_TYPES.DATA_EXTRACTION]: 'Paste the document content for analysis...',
        [AI_TOOL_TYPES.EXECUTIVE_AI]: 'Describe your organizational context and strategic challenges...',
        [AI_TOOL_TYPES.MANAGER_AI]: 'Describe your team context and management challenge...',
        [AI_TOOL_TYPES.EMPLOYEE_AI]: 'What workplace question or task can I help you with?',
        [AI_TOOL_TYPES.FINANCE_AI]: 'Describe your financial context and analysis needs...',
        [AI_TOOL_TYPES.HR_SPECIFIC_AI]: 'Describe your HR challenge or people management needs...',
        [AI_TOOL_TYPES.MARKETING_SPECIFIC_AI]: 'Describe your marketing context and campaign goals...',
        [AI_TOOL_TYPES.SALES_SPECIFIC_AI]: 'Describe your sales context and pipeline goals...',
        [AI_TOOL_TYPES.OPERATIONS_AI]: 'Describe your operations context and efficiency challenges...',
        [AI_TOOL_TYPES.TECHNICAL_AI]: 'Describe your technical context and architecture needs...',
        [AI_TOOL_TYPES.INTELLIGENT_DELEGATION]: 'Describe your team, tasks, and delegation needs...',
        [AI_TOOL_TYPES.DECISION_SUPPORT]: 'Describe the decision you need help analyzing...',
        [AI_TOOL_TYPES.RISK_DETECTION_AI]: 'Describe your project or business context for risk analysis...',
        [AI_TOOL_TYPES.EXECUTIVE_INSIGHTS]: 'Paste or describe the business data to summarize...',
        [AI_TOOL_TYPES.ORG_HEALTH_ENGINE]: 'Describe your organizational data for health assessment...',
        [AI_TOOL_TYPES.CROSS_DEPT_INTELLIGENCE]: 'Describe your departments and collaboration challenges...',
      };
      return placeholders[selectedTool.type] || 'Describe your request...';
    };

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-white/10 bg-white dark:dark-card-metallic">
          <button
            onClick={handleBack}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          {toolCfg && (
            <div className={`p-2 rounded-lg ${toolCfg.bg}`}>
              <toolCfg.icon size={20} className={toolCfg.color} />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{selectedTool.label}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">AI-powered analysis and insights</p>
          </div>
          {/* Structured form button for Business Advisor */}
          {selectedTool.type === AI_TOOL_TYPES.BUSINESS_ADVISOR && (
            <button
              onClick={() => setShowAdvisorForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
            >
              <Target size={12} />
              Structured Form
            </button>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <AIToolView
            key={selectedTool.type}
            toolType={selectedTool.type}
            toolLabel={selectedTool.label}
            placeholderText={getPlaceholder()}
            additionalParams={selectedTool.formData ? { ...selectedTool.formData } : undefined}
          />
        </div>
      </div>
    );
  }

  // ── Default: Tool Dashboard ─────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">AI Platform</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {searchQuery ? `Search results for "${searchQuery}"` : 'Intelligent tools for analysis, planning, and content creation'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Subpage links */}
          {SUBPAGES.map(sp => {
            const Icon = sp.icon;
            return (
              <button
                key={sp.id}
                onClick={() => handleSelectSubpage(sp.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:dark-card-metallic text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all text-sm"
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{sp.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Recommender — AI suggests the best specialist */}
      <ToolRecommender onSelectTool={handleSelectTool} />

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search AI tools..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
        />
      </div>

      {/* Tool Categories */}
      <div className="grid grid-cols-1 gap-6">
        {filteredCategories.map((category) => {
          const CatIcon = category.icon;
          const isExpanded = expandedCategories[category.id];
          return (
            <div key={category.id} className="bg-white dark:dark-card-metallic border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CatIcon size={18} className="text-slate-500" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">{category.label}</h3>
                  <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                    {category.tools.length} tools
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </button>

              {/* Tools Grid */}
              {isExpanded && (
                <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {category.tools.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <button
                        key={tool.type}
                        onClick={() => handleSelectTool(tool.type, tool.label)}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-100 dark:border-white/10 hover:border-slate-200 dark:hover:border-white/20 hover:shadow-sm dark:hover:shadow-glass transition-all group"
                      >
                        <div className={`p-2 rounded-lg ${tool.bg} group-hover:scale-110 transition-transform`}>
                          <ToolIcon size={18} className={tool.color} />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 text-center leading-tight">{tool.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <Search size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">No tools found</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
