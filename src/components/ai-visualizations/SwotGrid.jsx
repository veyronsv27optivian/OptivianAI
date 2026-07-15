import { useMemo } from 'react';
import { motion } from 'framer-motion';

const QUADRANTS = [
  {
    key: 'strengths',
    label: 'Strengths',
    icon: '🟢',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    badge: 'bg-emerald-200 text-emerald-700',
  },
  {
    key: 'weaknesses',
    label: 'Weaknesses',
    icon: '🔴',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    badge: 'bg-red-200 text-red-700',
  },
  {
    key: 'opportunities',
    label: 'Opportunities',
    icon: '🔵',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    badge: 'bg-blue-200 text-blue-700',
  },
  {
    key: 'threats',
    label: 'Threats',
    icon: '🟡',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    badge: 'bg-amber-200 text-amber-700',
  },
];

function SwotQuadrant({ quadrant, items, index }) {
  if (!items || items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={`rounded-xl border ${quadrant.border} ${quadrant.bg} p-4`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{quadrant.icon}</span>
        <h4 className={`font-semibold text-sm ${quadrant.text}`}>{quadrant.label}</h4>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${quadrant.badge}`}>
          {items.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + i * 0.05 }}
            className="flex items-start gap-2 text-xs"
          >
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-40" />
            <span className={`${quadrant.text}/90`}>{item}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function SwotGrid({ data }) {
  const swot = data?.swot || data;

  const strengths = useMemo(() => {
    if (!swot) return [];
    if (Array.isArray(swot.strengths)) return swot.strengths;
    if (Array.isArray(swot.Strengths)) return swot.Strengths;
    return [];
  }, [swot]);

  const weaknesses = useMemo(() => {
    if (!swot) return [];
    if (Array.isArray(swot.weaknesses)) return swot.weaknesses;
    if (Array.isArray(swot.Weaknesses)) return swot.Weaknesses;
    return [];
  }, [swot]);

  const opportunities = useMemo(() => {
    if (!swot) return [];
    if (Array.isArray(swot.opportunities)) return swot.opportunities;
    if (Array.isArray(swot.Opportunities)) return swot.Opportunities;
    return [];
  }, [swot]);

  const threats = useMemo(() => {
    if (!swot) return [];
    if (Array.isArray(swot.threats)) return swot.threats;
    if (Array.isArray(swot.Threats)) return swot.Threats;
    return [];
  }, [swot]);

  if (strengths.length === 0 && weaknesses.length === 0 && opportunities.length === 0 && threats.length === 0) {
    return null;
  }

  const quadrants = [
    { quadrant: QUADRANTS[0], items: strengths, idx: 0 },
    { quadrant: QUADRANTS[1], items: weaknesses, idx: 1 },
    { quadrant: QUADRANTS[2], items: opportunities, idx: 2 },
    { quadrant: QUADRANTS[3], items: threats, idx: 3 },
  ];

  return (
    <div className="premium-card dark:dark-card-metallic p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-slate-800">SWOT Analysis</h3>
        <span className="text-xs text-slate-400">— Strategic review</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quadrants.map((q) => (
          <SwotQuadrant key={q.quadrant.key} quadrant={q.quadrant} items={q.items} index={q.idx} />
        ))}
      </div>
    </div>
  );
}
