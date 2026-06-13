import { useState } from 'react';
import {
  Brain, Send, Target, ShieldAlert,
  BarChart3, Lightbulb, AlertTriangle,
  MessageSquare, Clock, Lock
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AI() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.user_metadata?.role || 'staff';
  const [prompt, setPrompt] = useState('');
  const [selectedTab, setSelectedTab] = useState('advisor');

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center mb-6">
          <Lock size={32} className="text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-500 text-center max-w-md text-sm">
          The AI Advisor feature is only available to organization admins. Contact your admin for assistance.
        </p>
        <button
          onClick={() => navigate('/app')}
          className="mt-6 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Advisor</h1>
          <p className="text-slate-500 mt-1 text-sm">Intelligent insights and recommendations for your business</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200 w-fit">
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
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
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
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Brain size={18} className="text-blue-600" />
              Ask the AI Advisor
            </h2>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your business challenge or idea... e.g., 'Analyze our current social media strategy and suggest improvements'"
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm"
              />
              <button
                disabled={!prompt.trim()}
                className="absolute bottom-3 right-3 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">Powered by DeepSeek R1 + Qwen VL via OpenRouter</p>
          </div>

          {/* Recent analyses */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                Recent Analyses
              </h2>
            </div>
            <div className="p-8 text-center">
              <BarChart3 size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No analyses yet</p>
              <p className="text-xs text-slate-400 mt-1">Ask a question above to get started</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Insights */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={18} className="text-violet-600" />
              <h2 className="text-base font-semibold text-slate-900">AI Insights</h2>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-slate-400">Submit a query to receive AI-powered insights about your business.</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Run Risk Assessment', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Analyze Social Media', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Generate Strategy Report', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${action.bg}`}>
                      <Icon size={16} className={action.color} />
                    </div>
                    <span className="text-sm text-slate-700">{action.label}</span>
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
