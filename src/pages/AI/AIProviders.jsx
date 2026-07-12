import { useState, useEffect } from 'react';
import {
  Server, RefreshCw, Check, X, AlertCircle, Activity,
  Zap, Eye, Star, ArrowRight, Shield,
} from 'lucide-react';
import {
  getAvailableProviders, setActiveProvider, getActiveProviderName,
  getProvider,
} from '../../services/ai';

export default function AIProviders() {
  const [providers, setProviders] = useState([]);
  const [activeName, setActiveName] = useState('');
  const [testLoading, setTestLoading] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setProviders(getAvailableProviders());
    setActiveName(getActiveProviderName());
  };

  const handleSwitch = (name) => {
    const success = setActiveProvider(name);
    if (success) {
      setActiveName(name);
      showToast(`Switched to ${name}`, 'success');
    } else {
      showToast(`Failed to switch to ${name}`, 'error');
    }
    refresh();
  };

  const handleTest = async (name) => {
    setTestLoading(name);
    setTestResults(prev => ({ ...prev, [name]: null }));

    const provider = getProvider(name);
    if (!provider) {
      setTestResults(prev => ({ ...prev, [name]: { success: false, error: 'Provider not found' } }));
      setTestLoading(null);
      return;
    }

    try {
      const start = Date.now();
      const result = await provider.generateText('Say "Hello" and nothing else.', { maxTokens: 10 });
      const latency = Date.now() - start;
      setTestResults(prev => ({
        ...prev,
        [name]: {
          success: true,
          latency,
          text: result.text?.slice(0, 100),
          modelUsed: result.modelUsed,
        },
      }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [name]: { success: false, error: err.message },
      }));
    }
    setTestLoading(null);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const providerIcons = {
    gemini: { bg: 'bg-blue-50', color: 'text-blue-600', label: 'G' },
    deepseek: { bg: 'bg-green-50', color: 'text-green-600', label: 'D' },
    qwen: { bg: 'bg-purple-50', color: 'text-purple-600', label: 'Q' },
    openai: { bg: 'bg-teal-50', color: 'text-teal-600', label: 'O' },
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Server size={18} className="text-blue-600" />
            Available Providers
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Configure and switch between AI providers. The active provider is used for all AI features.
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm transition-all"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 gap-4">
        {providers.map((p) => {
          const icon = providerIcons[p.name] || { bg: 'bg-slate-50', color: 'text-slate-600', label: p.name[0]?.toUpperCase() };
          const testResult = testResults[p.name];
          const isActive = p.name === activeName;
          const isTesting = testLoading === p.name;

          return (
            <div
              key={p.name}
              className={`relative rounded-lg border-2 transition-all ${
                isActive
                  ? 'border-blue-300 bg-blue-50/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-medium flex items-center gap-1">
                  <Star size={10} />
                  Active
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between">
                  {/* Provider info */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${icon.bg} flex items-center justify-center`}>
                      <span className={`text-lg font-bold ${icon.color}`}>{icon.label}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{p.label}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          p.available
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            p.available ? 'bg-emerald-500' : 'bg-red-400'
                          }`} />
                          {p.available ? 'Available' : 'Not configured'}
                        </span>
                        <span className="text-xs text-slate-400">{p.model}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Zap size={12} />
                          {p.supportsStreaming ? 'Streaming' : 'No streaming'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Eye size={12} />
                          {p.supportsVision ? 'Vision' : 'Text only'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button
                        onClick={() => handleSwitch(p.name)}
                        disabled={!p.available}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowRight size={14} />
                        Use Provider
                      </button>
                    )}
                    <button
                      onClick={() => handleTest(p.name)}
                      disabled={!p.available || isTesting}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm transition-all disabled:opacity-50"
                    >
                      {isTesting ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Activity size={14} />
                      )}
                      Test
                    </button>
                  </div>
                </div>

                {/* Test Results */}
                {testResult && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${
                    testResult.success
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {testResult.success ? (
                      <div className="flex items-start gap-2">
                        <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-emerald-700 font-medium">Connection successful</p>
                          <p className="text-emerald-600 text-xs mt-0.5">
                            Latency: {testResult.latency}ms
                            {testResult.modelUsed && ` · Model: ${testResult.modelUsed}`}
                          </p>
                          <p className="text-emerald-600 text-xs mt-0.5">
                            Response: "{testResult.text}"
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <X size={16} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-red-700 font-medium">Connection failed</p>
                          <p className="text-red-600 text-xs mt-0.5">{testResult.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-fallback Info */}
      <div className="p-5 rounded-lg bg-slate-50 border border-slate-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-200 shrink-0">
            <Shield size={16} className="text-slate-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Automatic Fallback</h4>
            <p className="text-xs text-slate-500 mt-1">
              When a provider fails, the system automatically falls back to the next available provider in this order:
              Gemini → DeepSeek → Qwen VL → OpenAI. This ensures AI features remain operational even if one provider is unavailable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
