/**
 * ─── AI Model Comparison View (Item 61) ─────────────────────────
 * Allows users to run the same prompt on multiple AI models
 * side-by-side and compare the results.
 */

import { useState, useCallback, useRef } from 'react';
import {
  ChevronRight, Play, Copy, Check, X, RefreshCw,
  AlertCircle, Loader2, Brain,
  Clock, FileText,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { getAvailableProviders, generateText, getActiveProviderName } from '../../services/ai';

const PROVIDER_MODELS = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  gemini: ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-pro'],
  qwen: ['qwen-max', 'qwen-plus'],
  openaiViaOpenRouter: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash'],
};

const MODEL_COLORS = {
  'gpt-4o': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  'gpt-4o-mini': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  'deepseek-chat': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  'deepseek-reasoner': { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  'gemini-3.5-flash': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  'gemini-3.1-flash-lite': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  'gemini-2.0-flash': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  default: { bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700/50' },
};

export default function AIModelComparison({ onClose }) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState(['gpt-4o-mini', 'deepseek-chat']);
  const [comparisonResults, setComparisonResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activeProviderName, setActiveProviderName] = useState('');
  const textareaRef = useRef(null);

  // Get all available models
  const allModels = [];
  for (const [provider, models] of Object.entries(PROVIDER_MODELS)) {
    for (const model of models) {
      allModels.push({ id: model, provider, label: model });
    }
  }

  const toggleModel = (modelId) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(m => m !== modelId);
      }
      if (prev.length >= 4) return prev; // Max 4 models
      return [...prev, modelId];
    });
  };

  const handleCompare = useCallback(async () => {
    if (!prompt.trim()) return;
    if (selectedModels.length === 0) return;

    setLoading(true);
    setError('');
    setComparisonResults([]);

    const results = [];

    for (const modelId of selectedModels) {
      try {
        const startTime = Date.now();
        const response = await generateText('custom_assistant', prompt.trim(), {
          model: modelId,
          temperature: 0.7,
          maxTokens: 1000,
          useCache: false,
          skipLogging: true,
        });
        const elapsed = Date.now() - startTime;

        results.push({
          model: modelId,
          content: response?.text || 'No response',
          tokens: response?.usage?.totalTokens || 0,
          latency: elapsed,
          error: null,
        });
      } catch (err) {
        results.push({
          model: modelId,
          content: null,
          tokens: 0,
          latency: 0,
          error: err.message || 'Failed to generate',
        });
      }
    }

    setComparisonResults(results);
    setLoading(false);
  }, [prompt, selectedModels]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getModelStyle = (modelId) => {
    return MODEL_COLORS[modelId] || MODEL_COLORS.default;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20">
            <Brain size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Model Comparison</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Run the same prompt on multiple models side-by-side</p>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 shrink-0">
        {/* Model selectors */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Models ({selectedModels.length}/4)
            </label>
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
            >
              {showModelPicker ? 'Done' : 'Change models'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedModels.map(modelId => {
              const style = getModelStyle(modelId);
              return (
                <span
                  key={modelId}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${style.bg} ${style.text} ${style.border} border`}
                >
                  <Brain size={12} />
                  {modelId}
                  {showModelPicker && (
                    <button onClick={() => toggleModel(modelId)} className="ml-0.5 hover:opacity-70">
                      <X size={12} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>

          {/* Model picker dropdown */}
          {showModelPicker && (
            <div className="mt-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-1.5">
                {allModels.map(model => {
                  const isSelected = selectedModels.includes(model.id);
                  const style = getModelStyle(model.id);
                  return (
                    <button
                      key={model.id}
                      onClick={() => toggleModel(model.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                        isSelected
                          ? `${style.bg} ${style.text} ${style.border} border`
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-current' : 'bg-slate-300'}`} />
                      <span className="truncate">{model.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Prompt input */}
        <div>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here to compare responses across different AI models..."
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none bg-white dark:bg-slate-800/90"
          />
        </div>

        {/* Run button */}
        <div className="flex justify-end mt-3">
          <button
            onClick={handleCompare}
            disabled={loading || !prompt.trim() || selectedModels.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-medium hover:from-violet-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play size={16} />
                Compare ({selectedModels.length} models)
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {comparisonResults.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <Brain size={48} className="text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-slate-500 dark:text-slate-400 mb-1">No comparisons yet</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Select up to 4 models, enter a prompt, and click "Compare" to see results side-by-side.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 size={32} className="text-violet-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Running prompt on {selectedModels.length} models...</p>
              <div className="flex items-center gap-2 justify-center mt-2">
                {selectedModels.map((m, i) => (
                  <span key={m} className={`px-2 py-0.5 rounded text-[10px] font-medium ${getModelStyle(m).bg} ${getModelStyle(m).text} animate-pulse`}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results grid */}
        {comparisonResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Results ({comparisonResults.length} responses)
              </h3>
              <button
                onClick={handleCompare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                <RefreshCw size={12} />
                Re-run
              </button>
            </div>

            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${Math.min(comparisonResults.length, 4)}, minmax(0, 1fr))`,
              }}
            >
              {comparisonResults.map((result, index) => {
                const style = getModelStyle(result.model);
                return (
                  <div
                    key={result.model + index}
                    className={`rounded-xl border ${style.border} bg-white dark:bg-slate-800/90 overflow-hidden flex flex-col`}
                  >
                    {/* Model header */}
                    <div className={`px-4 py-3 ${style.bg} border-b ${style.border} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <Brain size={14} className={style.text} />
                        <span className={`text-sm font-semibold ${style.text}`}>{result.model}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        {result.latency > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Clock size={10} />
                            {(result.latency / 1000).toFixed(1)}s
                          </span>
                        )}
                        {result.tokens > 0 && (
                          <span className="flex items-center gap-0.5">
                            <FileText size={10} />
                            {result.tokens} tokens
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Result content */}
                    <div className="flex-1 p-4 overflow-auto max-h-[500px]">
                      {result.error ? (
                        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-red-700 dark:text-red-300">{result.error}</p>
                        </div>
                      ) : (
                        <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                          {result.content}
                        </pre>
                      )}
                    </div>

                    {/* Copy button */}
                    {result.content && !result.error && (
                      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 flex justify-end">
                        <button
                          onClick={() => handleCopy(result.content, index)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check size={12} className="text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
