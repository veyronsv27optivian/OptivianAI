import { useState, useEffect } from 'react';
import {
  Sliders, Save, RotateCcw, Brain, Monitor, Eye, EyeOff,
  MessageSquare, Globe, Type, AlignLeft, Gauge, Layers,
} from 'lucide-react';
import {
  getAvailableProviders, setActiveProvider, getActiveProviderName,
  getDefaultProviderName,
} from '../../services/ai';

// ─── Local storage keys ────────────────────────────────────────────
const SETTINGS_KEY = 'optivian_ai_settings';

function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
}

function getDefaultSettings() {
  return {
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.95,
    topK: 40,
    creativity: 'balanced',
    reasoningLevel: 'standard',
    preferredProvider: getDefaultProviderName(),
    preferredModel: '',
    streamingEnabled: true,
    markdownEnabled: true,
    memoryEnabled: true,
    language: 'auto',
    tone: 'professional',
    responseLength: 'medium',
  };
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export default function AISettings({ onClose }) {
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved] = useState(false);
  const providers = getAvailableProviders();

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    if (settings.preferredProvider) {
      setActiveProvider(settings.preferredProvider);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const defaults = getDefaultSettings();
    setSettings(defaults);
    saveSettings(defaults);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Sync with provider manager
  useEffect(() => {
    if (settings.preferredProvider) {
      setActiveProvider(settings.preferredProvider);
    }
  }, []);

  const RangeSlider = ({ label, value, min, max, step = 0.1, onChange, icon: Icon, description }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-slate-400" />}
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        </div>
        <span className="text-sm text-blue-600 font-mono">{value}</span>
      </div>
      {description && <p className="text-xs text-slate-400">{description}</p>}        <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );

  const SelectField = ({ label, value, options, onChange, icon: Icon, description }) => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-slate-400" />}
        <label className="text-sm font-medium text-slate-700">{label}</label>
      </div>
      {description && <p className="text-xs text-slate-400">{description}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Saved indicator */}
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm">
          <Save size={16} />
          Settings saved successfully
        </div>
      )}

      {/* Provider & Model */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Brain size={18} className="text-blue-600" />
          Provider & Model
        </h3>
        <div className="bg-white dark:dark-card-metallic border border-slate-200 dark:border-white/10 rounded-xl p-5 space-y-4 shadow-sm">
          <SelectField
            label="Preferred Provider"
            value={settings.preferredProvider}
            onChange={(v) => handleChange('preferredProvider', v)}
            icon={Monitor}
            description="Choose your default AI provider"
            options={providers.map(p => ({
              value: p.name,
              label: `${p.label} ${p.available ? '✓' : '✗'} - ${p.model}`,
            }))}
          />
          <SelectField
            label="Preferred Model"
            value={settings.preferredModel}
            onChange={(v) => handleChange('preferredModel', v)}
            icon={Layers}
            description="Override the default model (leave empty for provider default)"
            options={[
              { value: '', label: 'Use provider default' },
              { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
              { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
              { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
              { value: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (Free)' },
              { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
              { value: 'qwen/qwen2.5-vl-72b-instruct:free', label: 'Qwen VL 72B (Free)' },
              { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
              { value: 'gpt-4o', label: 'GPT-4o' },
            ]}
          />
        </div>
      </section>

      {/* Generation Parameters */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Sliders size={18} className="text-purple-600" />
          Generation Parameters
        </h3>
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg p-5 space-y-6">
          <RangeSlider
            label="Temperature"
            value={settings.temperature}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => handleChange('temperature', v)}
            icon={Gauge}
            description="Controls randomness. Lower = more deterministic, higher = more creative."
          />
          <RangeSlider
            label="Max Tokens"
            value={settings.maxTokens}
            min={256}
            max={8192}
            step={256}
            onChange={(v) => handleChange('maxTokens', v)}
            icon={Type}
            description="Maximum length of the response."
          />
          <RangeSlider
            label="Top P"
            value={settings.topP}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => handleChange('topP', v)}
            icon={Layers}
            description="Nucleus sampling. Controls diversity of the output."
          />
          <RangeSlider
            label="Top K"
            value={settings.topK}
            min={1}
            max={100}
            step={1}
            onChange={(v) => handleChange('topK', v)}
            icon={Layers}
            description="Limits the next token selection to top K candidates."
          />
        </div>
      </section>

      {/* Behavior */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Brain size={18} className="text-emerald-600" />
          Behavior & Preferences
        </h3>
        <div className="bg-white dark:dark-card-metallic border border-slate-200 dark:border-white/10 rounded-xl p-5 space-y-4 shadow-sm">
          <SelectField
            label="Creativity Level"
            value={settings.creativity}
            onChange={(v) => handleChange('creativity', v)}
            icon={Gauge}
            description="Preset creativity levels that adjust temperature and top P"
            options={[
              { value: 'precise', label: 'Precise — Low creativity, factual' },
              { value: 'balanced', label: 'Balanced — Moderate creativity' },
              { value: 'creative', label: 'Creative — High creativity, diverse' },
              { value: 'exploratory', label: 'Exploratory — Maximum creativity' },
            ]}
          />
          <SelectField
            label="Reasoning Level"
            value={settings.reasoningLevel}
            onChange={(v) => handleChange('reasoningLevel', v)}
            icon={Brain}
            description="Depth of reasoning for complex problems"
            options={[
              { value: 'fast', label: 'Fast — Quick responses' },
              { value: 'standard', label: 'Standard — Balanced reasoning' },
              { value: 'deep', label: 'Deep — Thorough analysis' },
              { value: 'comprehensive', label: 'Comprehensive — Maximum depth' },
            ]}
          />
          <SelectField
            label="Language"
            value={settings.language}
            onChange={(v) => handleChange('language', v)}
            icon={Globe}
            description="Preferred response language"
            options={[
              { value: 'auto', label: 'Auto-detect' },
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
              { value: 'de', label: 'German' },
              { value: 'hi', label: 'Hindi' },
              { value: 'zh', label: 'Chinese' },
              { value: 'ja', label: 'Japanese' },
            ]}
          />
          <SelectField
            label="Tone"
            value={settings.tone}
            onChange={(v) => handleChange('tone', v)}
            icon={MessageSquare}
            description="Desired tone for AI responses"
            options={[
              { value: 'professional', label: 'Professional' },
              { value: 'conversational', label: 'Conversational' },
              { value: 'friendly', label: 'Friendly' },
              { value: 'formal', label: 'Formal' },
              { value: 'persuasive', label: 'Persuasive' },
              { value: 'educational', label: 'Educational' },
            ]}
          />
          <SelectField
            label="Response Length"
            value={settings.responseLength}
            onChange={(v) => handleChange('responseLength', v)}
            icon={AlignLeft}
            description="Preferred response length"
            options={[
              { value: 'short', label: 'Short — Concise responses' },
              { value: 'medium', label: 'Medium — Balanced detail' },
              { value: 'long', label: 'Long — Detailed responses' },
              { value: 'comprehensive', label: 'Comprehensive — Maximum detail' },
            ]}
          />
        </div>
      </section>

      {/* Toggles */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Monitor size={18} className="text-amber-600" />
          Display & Features
        </h3>
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg p-5 space-y-3">
          <ToggleOption
            label="Streaming Responses"
            enabled={settings.streamingEnabled}
            onChange={(v) => handleChange('streamingEnabled', v)}
            icon={Monitor}
            description="Show responses in real-time as they're generated"
          />
          <ToggleOption
            label="Markdown Rendering"
            enabled={settings.markdownEnabled}
            onChange={(v) => handleChange('markdownEnabled', v)}
            icon={Eye}
            description="Render markdown formatting in responses"
          />
          <ToggleOption
            label="Conversation Memory"
            enabled={settings.memoryEnabled}
            onChange={(v) => handleChange('memoryEnabled', v)}
            icon={Brain}
            description="Remember conversation context across messages"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all active:scale-95"
        >
          <Save size={16} />
          Save Settings
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
        >
          <RotateCcw size={16} />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

// ─── Toggle Component ─────────────────────────────────────────────

function ToggleOption({ label, enabled, onChange, icon: Icon, description }) {
  return (      <div className="flex items-center justify-between py-2">
      <div className="flex items-start gap-3">
        {Icon && <Icon size={16} className="text-slate-400 dark:text-slate-500 mt-0.5" />}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
          {description && <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-all ${
          enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
            enabled ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}
