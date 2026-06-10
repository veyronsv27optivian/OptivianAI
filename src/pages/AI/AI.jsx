import { useState } from 'react';
import {
  Brain, Sparkles, Send, Target, ShieldAlert,
  BarChart3, Lightbulb, AlertTriangle, TrendingUp,
  MessageSquare, Clock, ArrowRight, Lock
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AI() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.user_metadata?.role || 'staff';
  const [prompt, setPrompt] = useState('');
  const [selectedTab, setSelectedTab] = useState('advisor');

  // Non-admin users see a restricted view
  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
          <Lock size={40} className="text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-slate-400 text-center max-w-md">
          The AI Advisor feature is only available to organization admins. Contact your admin for assistance.
        </p>
        <button
          onClick={() => navigate('/app')}
          className="mt-6 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Advisor</h1>
          <p className="text-slate-400 mt-1">Intelligent insights and recommendations for your business</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-fit animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        {[
          { id: 'advisor', label: 'AI Advisor', icon: Brain },
          { id: 'analysis', label: 'Social Analysis', icon: BarChart3 },
          { id: 'future', label: 'Future Lab', icon: Lightbulb },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-blue-500/20 text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt input */}
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Brain size={20} className="text-blue-400" />
              Ask the AI Advisor
            </h2>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your business challenge or idea... e.g., 'Analyze our current social media strategy and suggest improvements'"
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all resize-none text-sm"
              />
              <button
                disabled={!prompt.trim()}
                className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Powered by DeepSeek R1 + Qwen VL via OpenRouter</p>
          </div>

          {/* Recent analyses - empty placeholder */}
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-slate-400" />
                Recent Analyses
              </h2>
            </div>
            <div className="p-8 text-center">
              <BarChart3 size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No analyses yet</p>
              <p className="text-xs text-slate-500 mt-1">Ask a question above to get started</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Insights - empty */}
          <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 backdrop-blur-sm border border-violet-500/20 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-violet-400" />
              <h2 className="text-lg font-bold text-white">AI Insights</h2>
            </div>
            <div className="p-4 text-center">
              <Lightbulb size={28} className="text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Submit a query to receive AI-powered insights about your business.</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Run Risk Assessment', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                { label: 'Analyze Social Media', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Generate Strategy Report', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className={`p-2 rounded-lg ${action.bg}`}>
                      <Icon size={16} className={action.color} />
                    </div>
                    <span className="text-sm text-slate-300 hover:text-white transition-colors">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
