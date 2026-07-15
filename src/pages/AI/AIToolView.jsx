import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Copy, Check, RefreshCw, X, Loader2, Brain, User, Download, FileText, Upload, File, FileSpreadsheet, FileType, Globe, Video, Link } from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { generateText, generateStream, getAvailableProviders, getToolInfo, saveAnalysis } from '../../services/ai';
import { parseFile, getFileUploadConfig } from '../../services/ai/fileParser';
import { fetchWebsiteContent, fetchYouTubeMetadata, getUrlInputConfig } from '../../services/ai/webFetcher';
import AiVisualRenderer from '../../components/ai-visualizations/AiVisualRenderer';

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

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
    </div>
  );
}

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
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isUser ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
        {isUser ? <User size={16} /> : <Brain size={16} />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-lg px-4 py-3 ${isUser ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100'}`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <AiVisualRenderer content={message.content} toolType={message.metadata?.toolType} />
          )}
        </div>
        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : ''}`}>
          <span className="text-[10px] text-slate-400">{message.timestamp}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
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

export default function AIToolView({ toolType, toolLabel, placeholderText, systemPrompt, additionalParams }) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const streamingRef = useRef(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // File upload state (for document analyzers)
  const [fileState, setFileState] = useState({
    file: null,
    parsing: false,
    parsed: false,
    content: '',
    fileName: '',
    fileError: null,
    dragOver: false,
  });

  const fileUploadConfig = getFileUploadConfig(toolType);
  const supportsFileUpload = fileUploadConfig.supported;

  // URL input state (for Website/YouTube analyzers)
  const urlInputConfig = getUrlInputConfig(toolType);
  const supportsUrlInput = urlInputConfig.supported;
  const [urlState, setUrlState] = useState({
    url: '',
    fetching: false,
    fetched: false,
    content: '',
    urlError: null,
  });

  // ── Load settings for streaming toggle (#62) ─────────────────
  const [streamingEnabled, setStreamingEnabled] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('optivian_ai_settings') || '{}');
      if (saved.streamingEnabled !== undefined) {
        setStreamingEnabled(saved.streamingEnabled);
      }
    } catch { /* ignore */ }
  }, []);

  const toolInfo = getToolInfo(toolType);
  const providers = getAvailableProviders();
  const activeProvider = providers.find(p => p.isActive);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streaming]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // ─── Core submission logic (takes prompt text directly) ──────
  const hasAutoSubmitted = useRef(false);

  const buildContextPrompt = (params) => {
    if (!params || !params.businessContext) return '';
    const lines = [`Business Context: ${params.businessContext}`];
    if (params.industry) lines.push(`Industry: ${params.industry}`);
    if (params.companySize) lines.push(`Company Size: ${params.companySize}`);
    if (params.stage) lines.push(`Business Stage: ${params.stage}`);
    if (params.goals) lines.push(`Goals: ${params.goals}`);
    lines.push('');
    lines.push(`My Challenge: ${params.challenge || 'See above'}`);
    lines.push('');
    lines.push('Based on the above, please provide strategic business advice and actionable recommendations.');
    return lines.join('\n');
  };

  const buildEffectivePrompt = (rawText, params) => {
    if (!params || !params.businessContext) return rawText;
    // If structured context already in the text, use as-is
    if (rawText.includes(params.businessContext)) return rawText;
    // Prepend structured context
    const lines = [`Business Context: ${params.businessContext}`];
    if (params.industry) lines.push(`Industry: ${params.industry}`);
    if (params.stage) lines.push(`Stage: ${params.stage}`);
    if (params.goals) lines.push(`Goals: ${params.goals}`);
    lines.push('');
    lines.push(`Challenge: ${params.challenge || 'See context above'}`);
    lines.push('');
    lines.push(rawText);
    return lines.join('\n');
  };

  const submitPrompt = useCallback(async (promptText) => {
    if (!promptText || streaming) return;

    setError(null);
    const effective = buildEffectivePrompt(promptText, additionalParams);

    const userMsg = {
      role: 'user',
      content: effective,
      timestamp: new Date().toLocaleTimeString(),
    };
    const assistantMsg = {
      role: 'assistant',
      content: '',
      timestamp: '',
      metadata: { provider: activeProvider?.label || 'AI', toolType },
    };

    setMessages(prev => prev.concat([userMsg, assistantMsg]));
    setInput('');
    setStreaming(true);
    streamingRef.current = true;

    const useStreaming = streamingEnabled && activeProvider?.supportsStreaming !== false;

    if (useStreaming) {
      let fullText = '';
      try {
        await generateStream(toolType, effective, {
          systemPrompt,
          onChunk: (chunk) => {
            if (!streamingRef.current) return;
            fullText += chunk;
            setMessages(prev => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg?.role === 'assistant') {
                lastMsg.content = fullText;
                lastMsg.timestamp = new Date().toLocaleTimeString();
              }
              return updated;
            });
          },
          onComplete: (result) => {
            if (!streamingRef.current) return;
            setMessages(prev => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg?.role === 'assistant') {
                lastMsg.content = result.text || fullText;
                lastMsg.timestamp = new Date().toLocaleTimeString();
                lastMsg.metadata = {
                  provider: result.provider || activeProvider?.label,
                  model: result.modelUsed,
                };
              }
              return updated;
            });
            setStreaming(false);
            streamingRef.current = false;

            const orgId = user?.user_metadata?.organization_id;
            if (orgId) {
              saveAnalysis({
                organizationId: orgId,
                profileId: user?.id,
                type: toolType,
                inputData: { prompt: effective },
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
              if (lastMsg?.role === 'assistant') {
                lastMsg.content = err.message || 'Request failed';
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
        const result = await generateText(toolType, effective, {
          systemPrompt,
          analytics: {
            organizationId: user?.user_metadata?.organization_id,
            userId: user?.id,
          },
        });
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg?.role === 'assistant') {
            lastMsg.content = result.text;
            lastMsg.timestamp = new Date().toLocaleTimeString();
            lastMsg.metadata = { provider: result.provider, model: result.modelUsed };
          }
          return updated;
        });
        setStreaming(false);
      } catch (err) {
        setError(err.message);
        setStreaming(false);
      }
    }
  }, [streaming, toolType, systemPrompt, activeProvider, user, additionalParams]);

  // ─── Auto-submit when structured form data arrives ──────────
  useEffect(() => {
    if (additionalParams?.businessContext && messages.length === 0 && !hasAutoSubmitted.current && !streaming) {
      hasAutoSubmitted.current = true;
      submitPrompt(buildContextPrompt(additionalParams));
    }
  }, [additionalParams, submitPrompt]);

  const handleSubmit = useCallback(async () => {
    // Priority: typed input > parsed file content > fetched URL content
    const textToSubmit = input.trim()
      || (fileState.parsed ? fileState.content : '')
      || (urlState.fetched ? urlState.content : '');
    if (!textToSubmit) return;
    return submitPrompt(textToSubmit);
  }, [input, submitPrompt, fileState.parsed, fileState.content, urlState.fetched, urlState.content]);

  const handleCancel = () => {
    streamingRef.current = false;
    setStreaming(false);
  };

  const handleRetry = () => {
    setError(null);
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

  const handleClear = () => {
    setMessages([]);
    setError(null);
    setFileState({ file: null, parsing: false, parsed: false, content: '', fileName: '', fileError: null, dragOver: false });
    setUrlState({ url: '', fetching: false, fetched: false, content: '', urlError: null });
    setInput('');
  };

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

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      handleExport();
      return;
    }

    const chatRows = messages
      .map(m => {
        const role = m.role === 'user' ? 'user-msg' : 'ai-msg';
        const header = `[${m.role.toUpperCase()}] ${m.timestamp || ''}`;
        const text = (m.content || '')
          .split('<').join('&lt;')
          .split('>').join('&gt;')
          .split('\n').join('<br/>');
        return `<div class="message ${role}"><div class="header">${header}</div><div class="content">${text}</div></div>`;
      })
      .join('<hr/>');

    const label = toolLabel || 'AI Chat';
    const dateStr = new Date().toLocaleDateString();
    const html = [
      '<!DOCTYPE html><html><head>',
      `<title>${label} - Export</title>`,
      '<style>',
      'body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:20px;max-width:800px;margin:0 auto;color:#1e293b;}',
      'h1{font-size:18px;color:#0f172a;border-bottom:2px solid #e2e8f0;padding-bottom:10px;}',
      '.message{margin:12px 0;padding:12px;border-radius:8px;}',
      '.user-msg{background:#eff6ff;border-left:3px solid #3b82f6;}',
      '.ai-msg{background:#f8fafc;border-left:3px solid #10b981;}',
      '.header{font-size:11px;color:#94a3b8;margin-bottom:6px;font-weight:600;text-transform:uppercase;}',
      '.content{font-size:13px;line-height:1.6;}',
      'hr{border:none;border-top:1px solid #e2e8f0;margin:16px 0;}',
      '.footer{margin-top:30px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:15px;}',
      '</style></head><body>',
      `<h1>${label} - Export</h1>`,
      `<p style="font-size:11px;color:#94a3b8;">Exported on ${dateStr}</p>`,
      chatRows,
      '<div class="footer">Generated by OptivianAI</div>',
      '</body></html>',
    ].join('\n');

    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      try { printWindow.print(); } catch (e) { /* ignore */ }
    }, 250);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ─── File upload handlers ────────────────────────────────────
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;

    setFileState(prev => ({ ...prev, file, parsing: true, fileError: null, parsed: false }));

    const result = await parseFile(file);

    if (result.error) {
      setFileState(prev => ({
        ...prev,
        parsing: false,
        fileError: result.error,
        parsed: false,
        fileName: result.fileName,
      }));
      return;
    }

    const fileContent = result.content;
    const promptWithFile = `I've uploaded a document titled "${result.fileName}" for analysis. Here is the extracted content:\n\n---\n${fileContent.slice(0, 100000)}---\n\nPlease provide a thorough analysis of this ${result.fileType} document.`;

    setFileState(prev => ({
      ...prev,
      parsing: false,
      parsed: true,
      content: promptWithFile,
      fileName: result.fileName,
    }));
    setInput(promptWithFile);
  }, []);

  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset input value so same file can be selected again
    e.target.value = '';
  }, [handleFileSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setFileState(prev => ({ ...prev, dragOver: false }));
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setFileState(prev => ({ ...prev, dragOver: true }));
  }, []);

  const handleDragLeave = useCallback(() => {
    setFileState(prev => ({ ...prev, dragOver: false }));
  }, []);

  const fileInputRef = useRef(null);

  // ─── URL input handlers ─────────────────────────────────────
  const handleUrlFetch = useCallback(async () => {
    const url = urlState.url.trim();
    if (!url) return;

    setUrlState(prev => ({ ...prev, fetching: true, urlError: null }));

    let result;
    if (toolType === 'website_analyzer') {
      result = await fetchWebsiteContent(url);
    } else if (toolType === 'youtube_analyzer') {
      result = await fetchYouTubeMetadata(url);
    } else {
      return;
    }

    if (result.error) {
      setUrlState(prev => ({ ...prev, fetching: false, urlError: result.error }));
      return;
    }

    const config = urlInputConfig.config;
    const promptWithUrl = `${config.promptPrefix}---\nURL: ${result.url || url}\n${result.title ? `Title: ${result.title}\n` : ''}---\n\n${result.content}\n\n---\n\nPlease provide a thorough analysis.`;

    setUrlState(prev => ({
      ...prev,
      fetching: false,
      fetched: true,
      content: promptWithUrl,
    }));
    setInput(promptWithUrl);
  }, [urlState.url, toolType, urlInputConfig]);

  const handleUrlKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUrlFetch();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-white dark:dark-card-metallic">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Brain size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{toolLabel}</h2>
            {toolInfo && (
              <p className="text-xs text-slate-400 dark:text-slate-500">{toolInfo.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeProvider && (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <div className={`w-2 h-2 rounded-full ${activeProvider.available ? 'bg-emerald-500' : 'bg-red-400'}`} />
              {activeProvider.label}
            </span>
          )}
          {supportsUrlInput && messages.length === 0 && !urlState.fetched && (
            <button
              onClick={() => document.getElementById('url-input-field')?.focus()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all"
            >
              <Link size={14} />
              Enter URL
            </button>
          )}
          {supportsFileUpload && messages.length === 0 && !fileState.parsed && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
            >
              <Upload size={14} />
              Upload File
            </button>
          )}
          {messages.length > 0 && (
            <>
              <button onClick={handleClear} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all" title="Clear chat">
                <X size={16} />
              </button>
              <button onClick={handleExport} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all" title="Export as text">
                <Download size={16} />
              </button>
              <button onClick={handleExportPDF} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all" title="Export as PDF">
                <FileText size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {/* ── URL Input Zone (for Website/YouTube analyzers) ── */}
            {supportsUrlInput && !urlState.fetched && (
              <div className="w-full max-w-lg mb-6">
                <div className="p-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:dark-card-metallic shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-lg ${toolType === 'youtube_analyzer' ? 'bg-red-50' : 'bg-blue-50'}`}>
                      {toolType === 'youtube_analyzer' ? (
                        <Video size={24} className="text-red-500" />
                      ) : (
                        <Globe size={24} className="text-blue-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700">
                        {toolType === 'youtube_analyzer' ? 'Analyze a YouTube Video' : 'Analyze a Website'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Enter the URL below to fetch content for analysis
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="url-input-field"
                      type="url"
                      value={urlState.url}
                      onChange={(e) => setUrlState(prev => ({ ...prev, url: e.target.value }))}
                      onKeyDown={handleUrlKeyDown}
                      placeholder={toolType === 'youtube_analyzer' ? 'https://youtube.com/watch?v=...' : 'https://example.com'}
                      disabled={urlState.fetching}
                      className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    />
                    <button
                      onClick={handleUrlFetch}
                      disabled={!urlState.url.trim() || urlState.fetching}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {urlState.fetching ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      {urlState.fetching ? 'Fetching...' : 'Fetch'}
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">
                    Press Enter to fetch {toolType === 'youtube_analyzer' ? 'video metadata' : 'website content'}
                  </p>
                </div>

                {/* URL fetch error */}
                {urlState.urlError && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700">{urlState.urlError}</p>
                    <button
                      onClick={() => setUrlState(prev => ({ ...prev, urlError: null }))}
                      className="mt-1 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Fetched URL preview ── */}
            {supportsUrlInput && urlState.fetched && (
              <div className="w-full max-w-lg mb-6">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-1">
                    {toolType === 'youtube_analyzer' ? (
                      <Video size={18} className="text-purple-600" />
                    ) : (
                      <Globe size={18} className="text-purple-600" />
                    )}
                    <span className="text-sm font-semibold text-purple-800 truncate">
                      {urlState.url}
                    </span>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-purple-100 text-[10px] font-medium text-purple-700">
                      Fetched ✓
                    </span>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    Content fetched successfully. Click <strong>Send</strong> below to analyze.
                  </p>
                </div>
              </div>
            )}

            {/* ── File Upload Zone (for document analyzers) ── */}
            {supportsFileUpload && !fileState.parsed && (
              <div className="w-full max-w-lg mb-6">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
                    transition-all duration-200 group
                    ${fileState.dragOver
                      ? 'border-blue-400 bg-blue-50/50 shadow-lg shadow-blue-100'
                      : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50/50 dark:bg-slate-900/30'
                    }
                  `}
                >
                  <div className={`p-3 rounded-xl inline-block mb-4 transition-all ${
                    fileState.dragOver ? 'bg-blue-100 scale-110' : 'bg-slate-100 group-hover:bg-blue-50'
                  }`}>
                    <Upload size={32} className={fileState.dragOver ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'} />
                  </div>
                  <h4 className="text-base font-semibold text-slate-700 mb-1">
                    {fileState.dragOver ? 'Drop your file here' : 'Upload a document'}
                  </h4>
                  <p className="text-sm text-slate-400 mb-3">
                    Drag & drop or click to browse
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-500 font-medium">
                    <FileType size={14} />
                    {fileUploadConfig.config.label} files ({fileUploadConfig.config.accept})
                  </span>
                </div>

                {/* Parsing indicator */}
                {fileState.parsing && (
                  <div className="flex items-center justify-center gap-2 mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <Loader2 size={18} className="text-blue-500 animate-spin" />
                    <span className="text-sm text-blue-700 font-medium">Parsing document...</span>
                  </div>
                )}

                {/* File error */}
                {fileState.fileError && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700">
                      <span className="font-medium">{fileState.fileName}:</span> {fileState.fileError}
                    </p>
                    <button
                      onClick={() => setFileState(prev => ({ ...prev, fileError: null }))}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Parsed file preview ── */}
            {supportsFileUpload && fileState.parsed && (
              <div className="w-full max-w-lg mb-6">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <File size={18} className="text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-800">{fileState.fileName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[10px] font-medium text-emerald-700">
                      Parsed ✓
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600">
                    Document parsed successfully. Click <strong>Send</strong> below to analyze.
                  </p>
                </div>
              {/* Hidden file input — kept outside conditional so ref stays alive */}
              <input
                ref={fileInputRef}
                type="file"
                accept={fileUploadConfig.config.accept}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

            {/* ── Empty state (for all tools except file-upload-only tools before parse) ── */}
            {(!supportsFileUpload || fileState.parsed) && (
              <>
                <Brain size={48} className="text-slate-200 mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">{toolLabel}</h3>
                <p className="text-sm text-slate-400 max-w-md">
                  {placeholderText || 'Describe your request and the AI will provide insights and recommendations.'}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-md">
                  {examplePrompts[toolType]?.slice(0, 4).map((ep, i) => (
                    <button key={i} onClick={() => setInput(ep)} className="text-xs text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-slate-600 dark:text-slate-400">
                      {ep}
                    </button>
                  ))}
                </div>
              </>
            )}
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

        {error && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <span>{error}</span>
            <button onClick={handleRetry} className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium transition-colors">
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:dark-card-metallic">
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
              <button onClick={handleCancel} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all" title="Cancel">
                <X size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!input.trim()} className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed" title="Send (Ctrl+Enter)">
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">
          Press Ctrl+Enter to send - Powered by {activeProvider?.label || 'AI'} {activeProvider?.model ? `(${activeProvider.model})` : ''}
        </p>
      </div>
    </div>
  );
}

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
  pitch_deck_assistant: [
    'Help me structure my startup pitch deck',
    'Review my slide deck for investor readiness',
    'What slides should I include in a Series A pitch?',
    'How do I tell our story compellingly in a pitch?',
  ],
};
