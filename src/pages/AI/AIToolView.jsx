import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Copy, Check, RefreshCw, X, Loader2, Brain, User } from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { generateText, generateStream, getActiveProviderName, getAvailableProviders, getToolInfo, saveAnalysis } from '../../services/ai';

// ─── Simple Markdown Renderer ─────────────────────────────────────

function SimpleMarkdown({ content }) {
  if (!content) return null;

  // Process code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
      if (match) {
        const [, lang, code] = match;
        return (
          <div key={i} className="relative group my-3">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-t-lg border-b border-slate-700">
              <span>{lang || 'code'}</span>
              <button
                onClick={() => navigator.clipboard.writeText(code.trim())}
                className="hover:text-white transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-b-lg overflow-x-auto text-sm leading-relaxed">
              <code>{code.trim()}</code>
            </pre>
          </div>
        );
      }
    }
    // Render inline markdown
    return <InlineMarkdown key={i} text={part} />;
  });
}

function InlineMarkdown({ text }) {
  // Process inline formatting
  const elements = [];
  let remaining = text;

  // Bold **text**
  const boldRegex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = boldRegex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      elements.push(<span key={key++}>{remaining.slice(lastIndex, match.index)}</span>);
    }
    elements.push(<strong key={key++} className="font-semibold">{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < remaining.length) {
    elements.push(<span key={key++}>{remaining.slice(lastIndex)}</span>);
  }

  // If no bold found, process for other formatting
  if (elements.length === 0) {
    // Italic
    const italicParts = text.split(/(\*[^*\n]+\*)/g);
    return italicParts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*') && part.length > 1) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      // Inline code
      const codeParts = part.split(/(`[^`\n]+`)/g);
      return codeParts.map((cp, j) => {
        if (cp.startsWith('`') && cp.endsWith('`') && cp.length > 1) {
          return <code key={`${i}-${j}`} className="px-1.5 py-0.5 bg-slate-100 rounded text-sm font-mono text-rose-600">{cp.slice(1, -1)}</code>;
        }
        // Check for links [text](url)
        const linkParts = cp.split(/(\[[^\]]*\]\([^)]*\))/g);
        return linkParts.map((lp, k) => {
          const linkMatch = lp.match(/\[([^\]]*)\]\(([^)]*)\)/);
          if (linkMatch) {
            return <a key={`${i}-${j}-${k}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{linkMatch[1]}</a>;
          }
          return <span key={`${i}-${j}-${k}`}>{lp}</span>;
        });
      });
    });
  }

  return elements;
}

// ─── Typing Animation ─────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-slate-400 py-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs">AI is thinking...</span>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-200 rounded w-1/2" />
      <div className="h-4 bg-slate-200 rounded w-5/6" />
      <div className="h-4 bg-slate-200 rounded w-2/3" />
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────

function MessageBubble({ message, onCopy }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.(message.content);
  };

  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isUser ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
      }`}>
        {isUser ? <User size={16} /> : <Brain size={16} />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-slate-200 text-slate-800'
        }`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none">
              <SimpleMarkdown content={message.content} />
            </div>
          )}
        </div>
        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : ''}`}>
          <span className="text-[10px] text-slate-400">{message.timestamp}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              title="Copy response"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </button>
          )}
          {message.metadata?.provider && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
              {message.metadata.provider}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export default function AIToolView({ toolType, toolLabel, placeholderText, systemPrompt, additionalParams }) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const streamingRef = useRef(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const toolInfo = getToolInfo(toolType);
  const providerName = getActiveProviderName();
  const providers = getAvailableProviders();
  const activeProvider = providers.find(p => p.isActive);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // ─── Submit Handler ───────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || streaming) return;

    setError(null);
    const userMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString(),
    };

    const assistantMessage = {
      role: 'assistant',
      content: '',
      timestamp: '',
      metadata: { provider: activeProvider?.label || 'AI', toolType },
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
    setStreaming(true);
    streamingRef.current = true;

    const params = {
      ...(additionalParams || {}),
      prompt,
    };

    // Determine if we use streaming or non-streaming
    const useStreaming = activeProvider?.supportsStreaming !== false;

    if (useStreaming) {
      let fullText = '';
      try {
        await generateStream(toolType, prompt, {
          systemPrompt,
          onChunk: (chunk) => {
            if (!streamingRef.current) return;
            fullText += chunk;
            setMessages(prev => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.content = fullText;
                lastMsg.timestamp = new Date().toLocaleTimeString();
              }
              return updated;
            });
          },
          onComplete: async (result) => {
            if (!streamingRef.current) return;
            setMessages(prev => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.content = result.text || fullText;
                lastMsg.timestamp = new Date().toLocaleTimeString();
                lastMsg.metadata = {
                  ...lastMsg.metadata,
                  provider: result.provider || activeProvider?.label,
                  model: result.modelUsed,
                };
              }
              return updated;
            });
            setStreaming(false);
            streamingRef.current = false;

            // Save analysis
            const orgId = user?.user_metadata?.organization_id;
            if (orgId) {
              await saveAnalysis({
                organizationId: orgId,
                profileId: user?.id,
                type: toolType,
                inputData: { prompt },
                outputData: { text: result.text || fullText, provider: result.provider, model: result.modelUsed },
                modelUsed: result.modelUsed,
              });
            }
          },
          onError: (err) => {
            setError(err.message || 'An error occurred');
            setMessages(prev => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.content = `⚠️ Error: ${err.message || 'Request failed'}`;
              }
              return updated;
            });
            setStreaming(false);
            streamingRef.current = false;
          },
          analytics: {
            organizationId: user?.user_metadata?.organization_id,
            userId: user?.id,
          },
        });
      } catch (err) {
        setError(err.message);
        setStreaming(false);
        streamingRef.current = false;
      }
    } else {
      try {
        const result = await generateText(toolType, prompt, {
          systemPrompt,
          analytics: {
            organizationId: user?.user_metadata?.organization_id,
            userId: user?.id,
          },
        });
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = result.text;
            lastMsg.timestamp = new Date().toLocaleTimeString();
            lastMsg.metadata = { ...lastMsg.metadata, provider: result.provider, model: result.modelUsed };
          }
          return updated;
        });
        setStreaming(false);
      } catch (err) {
        setError(err.message);
        setStreaming(false);
      }
    }
  }, [input, streaming, toolType, systemPrompt, activeProvider, user]);

  // ─── Cancel Stream ────────────────────────────────────────────
  const handleCancel = () => {
    streamingRef.current = false;
    setStreaming(false);
  };

  // ─── Retry ────────────────────────────────────────────────────
  const handleRetry = () => {
    setError(null);
    // Remove the last assistant message and retry
    setMessages(prev => {
      const updated = [...prev];
      if (updated.length >= 2 && updated[updated.length - 1].role === 'assistant') {
        const lastUserMsg = updated[updated.length - 2];
        if (lastUserMsg?.role === 'user') {
          setInput(lastUserMsg.content);
        }
        updated.pop();
      }
      return updated;
    });
  };

  // ─── Clear Chat ───────────────────────────────────────────────
  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  // ─── Export Chat ──────────────────────────────────────────────
  const handleExport = () => {
    const text = messages
      .map(m => `[${m.role.toUpperCase()}] ${m.timestamp}\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${toolLabel || 'ai'}-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Keyboard shortcut ────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <Brain size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{toolLabel}</h2>
            {toolInfo && (
              <p className="text-xs text-slate-400">{toolInfo.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeProvider && (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              <div className={`w-2 h-2 rounded-full ${activeProvider.available ? 'bg-emerald-500' : 'bg-red-400'}`} />
              {activeProvider.label}
            </span>
          )}
          {messages.length > 0 && (
            <>
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                title="Clear chat"
              >
                <X size={16} />
              </button>
              <button
                onClick={handleExport}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                title="Export chat"
              >
                <Copy size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Brain size={48} className="text-slate-200 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">{toolLabel}</h3>
            <p className="text-sm text-slate-400 max-w-md">
              {placeholderText || `Describe your request and the AI will provide insights and recommendations.`}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-md">
              {examplePrompts[toolType]?.slice(0, 4).map((ep, i) => (
                <button
                  key={i}
                  onClick={() => setInput(ep)}
                  className="text-xs text-left p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all text-slate-600"
                >
                  {ep}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {streaming && messages.length > 0 && messages[messages.length - 1].content === '' && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Brain size={16} className="text-emerald-600" />
            </div>
            <LoadingSkeleton />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <span>{error}</span>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium transition-colors"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText || 'Type your request...'}
            rows={2}
            className="w-full px-4 py-3 pr-24 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm"
            disabled={streaming}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            {streaming ? (
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all"
                title="Cancel"
              >
                <X size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send (Ctrl+Enter)"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">
          Press Ctrl+Enter to send · Powered by {activeProvider?.label || 'AI'} {activeProvider?.model ? `(${activeProvider.model})` : ''}
        </p>
      </div>
    </div>
  );
}

// ─── Example prompts for each tool type ──────────────────────────

const examplePrompts = {
  business_advisor: [
    'Analyze my business model and suggest improvements',
    'How can I increase customer retention?',
    'What strategy should I use to enter a new market?',
    'Evaluate our current pricing strategy',
  ],
  requirement_analyzer: [
    'Analyze these project requirements for gaps',
    'Help me refine my product requirements',
    'Review my technical specifications',
    'Identify conflicts in these requirements',
  ],
  decision_simulation: [
    'Simulate the impact of raising prices by 20%',
    'Should we hire more staff or outsource?',
    'Compare the outcomes of expanding vs focusing',
    'What if we delay launch by 3 months?',
  ],
  swot_analysis: [
    'SWOT analysis of my SaaS startup',
    'Analyze strengths and weaknesses of our product',
    'SWOT for entering the European market',
    'Competitive SWOT analysis',
  ],
  risk_assessment: [
    'Identify risks in our product launch plan',
    'Assess operational risks in our supply chain',
    'Risk assessment for our new project',
    'What are the financial risks we should watch?',
  ],
  launch_readiness: [
    'Evaluate our readiness to launch the product',
    'Is our team ready for launch?',
    'Launch readiness assessment for Q3 release',
    'What are we missing before launch?',
  ],
  social_analysis: [
    'Analyze our Instagram engagement strategy',
    'How can we improve our LinkedIn presence?',
    'Social media audit for our brand',
    'Content strategy recommendations for Twitter',
  ],
  marketing_strategy: [
    'Create a marketing strategy for our new product',
    'How should we allocate our marketing budget?',
    'Develop a content marketing plan',
    'Digital marketing strategy for B2B SaaS',
  ],
  financial_forecast: [
    'Project our revenue for the next 12 months',
    'Create a 3-year financial forecast',
    'Analyze our cash flow and suggest improvements',
    'What is our break-even point?',
  ],
  competitor_analysis: [
    'Analyze our top 3 competitors',
    'Competitive landscape for AI tools market',
    'How do we differentiate from competitors?',
    'Market positioning analysis',
  ],
  business_plan: [
    'Create a business plan for my startup',
    'Business plan for a SaaS platform',
    'Write an executive summary for investors',
    'Financial projections for a new business',
  ],
  sales_advisor: [
    'How to handle objections in B2B sales?',
    'Create a sales script for cold calling',
    'Improve our sales conversion rate',
    'Sales pipeline management tips',
  ],
  financial_advisor: [
    'Help me create a budget for my business',
    'Investment strategy for business growth',
    'How to improve cash flow management?',
    'Debt management strategy',
  ],
  hr_advisor: [
    'How to improve employee retention?',
    'Create a remote work policy',
    'Performance review framework suggestions',
    'Hiring strategy for a growing startup',
  ],
  startup_validator: [
    'Validate my SaaS idea for project management',
    'Is this a good time to launch my startup?',
    'Evaluate the market potential of my idea',
    'What are the risks in my business model?',
  ],
  product_analyzer: [
    'Analyze our product-market fit',
    'Product feature prioritization suggestions',
    'Evaluate our user experience',
    'How can we improve our product roadmap?',
  ],
  customer_persona: [
    'Create customer personas for our B2B product',
    'Who is our ideal customer?',
    'Develop user personas for a mobile app',
    'Customer segmentation analysis',
  ],
  brand_analysis: [
    'Analyze our brand identity and positioning',
    'How can we improve brand awareness?',
    'Brand audit and recommendations',
    'Evaluate our brand messaging',
  ],
  seo_analysis: [
    'SEO audit recommendations for our website',
    'Keyword research for our industry',
    'How to improve our search rankings?',
    'Content SEO optimization tips',
  ],
  proposal_generator: [
    'Create a business proposal for a web development project',
    'Write a consulting services proposal',
    'Proposal for a strategic partnership',
    'Create a project proposal template',
  ],
  presentation_generator: [
    'Outline for a pitch deck presentation',
    'Create a sales presentation structure',
    'Presentation for a product launch',
    'Quarterly business review presentation',
  ],
  email_generator: [
    'Write a follow-up email after a meeting',
    'Cold outreach email for potential clients',
    'Email announcing a new product launch',
    'Professional thank you email',
  ],
  ai_brainstorm: [
    'Brainstorm ideas for increasing user engagement',
    'Creative marketing campaign ideas',
    'Ways to reduce operational costs',
    'New product feature ideas',
  ],
  custom_assistant: [
    'You are a coding tutor. Explain async/await in JavaScript.',
    'Act as a nutritionist and create a meal plan',
    'You are a travel advisor. Plan a trip to Japan.',
    'Act as a career coach and review my resume',
  ],
  resume_analyzer: [
    'Review my resume and suggest improvements',
    'How can I make my resume more ATS-friendly?',
    'Resume optimization for tech roles',
    'Feedback on my work experience section',
  ],
  contract_analyzer: [
    'Review this contract for risky clauses',
    'Analyze the terms of this service agreement',
    'Identify unfavorable terms in this contract',
    'Summarize this NDA agreement',
  ],
  pdf_analyzer: [
    'Summarize the key points from this document',
    'Extract action items from this report',
    'Analyze the findings in this research paper',
    'What are the main conclusions of this document?',
  ],
  report_generation: [
    'Generate a weekly performance report',
    'Create a project status report',
    'Executive summary for quarterly results',
    'Market research report on our industry',
  ],
  meeting_notes: [
    'Summarize these meeting notes with action items',
    'Convert this transcript into structured notes',
    'Extract decisions and action items from this meeting',
    'Create a meeting summary with key takeaways',
  ],
  document_analyzer: [
    'Analyze this document and extract key insights',
    'Summarize this report for executives',
    'What are the main risks in this document?',
    'Extract key data points from this analysis',
  ],
};
