import { motion } from 'framer-motion';

// ─── Theme-aware Skeleton Block ───────────────────────────────
function GlassSkeleton({ className = '', height = 'auto', width = '100%' }) {
  return (
    <div
      className={`rounded-xl bg-slate-200 dark:bg-slate-700/50 animate-pulse ${className}`}
      style={{ height, width }}
    />
  );
}

// ─── KPI Grid Skeleton ──────────────────────────────────────────
export function KPIGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 p-5 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <GlassSkeleton className="h-2.5 w-16" />
            <GlassSkeleton className="w-8 h-8 rounded-xl" />
          </div>
          <GlassSkeleton className="h-7 w-24 mb-2" />
          <GlassSkeleton className="h-2.5 w-20" />
        </div>
      ))}
    </div>
  );
}

// ─── Chart Skeleton ─────────────────────────────────────────────
export function ChartSkeleton({ height = 300 }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 p-5 animate-pulse">
      <GlassSkeleton className="h-3 w-1/3 mb-1" />
      <GlassSkeleton className="h-2 w-1/4 mb-4" />
      <div className="rounded-xl bg-slate-100 dark:bg-slate-700/30 animate-pulse" style={{ height: height - 90 }} />
    </div>
  );
}

// ─── Widget Skeleton ────────────────────────────────────────────
export function WidgetSkeleton({ height = 200 }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <GlassSkeleton className="h-3 w-24" />
        <GlassSkeleton className="w-8 h-8 rounded-xl" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 mb-3">
          <GlassSkeleton className="w-8 h-8 rounded-xl" />
          <div className="flex-1">
            <GlassSkeleton className="h-3 w-3/4 mb-1" />
            <GlassSkeleton className="h-2 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section Skeleton ───────────────────────────────────────────
export function SectionSkeleton({ height = 200 }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 p-5 animate-pulse" style={{ height }}>
      <div className="flex items-center gap-3 mb-4">
        <GlassSkeleton className="w-8 h-8 rounded-xl" />
        <div>
          <GlassSkeleton className="h-3.5 w-32 mb-1" />
          <GlassSkeleton className="h-2.5 w-20" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <GlassSkeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

// ─── Full Dashboard Skeleton ────────────────────────────────────
export default function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GlassSkeleton className="w-10 h-10 rounded-xl" />
          <div>
            <GlassSkeleton className="h-5 w-36 mb-1" />
            <GlassSkeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GlassSkeleton className="w-8 h-8 rounded-xl" />
          <GlassSkeleton className="w-20 h-7 rounded-full" />
          <GlassSkeleton className="w-16 h-7 rounded-full" />
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <GlassSkeleton key={i} className="h-6 w-28 rounded-full" />
        ))}
      </div>

      {/* KPI Grid */}
      <KPIGridSkeleton />

      {/* Charts row */}
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
      <GlassSkeleton className="h-10 rounded-xl" />
    </div>
  );
}
