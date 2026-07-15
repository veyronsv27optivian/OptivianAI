import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ComposedChart,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

// ─── Premium Colors ──────────────────────────────────────────────
const COLORS = ['#6366F1', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#F97316', '#EC4899'];

// ─── Premium Chart Tooltip ──────────────────────────────────────
function ChartTooltip() {
  return {
    contentStyle: {
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.08)',
      fontSize: '12px',
      background: 'rgba(15, 23, 42, 0.92)',
      backdropFilter: 'blur(16px)',
      color: '#F1F5F9',
      padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    },
    itemStyle: { color: '#94A3B8', fontSize: '11px' },
    labelStyle: { color: '#F1F5F9', fontWeight: 600, fontSize: '12px', marginBottom: '4px' },
  };
}

// ─── Empty State ────────────────────────────────────────────────
function EmptyChart({ height = 300 }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height }}>
      <TrendingUp size={32} className="text-white/20 mb-2" />
      <p className="text-sm text-white/40">No data available yet</p>
    </div>
  );
}

// ─── Premium Chart Container (dark glass) ────────────────────────
function ChartContainer({ title, subtitle, children, height = 300, loading = false, className = '' }) {
  if (loading) {
    return (
      <div className={`rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-xl p-5 ${className}`}>
        <div className="h-3 bg-white/10 rounded w-1/3 mb-1 animate-pulse" />
        <div className="h-2 bg-white/10 rounded w-1/4 mb-4 animate-pulse" />
        <div className="h-[200px] bg-white/[0.03] rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite' }} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl p-5 transition-all duration-300 hover:border-white/10 hover:shadow-2xl hover:shadow-blue-500/5 group ${className}`}>
      {/* Glass sheen overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      {title && (
        <div className="relative mb-4">
          <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
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
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
        <Tooltip {...ChartTooltip()} />
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
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
  return (
    <ChartContainer {...rest}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
        <Tooltip {...ChartTooltip()} />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />}
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
        <Tooltip {...ChartTooltip()} />
        <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
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
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
        <Tooltip {...ChartTooltip()} />
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
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
  return (
    <ChartContainer {...rest}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis dataKey={xKey} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} />
        <Radar dataKey={radar.key} stroke={radar.color} fill={radar.color} fillOpacity={0.15} name={radar.name || radar.key} />
        <Tooltip {...ChartTooltip()} />
      </RadarChart>
    </ChartContainer>
  );
}

// ─── Composed Chart (Bar + Line) ───────────────────────────────
export function ComposedChartWidget({ data, xKey = 'name', bars = [], line, ...rest }) {
  if (!data?.length) return <ChartContainer {...rest}><EmptyChart /></ChartContainer>;
  return (
    <ChartContainer {...rest}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
        <Tooltip {...ChartTooltip()} />
        <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
        {bars.map((b, i) => (
          <Bar key={i} dataKey={b.key} fill={b.color} name={b.name || b.key} radius={[6, 6, 0, 0]} />
        ))}
        {line && <Line type="monotone" dataKey={line.key} stroke={line.color} name={line.name || line.key} strokeWidth={2} dot={{ r: 3 }} />}
      </ComposedChart>
    </ChartContainer>
  );
}

export default { LineChartWidget, BarChartWidget, PieChartWidget, DonutChartWidget, AreaChartWidget, RadarChartWidget, ComposedChartWidget };
