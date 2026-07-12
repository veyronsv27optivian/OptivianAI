import { motion } from 'framer-motion';

// ─── KPI Grid Skeleton ────────────────────────────────────────────
export function KPIGridSkeleton({ count = 18 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-2.5 bg-slate-200 rounded w-16" />
            <div className="w-8 h-8 rounded-lg bg-slate-200" />
          </div>
          <div className="h-6 bg-slate-200 rounded w-24 mb-1.5" />
          <div className="h-2 bg-slate-200 rounded w-12" />
        </div>
      ))}
    </div>
  );
}

// ─── Chart Skeleton ───────────────────────────────────────────────
export function ChartSkeleton({ height = 300 }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-1" />
      <div className="h-3 bg-slate-200 rounded w-1/4 mb-4" />
      <div
        className="rounded-lg bg-slate-100"
        style={{
          height: height - 80,
          background: 'linear-gradient(135deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
    </div>
  );
}

// ─── Widget Skeleton ──────────────────────────────────────────────
export function WidgetSkeleton({ height = 200 }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 bg-slate-200 rounded w-24" />
        <div className="w-8 h-8 rounded-lg bg-slate-200" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200" />
          <div className="flex-1">
            <div className="h-3 bg-slate-200 rounded w-3/4 mb-1" />
            <div className="h-2 bg-slate-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section Skeleton ─────────────────────────────────────────────
export function SectionSkeleton({ height = 200 }) {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5" style={{ height }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-slate-200" />
        <div>
          <div className="h-3.5 bg-slate-200 rounded w-32 mb-1" />
          <div className="h-2.5 bg-slate-200 rounded w-20" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-3 bg-slate-200 rounded w-full" />
        ))}
      </div>
    </div>
  );
}

// ─── Full Dashboard Skeleton ──────────────────────────────────────
export default function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-200 animate-pulse" />
          <div>
            <div className="h-5 bg-slate-200 rounded w-36 animate-pulse mb-1" />
            <div className="h-3 bg-slate-200 rounded w-48 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse" />
          <div className="w-20 h-7 rounded-full bg-slate-200 animate-pulse" />
          <div className="w-16 h-7 rounded-full bg-slate-200 animate-pulse" />
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-6 w-28 rounded-full bg-slate-200 animate-pulse" />
        ))}
      </div>

      {/* KPI Grid */}
      <KPIGridSkeleton />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartSkeleton height={350} />
        <ChartSkeleton height={350} />
        <ChartSkeleton height={350} />
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-5">
          <WidgetSkeleton height={320} />
          <WidgetSkeleton height={260} />
        </div>
        <div className="space-y-5">
          <WidgetSkeleton height={320} />
          <WidgetSkeleton height={260} />
        </div>
        <div className="space-y-5">
          <WidgetSkeleton height={320} />
          <WidgetSkeleton height={260} />
        </div>
      </div>

      {/* AI Panel */}
      <WidgetSkeleton height={300} />

      {/* Quick Actions */}
      <WidgetSkeleton height={250} />

      {/* Footer */}
      <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
    </div>
  );
}
