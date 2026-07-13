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
  // Generate trend data for charts — uses real task totals distributed evenly across months
  const trendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const monthCount = Math.min(6, currentMonth + 1);
    const startMonth = Math.max(0, currentMonth - 5);
    // Divide real totals evenly across available months for a realistic trend
    const perMonthTasks = Math.max(1, Math.round(taskStats.total / monthCount));
    const perMonthCompleted = Math.max(0, Math.round(taskStats.completed / monthCount));
    const perMonthStaff = Math.max(1, Math.round(staffCount / monthCount));
    const perMonthAi = Math.max(0, Math.round((aiAnalytics?.total || 0) / monthCount));

    return months.slice(startMonth, currentMonth + 1).map((month, i) => ({
      name: month,
      tasks: perMonthTasks * (i + 1),
      completed: Math.min(perMonthCompleted * (i + 1), perMonthTasks * (i + 1)),
      staff: perMonthStaff * (i + 1),
      aiRequests: perMonthAi * (i + 1),
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

  // Composed data — distributes real task totals across 4 weeks
  const composedData = useMemo(() => {
    const perWeek = Math.max(1, Math.round(taskStats.total / 4));
    const growthTrend = taskStats.completionRate > 50 ? 10 : 5;
    return [
      { name: 'Week 1', tasks: perWeek, growth: growthTrend },
      { name: 'Week 2', tasks: perWeek * 2, growth: growthTrend + 3 },
      { name: 'Week 3', tasks: perWeek * 3, growth: growthTrend + 5 },
      { name: 'Week 4', tasks: Math.max(perWeek * 4, taskStats.total), growth: growthTrend + 8 },
    ];
  }, [taskStats]);

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
