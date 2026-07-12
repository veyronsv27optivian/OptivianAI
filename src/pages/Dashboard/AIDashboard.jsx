import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, MessageSquare, FileText, History, BarChart3,
  Server, Zap, Clock, ArrowRight,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge, { StatusDot } from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';

export default function AIDashboard({
  aiAnalytics,
  providers,
  activeProviderName,
  loading,
}) {
  const navigate = useNavigate();

  const providerUsage = useMemo(() => {
    if (!aiAnalytics?.byProvider) return [];
    return Object.entries(aiAnalytics.byProvider)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count], i) => {
        const total = aiAnalytics.total || 1;
        const pct = (count / total) * 100;
        const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'];
        return {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          count,
          pct: Math.round(pct),
          color: colors[i % colors.length],
        };
      });
  }, [aiAnalytics]);

  const featureUsage = useMemo(() => {
    if (!aiAnalytics?.byFeature) return [];
    return Object.entries(aiAnalytics.byFeature)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, count]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count,
      }));
  }, [aiAnalytics]);

  return (
    <Card variant="default" padding="p-5">
      <CardHeader
        title="AI Dashboard"
        subtitle="Usage & analytics"
        icon={Brain}
        color="violet"
        action={
          <button onClick={() => navigate('/app/ai')}
            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1">
            Open AI <ArrowRight size={12} />
          </button>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Requests', value: aiAnalytics?.total || 0, icon: BarChart3, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Success Rate', value: aiAnalytics?.successRate ? `${Math.round(aiAnalytics.successRate)}%` : 'N/A', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Avg Latency', value: aiAnalytics?.avgLatency ? `${aiAnalytics.avgLatency}ms` : 'N/A', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Active', value: activeProviderName || 'None', icon: Server, color: 'text-violet-600', bg: 'bg-violet-100', mono: false },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-2.5 rounded-lg ${stat.bg}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={10} className={stat.color} />
                <span className="text-[10px] font-medium text-slate-500">{stat.label}</span>
              </div>
              <p className={`text-xs font-bold ${stat.color} ${stat.mono === false ? '' : 'tabular-nums'} truncate`}>
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Provider Usage Breakdown */}
      {providerUsage.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
            <BarChart3 size={12} /> Provider Usage
          </h4>
          <div className="flex gap-0.5 h-3 rounded-full overflow-hidden bg-slate-100">
            {providerUsage.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, p.pct)}%` }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ backgroundColor: p.color }}
                title={`${p.name}: ${p.pct}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-1.5">
            {providerUsage.map(p => (
              <span key={p.name} className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}: {p.pct}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Feature Usage */}
      {featureUsage.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
            <FileText size={12} /> Top Features
          </h4>
          <div className="space-y-1.5">
            {featureUsage.map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50"
              >
                <span className="text-xs text-slate-600 truncate mr-2">{f.name}</span>
                <Badge color="slate" size="xs">{f.count} uses</Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Token Usage */}
      {aiAnalytics?.totalTokens > 0 && (
        <div className="mb-4">
          <ProgressBar
            label="Token Usage"
            value={Math.min(100, ((aiAnalytics.totalTokens || 0) / 100000) * 100)}
            color="violet"
            size="md"
            showValue
          />
          <p className="text-[10px] text-slate-400 mt-1">
            {(aiAnalytics.totalTokens || 0).toLocaleString()} total tokens used
          </p>
        </div>
      )}

      {/* AI Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
        <button onClick={() => navigate('/app/ai')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors">
          <MessageSquare size={12} /> New Chat
        </button>
        <button onClick={() => navigate('/app/ai/history')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium hover:bg-slate-200 transition-colors">
          <History size={12} /> History
        </button>
        <button onClick={() => navigate('/app/ai/providers')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium hover:bg-slate-200 transition-colors">
          <Server size={12} /> Providers
        </button>
        <button onClick={() => navigate('/app/ai/settings')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium hover:bg-slate-200 transition-colors">
          <Brain size={12} /> Settings
        </button>
      </div>
    </Card>
  );
}
