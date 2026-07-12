import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ComposedChart,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

// ─── Colors ──────────────────────────────────────────────────────
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];
const GRADIENT_FILL = { fill: 'url(#colorGrad)' };

// ─── Empty State ──────────────────────────────────────────────────
function EmptyChart({ height = 300 }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height }}>
      <TrendingUp size={32} className="text-slate-300 mb-2" />
      <p className="text-sm text-slate-400">No data available yet</p>
    </div>
  );
}

// ─── Chart Container ──────────────────────────────────────────────
function ChartContainer({ title, subtitle, children, height = 300, loading = false, className = '' }) {
  if (loading) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-1 animate-pulse" />
        <div className="h-3 bg-slate-200 rounded w-1/4 mb-4 animate-pulse" />
        <div className="h-[220px] bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height - 60}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────
export function LineChartWidget({ data, xKey = 'name', lines = [{ key: 'value', color: '#3b82f6', name: 'Value' }], ...rest }) {
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
  return (
    <ChartContainer {...rest}>
      <LineChart data={data}>
        <defs>
          <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
        {lines.map((l, i) => (
          <Line key={i} type="monotone" dataKey={l.key} stroke={l.color} name={l.name || l.key}
            strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────
export function BarChartWidget({ data, xKey = 'name', bars = [{ key: 'value', color: '#3b82f6', name: 'Value' }], stacked = false, ...rest }) {
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
  return (
    <ChartContainer {...rest}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: '11px' }} />}
        {bars.map((b, i) => (
          <Bar key={i} dataKey={b.key} fill={b.color} name={b.name || b.key}
            radius={[4, 4, 0, 0]} stackId={stacked ? 'stack' : undefined} />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

// ─── Pie Chart ────────────────────────────────────────────────────
export function PieChartWidget({ data, dataKey = 'value', nameKey = 'name', innerRadius = 0, ...rest }) {
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
        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
      </PieChart>
    </ChartContainer>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────
export function DonutChartWidget(props) {
  return <PieChartWidget {...props} innerRadius={60} />;
}

// ─── Area Chart ───────────────────────────────────────────────────
export function AreaChartWidget({ data, xKey = 'name', areas = [{ key: 'value', color: '#3b82f6', name: 'Value' }], ...rest }) {
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
  return (
    <ChartContainer {...rest}>
      <AreaChart data={data}>
        <defs>
          {areas.map((a, i) => (
            <linearGradient key={i} id={`areaGrad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={a.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={a.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
        {areas.map((a, i) => (
          <Area key={i} type="monotone" dataKey={a.key} stroke={a.color} fill={`url(#areaGrad${i})`}
            name={a.name || a.key} strokeWidth={2} />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

// ─── Radar Chart ──────────────────────────────────────────────────
export function RadarChartWidget({ data, xKey = 'name', radar = { key: 'value', color: '#3b82f6' }, ...rest }) {
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
  return (
    <ChartContainer {...rest}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey={xKey} tick={{ fontSize: 10 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Radar dataKey={radar.key} stroke={radar.color} fill={radar.color} fillOpacity={0.2} name={radar.name || radar.key} />
        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
      </RadarChart>
    </ChartContainer>
  );
}

// ─── Composed Chart (Bar + Line) ──────────────────────────────────
export function ComposedChartWidget({ data, xKey = 'name', bars = [], line, ...rest }) {
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
  return (
    <ChartContainer {...rest}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
        {bars.map((b, i) => (
          <Bar key={i} dataKey={b.key} fill={b.color} name={b.name || b.key} radius={[4, 4, 0, 0]} />
        ))}
        {line && <Line type="monotone" dataKey={line.key} stroke={line.color} name={line.name || line.key} strokeWidth={2} />}
      </ComposedChart>
    </ChartContainer>
  );
}

export default { LineChartWidget, BarChartWidget, PieChartWidget, DonutChartWidget, AreaChartWidget, RadarChartWidget, ComposedChartWidget };
