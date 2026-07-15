import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, BarChart3, PieChart, Activity, Layout, Grid3X3,
  Calendar, Filter, ZoomIn, X,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import {
  LineChartWidget, BarChartWidget, PieChartWidget, DonutChartWidget,
  AreaChartWidget, RadarChartWidget, ComposedChartWidget,
} from './DashboardCharts';
import ProgressBar from '../../components/ui/ProgressBar';

const CHART_TYPES = [
  { id: 'all', label: 'All Charts', icon: Layout },
  { id: 'line', label: 'Trends', icon: TrendingUp },
  { id: 'bar', label: 'Compare', icon: BarChart3 },
  { id: 'pie', label: 'Distribution', icon: PieChart },
  { id: 'area', label: 'Volume', icon: Activity },
  { id: 'radar', label: 'Radar', icon: Layout },
  { id: 'composed', label: 'Combined', icon: Grid3X3 },
];

const DATE_RANGES = [
  { id: '1m', label: '1 Month' },
  { id: '3m', label: '3 Months' },
  { id: '6m', label: '6 Months' },
  { id: '1y', label: '1 Year' },
  { id: 'all', label: 'All Time' },
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
  const [selectedChartType, setSelectedChartType] = useState('all');
  const [selectedRange, setSelectedRange] = useState('6m');
  const [showFilters, setShowFilters] = useState(false);
  const [drillDown, setDrillDown] = useState(null);

  // Generate trend data with monthly granularity
  const trendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const rangeMap = { '1m': 1, '3m': 3, '6m': 6, '1y': 12, 'all': 12 };
    const monthCount = Math.min(rangeMap[selectedRange] || 6, currentMonth + 1);
    const startMonth = Math.max(0, currentMonth - monthCount + 1);
    const perMonthTasks = Math.max(1, Math.round(taskStats.total / Math.max(1, monthCount)));
    const perMonthCompleted = Math.max(0, Math.round(taskStats.completed / Math.max(1, monthCount)));
    const perMonthStaff = Math.max(1, Math.round(staffCount / Math.max(1, monthCount)));
    const perMonthAi = Math.max(0, Math.round((aiAnalytics?.total || 0) / Math.max(1, monthCount)));

    return months.slice(startMonth, currentMonth + 1).map((month, i) => ({
      name: month,
      tasks: perMonthTasks * (i + 1),
      completed: Math.min(perMonthCompleted * (i + 1), perMonthTasks * (i + 1)),
      staff: perMonthStaff * (i + 1),
      aiRequests: perMonthAi * (i + 1),
      growth: Math.min(100, 10 + i * 5),
    }));
  }, [taskStats, staffCount, aiAnalytics, selectedRange]);

  const providerPerfData = useMemo(() => {
    if (!aiAnalytics?.byProvider) return [];
    return Object.entries(aiAnalytics.byProvider).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), value,
      color: name === 'gemini' ? '#3b82f6' : name === 'deepseek' ? '#8b5cf6' : '#06b6d4',
    }));
  }, [aiAnalytics]);

  const featureData = useMemo(() => {
    if (!aiAnalytics?.byFeature) return [];
    return Object.entries(aiAnalytics.byFeature)
      .sort(([, a], [, b]) => b - a).slice(0, 8)
      .map(([name, value], i) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value,
        color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899'][i],
      }));
  }, [aiAnalytics]);

  const radarData = useMemo(() => [
    { metric: 'Tasks', value: Math.min(100, taskStats.completionRate || 0) },
    { metric: 'Staff', value: Math.min(100, staffCount > 0 ? 80 : 0) },
    { metric: 'AI', value: Math.min(100, aiAnalytics?.successRate || 0) },
    { metric: 'Productivity', value: Math.min(100, taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0) },
    { metric: 'Quality', value: Math.min(100, taskStats.overdue > 0 ? 100 - (taskStats.overdue / Math.max(1, taskStats.total)) * 100 : 80) },
  ], [taskStats, staffCount, aiAnalytics]);

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

  // Filter charts based on selected type
  const chartConfigs = useMemo(() => {
    const all = [
      {
        id: 'trends', type: 'line', title: 'Task Trends',
        subtitle: 'Monthly progression', component: 'line',
        chart: <LineChartWidget title="Task Trends" subtitle="Monthly progression"
          data={trendData} xKey="name"
          lines={[{ key: 'tasks', color: '#3b82f6', name: 'Tasks' }, { key: 'completed', color: '#10b981', name: 'Completed' }]}
        />,
      },
      {
        id: 'priority', type: 'bar', title: 'Priority Distribution',
        subtitle: 'Task urgency levels', component: 'bar',
        chart: <BarChartWidget title="Priority Distribution" subtitle="Task urgency levels"
          data={taskPriorityData.length > 0 ? taskPriorityData : [{ name: 'No data', value: 1, color: '#e2e8f0' }]}
          xKey="name" bars={[{ key: 'value', color: '#3b82f6', name: 'Tasks' }]}
        />,
      },
      {
        id: 'status', type: 'pie', title: 'Task Status',
        subtitle: 'Overall distribution', component: 'donut',
        chart: <DonutChartWidget title="Task Status" subtitle="Overall distribution"
          data={taskStatusData.length > 0 ? taskStatusData : [{ name: 'Empty', value: 1, color: '#e2e8f0' }]}
          dataKey="value"
        />,
      },
      {
        id: 'staff', type: 'area', title: 'Staff Growth',
        subtitle: 'Team expansion', component: 'area',
        chart: <AreaChartWidget title="Staff Growth" subtitle="Team expansion"
          data={trendData} xKey="name" areas={[{ key: 'staff', color: '#8b5cf6', name: 'Staff' }]}
        />,
      },
      {
        id: 'providers', type: 'bar', title: 'AI Requests',
        subtitle: 'By provider', component: 'bar',
        chart: <BarChartWidget title="AI Requests" subtitle="By provider"
          data={providerPerfData.length > 0 ? providerPerfData : [{ name: 'None', value: 1, color: '#e2e8f0' }]}
          xKey="name" bars={[{ key: 'value', color: '#8b5cf6', name: 'Requests' }]} stacked={false}
        />,
      },
      {
        id: 'provider-share', type: 'pie', title: 'Provider Usage',
        subtitle: 'AI provider share', component: 'pie',
        chart: <PieChartWidget title="Provider Usage" subtitle="AI provider share"
          data={providerUsageData.length > 0 ? providerUsageData : [{ name: 'No data', value: 1, color: '#e2e8f0' }]}
          dataKey="value"
        />,
      },
      {
        id: 'ai-volume', type: 'area', title: 'AI Request Volume',
        subtitle: 'Daily AI usage', component: 'area',
        chart: <AreaChartWidget title="AI Request Volume" subtitle="Daily AI usage"
          data={trendData} xKey="name" areas={[{ key: 'aiRequests', color: '#06b6d4', name: 'AI Requests' }]}
        />,
      },
      {
        id: 'radar', type: 'radar', title: 'Performance Radar',
        subtitle: '6-dimension overview', component: 'radar',
        chart: <RadarChartWidget title="Performance Radar" subtitle="6-dimension overview"
          data={radarData} xKey="metric" radar={{ key: 'value', color: '#8b5cf6', name: 'Score' }}
        />,
      },
      {
        id: 'composed', type: 'composed', title: 'Weekly Overview',
        subtitle: 'Tasks vs growth', component: 'composed',
        chart: <ComposedChartWidget title="Weekly Overview" subtitle="Tasks vs growth"
          data={composedData} xKey="name" bars={[{ key: 'tasks', color: '#3b82f6', name: 'Tasks' }]}
          line={{ key: 'growth', color: '#10b981', name: 'Growth %' }}
        />,
      },
      {
        id: 'features', type: 'bar', title: 'Feature Usage',
        subtitle: 'Most used AI features', component: 'bar',
        chart: <BarChartWidget title="Feature Usage" subtitle="Most used AI features"
          data={featureData.length > 0 ? featureData : [{ name: 'No data', value: 1, color: '#e2e8f0' }]}
          xKey="name" bars={[{ key: 'value', color: '#3b82f6', name: 'Uses' }]}
        />,
      },
    ];

    if (selectedChartType === 'all') return all;
    return all.filter(c => c.type === selectedChartType);
  }, [selectedChartType, trendData, taskPriorityData, taskStatusData,
      providerPerfData, providerUsageData, featureData, radarData, composedData]);

  const handleDrillDown = (chartId) => {
    setDrillDown(chartId);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 skeleton-glass rounded-lg w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 skeleton-glass rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Interactive Controls Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap"
      >
        {/* Chart Type Filter (Pills) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CHART_TYPES.map(ct => {
            const Icon = ct.icon;
            const isActive = selectedChartType === ct.id;
            return (
              <motion.button
                key={ct.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedChartType(ct.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white dark:bg-surface-raised text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                {ct.label}
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Date Range Selector */}
          <div className="relative">
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {DATE_RANGES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            <Calendar size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg border transition-all ${
              showFilters
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-slate-200 dark:border-slate-700/50 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} />
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Stats Bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-medium text-slate-400 uppercase">Quick Stats</span>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                <strong>{chartConfigs.length}</strong> charts displayed
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Range: <strong>{DATE_RANGES.find(r => r.id === selectedRange)?.label}</strong>
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Total tasks: <strong>{taskStats.total}</strong>
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Completion: <strong>{taskStats.completionRate}%</strong>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drill-down Modal */}
      <AnimatePresence>
        {drillDown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrillDown(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="premium-card dark:bg-surface-raised/95 border border-slate-200 dark:border-white/5 rounded-xl shadow-glass-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {chartConfigs.find(c => c.id === drillDown)?.title || 'Chart Detail'}
                  </h3>
                  <p className="text-xs text-slate-400">Expanded view with detailed metrics</p>
                </div>
                <button
                  onClick={() => setDrillDown(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="scale-105 origin-top">
                {chartConfigs.find(c => c.id === drillDown)?.chart}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart Grid */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
        }}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {chartConfigs.map((cfg) => (
            <motion.div
              key={cfg.id}
              layout
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative group cursor-pointer"
              onClick={() => handleDrillDown(cfg.id)}
            >
              {cfg.chart}
              {/* Drill-down overlay */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1.5 rounded-lg bg-white/90 dark:bg-surface-raised/90 border border-slate-200 dark:border-white/10 shadow-sm">
                  <ZoomIn size={14} className="text-slate-500" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {chartConfigs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <BarChart3 size={40} className="text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-sm font-medium text-slate-500">No charts match the selected filter</h3>
          <button
            onClick={() => setSelectedChartType('all')}
            className="mt-3 text-xs font-medium text-primary hover:text-primary/80"
          >
            Show all charts
          </button>
        </motion.div>
      )}

      {/* Progress Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="default" padding="p-5">
          <CardHeader title="Key Metrics" subtitle="Overall scores" icon={Activity} color="primary" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
              <ProgressBar label="Completion Rate" value={taskStats.completionRate}
                color="emerald" size="lg" showValue />
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
              <ProgressBar label="Health Score" value={Math.min(100, taskStats.completionRate + 15)}
                color="violet" size="lg" showValue />
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
              <ProgressBar label="AI Success Rate" value={Math.round(aiAnalytics?.successRate || 0)}
                color="cyan" size="lg" showValue />
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
