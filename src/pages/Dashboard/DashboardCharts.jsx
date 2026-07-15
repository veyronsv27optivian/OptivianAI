import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ComposedChart,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useTheme } from '../../services/ThemeContext';

// ─── Premium Colors ──────────────────────────────────────────────
const COLORS = ['#6366F1', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#F97316', '#EC4899'];

// ─── Theme-aware Chart Tooltip ──────────────────────────────────
function ChartTooltip(isDark) {
  return {
    contentStyle: {
      borderRadius: '12px',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
      fontSize: '12px',
      background: isDark ? 'rgba(15, 23, 42, 0.92)' : '#ffffff',
      backdropFilter: 'blur(16px)',
      color: isDark ? '#F1F5F9' : '#1e293b',
      padding: '10px 14px',
      boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)',
    },
    itemStyle: { color: isDark ? '#94A3B8' : '#64748b', fontSize: '11px' },
    labelStyle: { color: isDark ? '#F1F5F9' : '#0f172a', fontWeight: 600, fontSize: '12px', marginBottom: '4px' },
  };
}

// ─── Empty State ────────────────────────────────────────────────
function EmptyChart({ height = 300 }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height }}>
      <TrendingUp size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
      <p className="text-sm text-slate-400 dark:text-slate-500">No data available yet</p>
    </div>
  );
}

// ─── Chart Container (theme-aware) ────────────────────────
function ChartContainer({ title, subtitle, children, height = 300, loading = false, className = '' }) {
  if (loading) {
    return (
      <div className={`rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 p-5 ${className}`}>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-1 animate-pulse" />
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4 animate-pulse" />
        <div className="h-[200px] bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 p-5 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm group ${className}`}>
      {title && (
        <div className="relative mb-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="relative">
        <ResponsiveContainer width="100%" height={height - 60}>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Line Chart ────────────────────────────────────────────────
export function LineChartWidget({ data, xKey = 'name', lines = [{ key: 'value', color: '#6366F1', name: 'Value' }], ...rest }) {
  const { isDark } = useTheme();
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : '#e2e8f0';
  const tickColor = isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8';
  return (
    <ChartContainer {...rest}>
      <LineChart data={data}>
        <defs>
          {lines.map((l, i) => (
            <linearGradient key={i} id={`lineGrad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={l.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={l.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: tickColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
        <Tooltip {...ChartTooltip(isDark)} />
        {lines.map((l, i) => (
          <Line key={i} type="monotone" dataKey={l.key} stroke={l.color} name={l.name || l.key}
            strokeWidth={2} dot={{ r: 3, fill: l.color, strokeWidth: 0 }} activeDot={{ r: 5, fill: l.color, strokeWidth: 0 }} />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

// ─── Bar Chart ─────────────────────────────────────────────────
export function BarChartWidget({ data, xKey = 'name', bars = [{ key: 'value', color: '#6366F1', name: 'Value' }], stacked = false, ...rest }) {
  const { isDark } = useTheme();
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : '#e2e8f0';
  const tickColor = isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8';
  return (
    <ChartContainer {...rest}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: tickColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
        <Tooltip {...ChartTooltip(isDark)} />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }} />}
        {bars.map((b, i) => (
          <Bar key={i} dataKey={b.key} fill={b.color} name={b.name || b.key}
            radius={[6, 6, 0, 0]} stackId={stacked ? 'stack' : undefined} />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

// ─── Pie Chart ─────────────────────────────────────────────────
export function PieChartWidget({ data, dataKey = 'value', nameKey = 'name', innerRadius = 0, ...rest }) {
  const { isDark } = useTheme();
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart height={300} /></ChartContainer>;
  return (
    <ChartContainer {...rest} height={320}>
      <PieChart>
        <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%"
          innerRadius={innerRadius} outerRadius={100} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...ChartTooltip(isDark)} />
        <Legend wrapperStyle={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }} />
      </PieChart>
    </ChartContainer>
  );
}

// ─── Donut Chart ───────────────────────────────────────────────
export function DonutChartWidget(props) {
  return <PieChartWidget {...props} innerRadius={70} />;
}

// ─── Area Chart ────────────────────────────────────────────────
export function AreaChartWidget({ data, xKey = 'name', areas = [{ key: 'value', color: '#6366F1', name: 'Value' }], ...rest }) {
  const { isDark } = useTheme();
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : '#e2e8f0';
  const tickColor = isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8';
  return (
    <ChartContainer {...rest}>
      <AreaChart data={data}>
        <defs>
          {areas.map((a, i) => (
            <linearGradient key={i} id={`areaGrad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={a.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={a.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: tickColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
        <Tooltip {...ChartTooltip(isDark)} />
        {areas.map((a, i) => (
          <Area key={i} type="monotone" dataKey={a.key} stroke={a.color} fill={`url(#areaGrad${i})`}
            name={a.name || a.key} strokeWidth={2} />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

// ─── Radar Chart ───────────────────────────────────────────────
export function RadarChartWidget({ data, xKey = 'name', radar = { key: 'value', color: '#6366F1' }, ...rest }) {
  const { isDark } = useTheme();
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0';
  const tickColor = isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8';
  const tickColorDim = isDark ? 'rgba(255,255,255,0.25)' : '#94a3b8';
  return (
    <ChartContainer {...rest}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke={gridColor} />
        <PolarAngleAxis dataKey={xKey} tick={{ fontSize: 10, fill: tickColor }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: tickColorDim }} axisLine={{ stroke: gridColor }} />
        <Radar dataKey={radar.key} stroke={radar.color} fill={radar.color} fillOpacity={0.15} name={radar.name || radar.key} />
        <Tooltip {...ChartTooltip(isDark)} />
      </RadarChart>
    </ChartContainer>
  );
}

// ─── Composed Chart (Bar + Line) ───────────────────────────────
export function ComposedChartWidget({ data, xKey = 'name', bars = [], line, ...rest }) {
  const { isDark } = useTheme();
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : '#e2e8f0';
  const tickColor = isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8';
  return (
    <ChartContainer {...rest}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: tickColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
        <Tooltip {...ChartTooltip(isDark)} />
        <Legend wrapperStyle={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b' }} />
        {bars.map((b, i) => (
          <Bar key={i} dataKey={b.key} fill={b.color} name={b.name || b.key} radius={[6, 6, 0, 0]} />
        ))}
        {line && <Line type="monotone" dataKey={line.key} stroke={line.color} name={line.name || line.key} strokeWidth={2} dot={{ r: 3 }} />}
      </ComposedChart>
    </ChartContainer>
  );
}

export default { LineChartWidget, BarChartWidget, PieChartWidget, DonutChartWidget, AreaChartWidget, RadarChartWidget, ComposedChartWidget };
