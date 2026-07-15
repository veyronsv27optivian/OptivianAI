import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { BadgeCheck, AlertTriangle, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  Green: { icon: BadgeCheck, bg: 'bg-emerald-100 text-emerald-600', label: 'Ready' },
  Yellow: { icon: AlertTriangle, bg: 'bg-amber-100 text-amber-600', label: 'Needs Work' },
  Red: { icon: XCircle, bg: 'bg-red-100 text-red-600', label: 'Critical' },
};

function GaugeMeter({ value, label, color, index }) {
  const barColor = value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-2"
    >
      <span className="text-[10px] text-slate-500 w-24 truncate shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: index * 0.05 }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      <span className="text-[10px] font-semibold text-slate-600 w-8 text-right">{value}%</span>
    </motion.div>
  );
}

export default function LaunchRadar({ data }) {
  const {
    overallScore,
    dimensions,
    criticalGaps,
    status
  } = useMemo(() => {
    const d = data || {};
    const dims = d.dimensions || d.dimensionScores || [];
    return {
      overallScore: d.overallScore ?? d.overall_score ?? (dims.length > 0 ? Math.round(dims.reduce((s, dim) => s + (dim.score || 0), 0) / dims.length) : null),
      dimensions: dims.map(dim => ({
        name: dim.name || dim.dimension || dim.metric || '',
        score: dim.score ?? 0,
        status: dim.status || (dim.score >= 70 ? 'Green' : dim.score >= 40 ? 'Yellow' : 'Red'),
        actionItems: dim.actionItems || dim.action_items || [],
      })),
      criticalGaps: d.criticalGaps || d.critical_gaps || [],
      status: d.status || (overallScore >= 70 ? 'Green' : overallScore >= 40 ? 'Yellow' : 'Red'),
    };
  }, [data]);

  if (!dimensions || dimensions.length === 0) return null;

  const StatusIcon = STATUS_CONFIG[status]?.icon || BadgeCheck;

  return (
    <div className="premium-card dark:dark-card-metallic p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BadgeCheck size={16} className="text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-800">Launch Readiness</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[status]?.bg || 'bg-slate-100'}`}>
            <StatusIcon size={12} />
            {STATUS_CONFIG[status]?.label || status}
          </div>
          {overallScore !== null && (
            <div className={`text-lg font-bold ${
              overallScore >= 70 ? 'text-emerald-600' : overallScore >= 40 ? 'text-amber-600' : 'text-red-600'
            }`}>{overallScore}%</div>
          )}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="h-52 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={dimensions} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} name="Score" />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Dimension Scores as Bars */}
      <div className="space-y-1.5 mb-3">
        {dimensions.map((dim, i) => (
          <GaugeMeter key={i} value={dim.score} label={dim.name} index={i} />
        ))}
      </div>

      {/* Critical Gaps */}
      {criticalGaps && criticalGaps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <h4 className="text-[10px] font-semibold text-red-500 uppercase mb-2 flex items-center gap-1">
            <AlertTriangle size={10} /> Critical Gaps
          </h4>
          <ul className="space-y-1">
            {criticalGaps.map((gap, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className="w-1 h-1 mt-1.5 rounded-full bg-red-400 shrink-0" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
