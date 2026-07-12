import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, Activity, Shield, AlertTriangle, Zap, TrendingUp, RefreshCw,
  Lightbulb, AlertCircle, CheckCircle, BarChart3, Server,
  FileText, ArrowRight, Clock, Gauge,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge, { StatusDot } from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';

export default function AIPanel({
  aiAnalytics,
  providers,
  activeProviderName,
  loading,
}) {
  const navigate = useNavigate();

  const insights = useMemo(() => {
    const items = [];
    if (aiAnalytics?.successRate && aiAnalytics.successRate < 80) {
      items.push({ type: 'warning', icon: AlertTriangle, title: 'Low Success Rate', description: 'AI success rate is below 80%. Consider checking provider status.', action: 'View Providers', actionTo: '/app/ai/providers' });
    }
    if (aiAnalytics?.total > 0 && aiAnalytics.total > 50) {
      items.push({ type: 'info', icon: TrendingUp, title: 'High AI Usage', description: `You've made ${aiAnalytics.total} AI requests. Usage is trending up.`, action: 'View Usage', actionTo: '/app/ai/history' });
    }
    if (aiAnalytics?.avgLatency && aiAnalytics.avgLatency > 2000) {
      items.push({ type: 'warning', icon: Clock, title: 'High Latency', description: `Average response time is ${aiAnalytics.avgLatency}ms. Consider switching providers.`, action: 'Check Providers', actionTo: '/app/ai/providers' });
    }
    if (aiAnalytics?.totalTokens && aiAnalytics.totalTokens > 100000) {
      items.push({ type: 'info', icon: Zap, title: 'Token Milestone', description: `You've used ${(aiAnalytics.totalTokens / 1000).toFixed(1)}K tokens. Great adoption!`, action: 'View Analytics', actionTo: '/app/ai/history' });
    }
    if (aiAnalytics?.byFeature) {
      const topFeature = Object.entries(aiAnalytics.byFeature).sort(([, a], [, b]) => b - a)[0];
      if (topFeature) {
        items.push({ type: 'success', icon: Lightbulb, title: 'Top Feature', description: `"${topFeature[0]}" is your most used AI feature with ${topFeature[1]} uses.`, action: 'Explore', actionTo: '/app/ai' });
      }
    }
    if (!activeProviderName) {
      items.push({ type: 'error', icon: AlertCircle, title: 'No Provider Active', description: 'No AI provider is currently active. Configure one to use AI features.', action: 'Setup', actionTo: '/app/ai/providers' });
    }
    return items;
  }, [aiAnalytics, activeProviderName]);

  const healthStatus = useMemo(() => {
    if (!providers.length) return { status: 'inactive', label: 'Inactive', color: 'slate' };
    const activeCount = providers.filter(p => p.isActive).length;
    if (activeCount === 0) return { status: 'inactive', label: 'Inactive', color: 'slate' };
    const successRate = aiAnalytics?.successRate || 100;
    if (successRate < 80) return { status: 'degraded', label: 'Degraded', color: 'amber' };
    return { status: 'healthy', label: 'Healthy', color: 'emerald' };
  }, [providers, aiAnalytics]);

  const providerStatus = useMemo(() => providers.map(p => ({
    ...p,
    status: p.isActive ? 'active' : 'inactive',
  })), [providers]);

  return (
    <div className="space-y-4">
      {/* AI Health Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card variant="default" padding="p-4" hover={false}>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-primary" />
            <span className="text-xs font-medium text-slate-500 uppercase">Status</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status={healthStatus.status} size="lg" />
            <span className="text-sm font-bold text-foreground capitalize">{healthStatus.label}</span>
          </div>
        </Card>
        <Card variant="default" padding="p-4" hover={false}>
          <div className="flex items-center gap-2 mb-2">
            <Server size={14} className="text-violet-500" />
            <span className="text-xs font-medium text-slate-500 uppercase">Provider</span>
          </div>
          <p className="text-sm font-bold text-foreground truncate">{activeProviderName || 'None'}</p>
        </Card>
        <Card variant="default" padding="p-4" hover={false}>
          <div className="flex items-center gap-2 mb-2">
            <Gauge size={14} className="text-emerald-500" />
            <span className="text-xs font-medium text-slate-500 uppercase">Performance</span>
          </div>
          <p className="text-sm font-bold text-foreground">
            {aiAnalytics?.avgLatency ? `${aiAnalytics.avgLatency}ms` : 'N/A'}
          </p>
        </Card>
        <Card variant="default" padding="p-4" hover={false}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-xs font-medium text-slate-500 uppercase">Success</span>
          </div>
          <p className="text-sm font-bold text-foreground">
            {aiAnalytics?.successRate ? `${Math.round(aiAnalytics.successRate)}%` : 'N/A'}
          </p>
        </Card>
      </div>

      {/* Provider Status */}
      <Card variant="default" padding="p-4">
        <CardHeader title="Provider Status" subtitle="AI provider health" icon={Server} color="violet" />
        <div className="space-y-2">
          {providerStatus.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No providers configured</p>
          ) : (
            providerStatus.map((p, i) => (
              <motion.div
                key={p.name || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50"
              >
                <div className="flex items-center gap-2.5">
                  <StatusDot status={p.status} size="md" />
                  <span className="text-sm text-slate-700">{p.label || p.name}</span>
                </div>
                <Badge color={p.isActive ? 'emerald' : 'slate'} size="xs">
                  {p.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </motion.div>
            ))
          )}
        </div>
      </Card>

      {/* AI Performance Metrics */}
      <Card variant="default" padding="p-4">
        <CardHeader title="Performance" subtitle="Key AI metrics" icon={Activity} color="primary" />
        <div className="space-y-3">
          <ProgressBar
            label="Success Rate"
            value={Math.round(aiAnalytics?.successRate || 0)}
            color="emerald"
            size="md"
            showValue
          />
          <ProgressBar
            label="Token Usage"
            value={Math.min(100, ((aiAnalytics?.totalTokens || 0) / 100000) * 100)}
            color="violet"
            size="md"
            showValue
          />
        </div>
      </Card>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card variant="default" padding="p-4">
          <CardHeader title="AI Insights" subtitle={`${insights.length} recommendations`} icon={Lightbulb} color="amber" />
          <div className="space-y-2">
            {insights.map((insight, i) => {
              const Ic = insight.icon;
              const borderColor = insight.type === 'warning' ? 'border-l-amber-500' :
                insight.type === 'error' ? 'border-l-rose-500' :
                insight.type === 'success' ? 'border-l-emerald-500' : 'border-l-blue-500';
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-3 rounded-lg border border-slate-100 border-l-2 ${borderColor} hover:bg-slate-50 transition-colors`}
                >
                  <div className="flex items-start gap-2.5">
                    <Ic size={16} className={`shrink-0 mt-0.5 ${
                      insight.type === 'warning' ? 'text-amber-500' :
                      insight.type === 'error' ? 'text-rose-500' :
                      insight.type === 'success' ? 'text-emerald-500' : 'text-blue-500'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">{insight.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{insight.description}</p>
                    </div>
                    <button
                      onClick={() => navigate(insight.actionTo)}
                      className="shrink-0 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                    >
                      {insight.action} <ArrowRight size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick AI Actions */}
      <Card variant="default" padding="p-4">
        <CardHeader title="Quick AI Actions" subtitle="Common tasks" icon={Zap} color="primary" />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/app/ai')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
            <Brain size={14} /> AI Advisor
          </button>
          <button onClick={() => navigate('/app/ai/providers')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors">
            <BarChart3 size={14} /> Providers
          </button>
          <button onClick={() => navigate('/app/ai/history')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors">
            <FileText size={14} /> History
          </button>
          <button onClick={() => navigate('/app/ai/settings')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors">
            <RefreshCw size={14} /> Settings
          </button>
        </div>
      </Card>
    </div>
  );
}
