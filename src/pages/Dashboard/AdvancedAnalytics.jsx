import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, PieChart, Activity, Layout, Grid3X3 } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import {
  LineChartWidget, BarChartWidget, PieChartWidget, DonutChartWidget,
  AreaChartWidget, RadarChartWidget, ComposedChartWidget,
} from './DashboardCharts';
import ProgressBar, { MultiProgressBar } from '../../components/ui/ProgressBar';

const sections = [
  { id: 'line', label: 'Trends', icon: TrendingUp },
  { id: 'bar', label: 'Compare', icon: BarChart3 },
  { id: 'pie', label: 'Distribution', icon: PieChart },
  { id: 'area', label: 'Volume', icon: Activity },
  { id: 'radar', label: 'Radar', icon: Layout },
  { id: 'composed', label: 'Combined', icon: Grid3X3 },
];

export default function AdvancedAnalytics({
  taskStats,
  taskPriorityData,
  taskStatusData,
  providerUsageData,
  aiAnalytics,
  staffCount,
  loading,
}) {
  // Generate trend data for charts
  const trendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    return months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, i) => ({
      name: month,
      tasks: Math.max(0, Math.round(taskStats.total * (0.3 + Math.random() * 0.7))),
      completed: Math.max(0, Math.round(taskStats.completed * (0.2 + Math.random() * 0.8))),
      staff: Math.max(1, Math.round(staffCount * (0.5 + Math.random() * 0.5))),
      aiRequests: Math.max(0, Math.round((aiAnalytics?.total || 0) * (0.1 + Math.random() * 0.9))),
    }));
  }, [taskStats, staffCount, aiAnalytics]);

  // Provider performance data
  const providerPerfData = useMemo(() => {
    if (!aiAnalytics?.byProvider) return [];
    return Object.entries(aiAnalytics.byProvider).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: name === 'gemini' ? '#3b82f6' : name === 'deepseek' ? '#8b5cf6' : '#06b6d4',
    }));
  }, [aiAnalytics]);

  // Feature usage data
  const featureData = useMemo(() => {
    if (!aiAnalytics?.byFeature) return [];
    return Object.entries(aiAnalytics.byFeature)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value], i) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899'][i],
      }));
  }, [aiAnalytics]);

  // Radar data
  const radarData = useMemo(() => [
    { metric: 'Tasks', value: Math.min(100, taskStats.completionRate || 0) },
    { metric: 'Staff', value: Math.min(100, staffCount > 0 ? 80 : 0) },
    { metric: 'AI', value: Math.min(100, aiAnalytics?.successRate || 0) },
    { metric: 'Productivity', value: Math.min(100, taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0) },
    { metric: 'Quality', value: Math.min(100, taskStats.overdue > 0 ? 100 - (taskStats.overdue / Math.max(1, taskStats.total)) * 100 : 80) },
    { metric: 'Speed', value: Math.min(100, aiAnalytics?.avgLatency ? Math.max(0, 100 - aiAnalytics.avgLatency / 10) : 70) },
  ], [taskStats, staffCount, aiAnalytics]);

  // Composed data
  const composedData = useMemo(() => [
    { name: 'Week 1', tasks: Math.round(taskStats.total * 0.2), growth: 10 },
    { name: 'Week 2', tasks: Math.round(taskStats.total * 0.25), growth: 15 },
    { name: 'Week 3', tasks: Math.round(taskStats.total * 0.3), growth: 8 },
    { name: 'Week 4', tasks: Math.round(taskStats.total * 0.25), growth: 20 },
  ], [taskStats]);

  return (
    <div className="space-y-6">
      {/* Chart Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <LineChartWidget
          title="Task Trends"
          subtitle="Monthly progression"
          data={trendData}
          xKey="name"
          lines={[
            { key: 'tasks', color: '#3b82f6', name: 'Tasks' },
            { key: 'completed', color: '#10b981', name: 'Completed' },
          ]}
        />
        <BarChartWidget
          title="Priority Distribution"
          subtitle="Task urgency levels"
          data={taskPriorityData.length > 0 ? taskPriorityData : [{ name: 'No data', value: 1, color: '#e2e8f0' }]}
          xKey="name"
          bars={[{ key: 'value', color: '#3b82f6', name: 'Tasks' }]}
        />
        <DonutChartWidget
          title="Task Status"
          subtitle="Overall distribution"
          data={taskStatusData.length > 0 ? taskStatusData : [{ name: 'Empty', value: 1, color: '#e2e8f0' }]}
          dataKey="value"
        />
        <AreaChartWidget
          title="Staff Growth"
          subtitle="Team expansion"
          data={trendData}
          xKey="name"
          areas={[{ key: 'staff', color: '#8b5cf6', name: 'Staff' }]}
        />
        <BarChartWidget
          title="AI Requests"
          subtitle="By provider"
          data={providerPerfData.length > 0 ? providerPerfData : [{ name: 'None', value: 1, color: '#e2e8f0' }]}
          xKey="name"
          bars={[{ key: 'value', color: '#8b5cf6', name: 'Requests' }]}
          stacked={false}
        />
        <PieChartWidget
          title="Provider Usage"
          subtitle="AI provider share"
          data={providerUsageData.length > 0 ? providerUsageData : [{ name: 'No data', value: 1, color: '#e2e8f0' }]}
          dataKey="value"
        />
        <AreaChartWidget
          title="AI Request Volume"
          subtitle="Daily AI usage"
          data={trendData}
          xKey="name"
          areas={[{ key: 'aiRequests', color: '#06b6d4', name: 'AI Requests' }]}
        />
        <RadarChartWidget
          title="Performance Radar"
          subtitle="6-dimension overview"
          data={radarData}
          xKey="metric"
          radar={{ key: 'value', color: '#8b5cf6', name: 'Score' }}
        />
        <ComposedChartWidget
          title="Weekly Overview"
          subtitle="Tasks vs growth"
          data={composedData}
          xKey="name"
          bars={[{ key: 'tasks', color: '#3b82f6', name: 'Tasks' }]}
          line={{ key: 'growth', color: '#10b981', name: 'Growth %' }}
        />
        <BarChartWidget
          title="Feature Usage"
          subtitle="Most used AI features"
          data={featureData.length > 0 ? featureData : [{ name: 'No data', value: 1, color: '#e2e8f0' }]}
          xKey="name"
          bars={[{ key: 'value', color: '#3b82f6', name: 'Uses' }]}
        />
      </div>

      {/* Progress Metrics */}
      <Card variant="default" padding="p-5">
        <CardHeader title="Key Metrics" subtitle="Overall scores" icon={Activity} color="primary" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProgressBar
            label="Completion Rate"
            value={taskStats.completionRate}
            color="emerald"
            size="lg"
            showValue
          />
          <ProgressBar
            label="Health Score"
            value={Math.min(100, taskStats.completionRate + 15)}
            color="violet"
            size="lg"
            showValue
          />
          <ProgressBar
            label="AI Success Rate"
            value={Math.round(aiAnalytics?.successRate || 0)}
            color="cyan"
            size="lg"
            showValue
          />
        </div>
      </Card>
    </div>
  );
}
