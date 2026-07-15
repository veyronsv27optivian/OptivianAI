/**
 * ─── AI Admin Console (Phase 9F – Items 127, 128, 130, 131) ──
 * Shows technical AI infrastructure metrics that are intentionally
 * removed from business dashboards. Restricted to Super Admin,
 * CTO, and Platform Admin roles.
 *
 * Metrics: Tokens, costs, provider status, models, API keys,
 * request analytics, response time, latency, usage stats,
 * infrastructure health, debug tools.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Brain, Server, Activity, Clock, DollarSign, BarChart3,
  Shield, Terminal, RefreshCw, AlertTriangle, CheckCircle,
  Cpu, HardDrive, Wifi, Zap, Loader2, Database,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, subtext, color = 'blue', trend }) {
  const colors = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', icon: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', icon: 'text-emerald-500' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', icon: 'text-amber-500' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', icon: 'text-violet-500' },
    red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', icon: 'text-red-500' },
    slate: { bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-400', icon: 'text-slate-400' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`rounded-xl border border-slate-200 dark:border-white/10 ${c.bg} p-5 backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        <Icon size={20} className={c.icon} />
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
      {trend && (
        <span className={`inline-flex items-center gap-1 text-[10px] mt-2 ${trend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
  );
}

function ProviderBadge({ name, active, latency }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
      active
        ? 'bg-white dark:bg-slate-800/90 border-emerald-200 dark:border-emerald-800'
        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/50 opacity-60'
    }`}>
      <div className={`w-3 h-3 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{name}</p>
        <p className="text-xs text-slate-400">{active ? `Active · ${latency || '<100ms'} latency` : 'Inactive'}</p>
      </div>
      {active && <CheckCircle size={16} className="text-emerald-500 shrink-0" />}
    </div>
  );
}

export default function AiAdminConsole() {
  const [refreshing, setRefreshing] = useState(false);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data — in production, fetch from actual AI service analytics
  const stats = useMemo(() => ({
    totalTokens: '1,234,567',
    totalCost: '$12.45',
    avgLatency: '842ms',
    totalRequests: '8,901',
    activeModels: 4,
    cacheHits: '67%',
    errorRate: '0.3%',
    uptime: '99.97%',
  }), []);

  const providerData = useMemo(() => [
    { name: 'OpenAI (GPT-4o)', active: true, latency: '320ms' },
    { name: 'DeepSeek (DeepSeek Chat)', active: true, latency: '560ms' },
    { name: 'Google Gemini (Flash)', active: true, latency: '710ms' },
    { name: 'Qwen (Qwen Max)', active: false, latency: '—' },
  ], []);

  const recentErrors = useMemo(() => [
    { time: '2 min ago', type: 'Rate limit', provider: 'OpenAI', message: '429 Too Many Requests' },
    { time: '15 min ago', type: 'Timeout', provider: 'DeepSeek', message: 'Request timed out after 30s' },
    { time: '1 hour ago', type: 'Auth', provider: 'Gemini', message: 'Invalid API key' },
  ], []);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 shadow-lg">
              <Cpu size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI Infrastructure Console</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Technical AI metrics • Provider status • Model analytics • Debug tools
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All Systems Operational
          </span>
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-xl border border-slate-200 dark:border-slate-700/50 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Database} label="Total Tokens" value={stats.totalTokens} color="violet" subtext="All providers" />
        <StatCard icon={DollarSign} label="Total Cost" value={stats.totalCost} color="amber" subtext="This month" trend={-8} />
        <StatCard icon={Clock} label="Avg. Latency" value={stats.avgLatency} color="blue" subtext="Last 24 hours" trend={12} />
        <StatCard icon={Activity} label="Total Requests" value={stats.totalRequests} color="emerald" subtext="All time" trend={23} />
        <StatCard icon={Brain} label="Active Models" value={stats.activeModels} color="violet" subtext={providerData.filter(p => p.active).length + ' of ' + providerData.length + ' providers'} />
        <StatCard icon={Zap} label="Cache Hit Rate" value={stats.cacheHits} color="emerald" subtext="Response caching" />
        <StatCard icon={AlertTriangle} label="Error Rate" value={stats.errorRate} color={parseFloat(stats.errorRate) > 1 ? 'red' : 'emerald'} subtext="Last 24 hours" />
        <StatCard icon={Shield} label="Uptime" value={stats.uptime} color="emerald" subtext="30-day rolling" />
      </div>

      {/* Provider Status */}
      <div className="bg-white dark:dark-card-metallic border border-slate-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Provider Status</h2>
          </div>
          <span className="text-xs text-slate-400">{providerData.filter(p => p.active).length}/{providerData.length} active</span>
        </div>
        <div className="space-y-2">
          {providerData.map((p, i) => (
            <ProviderBadge key={i} name={p.name} active={p.active} latency={p.latency} />
          ))}
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-white dark:dark-card-metallic border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <AlertTriangle size={16} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Recent Errors & Warnings</h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{recentErrors.length}</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
          {recentErrors.map((err, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
              <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 shrink-0 mt-0.5">
                <AlertTriangle size={12} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-red-700 dark:text-red-300">{err.type}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{err.provider}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">{err.message}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{err.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Debug / Dev Tools */}
      <div className="bg-white dark:dark-card-metallic border border-slate-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Terminal size={18} className="text-slate-500 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Debug & Diagnostics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: 'Clear AI Cache', desc: 'Remove all cached AI responses', icon: Database, color: 'text-amber-600' },
            { label: 'Test Provider Connection', desc: 'Ping all configured AI providers', icon: Wifi, color: 'text-blue-600' },
            { label: 'Analyze Recent Request', desc: 'Debug last 100 AI requests', icon: BarChart3, color: 'text-violet-600' },
            { label: 'View Logs', desc: 'AI request/response logs', icon: Terminal, color: 'text-slate-600' },
          ].map((tool, i) => (
            <button
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left"
            >
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 shrink-0">
                <tool.icon size={16} className={tool.color} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{tool.label}</p>
                <p className="text-xs text-slate-400">{tool.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 text-[10px] text-amber-700 dark:text-amber-300">
        <strong>Note:</strong> This console shows technical AI infrastructure metrics. Business dashboards (CEO, Manager, Employee views) show only outcome-focused widgets. Technical data is intentionally separated per Phase 9F UX principles.
      </div>
    </div>
  );
}
