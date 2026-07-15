import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, TrendingUp, PiggyBank, AlertTriangle } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';

function Gauge({ value, max = 100, label, color = 'emerald', size = 'md' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    emerald: 'stroke-emerald-500',
    amber: 'stroke-amber-500',
    red: 'stroke-red-500',
    blue: 'stroke-blue-500',
    violet: 'stroke-violet-500',
  };

  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="80" height="48" viewBox="0 0 80 48" className="-rotate-90">
        <path d="M 8 44 A 36 36 0 1 1 72 44" fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
        <path d="M 8 44 A 36 36 0 1 1 72 44" fill="none" className={colors[color] || colors.emerald} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${circumference}`} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <span className={`text-xs font-bold mt-1 ${
        pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600'
      }`}>{value.toLocaleString()}</span>
    </div>
  );
}

function MetricCard({ label, value, prefix, suffix, icon: Icon, color }) {
  return (
    <div className="p-3 rounded-lg bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon size={12} className={`text-${color}-500`} />}
        <span className="text-[10px] text-slate-500">{label}</span>
      </div>
      <p className={`text-sm font-bold text-${color}-600`}>
        {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value}{suffix}
      </p>
    </div>
  );
}

export default function FinancialCharts({ data }) {
  const {
    scenarios,
    metrics,
    revenueForecast,
    expenseProjections,
    cashFlowData,
  } = useMemo(() => {
    const d = data || {};
    const s = d.scenarios || {};

    // Build chart data from baseline scenario or revenue data
    const baseline = s.baseline || s.mostLikely || s.baseCase || {};
    const revenue = baseline.revenue || revenueForecast || [];
    const expenses = baseline.expenses || expenseProjections || [];

    // If no structured data, try to extract from text-based forecast data
    const monthlyData = Array.isArray(revenue) ? revenue.map((r, i) => ({
      month: r.month || r.name || `M${i + 1}`,
      revenue: r.value ?? r.revenue ?? 0,
      expenses: expenses[i]?.value ?? expenses[i]?.expenses ?? (Array.isArray(expenses) ? expenses[i] : 0),
    })) : [];

    // Cash flow
    const cashFlow = Array.isArray(cashFlowData) ? cashFlowData.map((c, i) => ({
      month: c.month || c.name || `M${i + 1}`,
      inflow: c.inflow || c.revenue || 0,
      outflow: c.outflow || c.expenses || 0,
      balance: c.balance ?? (c.inflow - c.outflow),
    })) : monthlyData.map(m => ({
      month: m.month,
      inflow: m.revenue,
      outflow: m.expenses,
      balance: (m.revenue || 0) - (m.expenses || 0),
    }));

    return {
      scenarios: {
        bestCase: s.bestCase || s.optimistic || null,
        baseline: baseline,
        worstCase: s.worstCase || s.pessimistic || null,
      },
      metrics: d.metrics || {},
      revenueForecast: monthlyData,
      cashFlowData: cashFlow,
    };
  }, [data]);

  if (revenueForecast.length === 0 && Object.keys(metrics).length === 0) return null;

  const hasMetrics = Object.keys(metrics).length > 0;
  const hasCharts = revenueForecast.length > 0;

  return (
    <div className="premium-card dark:dark-card-metallic p-5">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign size={16} className="text-emerald-500" />
        <h3 className="text-sm font-bold text-slate-800">Financial Forecast</h3>
        <span className="text-xs text-slate-400">{revenueForecast.length} periods</span>
      </div>

      {/* Key Metrics Row */}
      {hasMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {metrics.grossMargin !== undefined && (
            <MetricCard label="Gross Margin" value={metrics.grossMargin} suffix="%" icon={TrendingUp} color="emerald" />
          )}
          {metrics.burnRate !== undefined && (
            <MetricCard label="Burn Rate" value={metrics.burnRate} prefix="$" icon={PiggyBank} color="amber" />
          )}
          {metrics.runway !== undefined && (
            <MetricCard label="Runway" value={metrics.runway} suffix=" mo" icon={AlertTriangle} color="violet" />
          )}
          {metrics.paybackPeriod !== undefined && (
            <MetricCard label="Payback" value={metrics.paybackPeriod} suffix=" mo" icon={DollarSign} color="blue" />
          )}
        </div>
      )}

      {/* Revenue Forecast Chart */}
      {hasCharts && (
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueForecast}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" name="Revenue" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="none" name="Expenses" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cash Flow Bar Chart */}
      {cashFlowData.length > 0 && (
        <div className="h-36">
          <h4 className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Cash Flow</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
              <Bar dataKey="balance" fill="#8b5cf6" name="Net Cash Flow" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
