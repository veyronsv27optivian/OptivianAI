import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

const PROBABILITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };
const PROBABILITY_ORDER = ['low', 'medium', 'high'];

const IMPACT_COLORS = {
  1: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  2: 'bg-lime-100 text-lime-700 border-lime-200',
  3: 'bg-amber-100 text-amber-700 border-amber-200',
  4: 'bg-orange-100 text-orange-700 border-orange-200',
  5: 'bg-red-100 text-red-700 border-red-200',
};

const HEATMAP_CELLS = {
  'low_low': { bg: 'bg-emerald-200', label: 'Low' },
  'low_medium': { bg: 'bg-lime-200', label: 'Low' },
  'low_high': { bg: 'bg-amber-200', label: 'Moderate' },
  'medium_low': { bg: 'bg-lime-200', label: 'Low' },
  'medium_medium': { bg: 'bg-amber-200', label: 'Moderate' },
  'medium_high': { bg: 'bg-orange-300', label: 'High' },
  'high_low': { bg: 'bg-amber-200', label: 'Moderate' },
  'high_medium': { bg: 'bg-orange-300', label: 'High' },
  'high_high': { bg: 'bg-red-400', label: 'Critical' },
};

function RiskCard({ risk, index, expanded, onToggle }) {
  const impactColor = IMPACT_COLORS[risk.impact] || IMPACT_COLORS[3];
  const probLabel = PROBABILITY_LABELS[risk.probability?.toLowerCase()] || risk.probability;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-lg border p-3 transition-all cursor-pointer ${
        expanded ? 'border-slate-300 shadow-sm bg-white' : 'border-slate-100 hover:border-slate-200 bg-white'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${impactColor}`}>
          <span className="text-xs font-bold">{risk.score || risk.impact * (PROBABILITY_ORDER.indexOf(risk.probability?.toLowerCase()) + 1)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-900">{risk.description || risk.name || risk.risk}</span>
            {risk.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{risk.category}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              risk.probability?.toLowerCase() === 'high' ? 'bg-red-100 text-red-600' :
              risk.probability?.toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-600' :
              'bg-emerald-100 text-emerald-600'
            }`}>{probLabel} probability</span>
            <span className="text-[10px] text-slate-400">Impact: {risk.impact}/5</span>
            {expanded ? <ChevronUp size={14} className="ml-auto text-slate-400" /> : <ChevronDown size={14} className="ml-auto text-slate-400" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              {risk.mitigation && (
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Mitigation</span>
                  <p className="text-xs text-slate-600 mt-0.5">{risk.mitigation}</p>
                </div>
              )}
              {risk.contingency && (
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Contingency</span>
                  <p className="text-xs text-slate-600 mt-0.5">{risk.contingency}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RiskHeatmap({ data }) {
  const risks = useMemo(() => {
    const items = data?.risks || data?.riskRegister || [];
    if (!Array.isArray(items)) return [];
    return items.sort((a, b) => {
      const scoreA = a.score || (PROBABILITY_ORDER.indexOf(a.probability?.toLowerCase()) + 1) * (a.impact || 3);
      const scoreB = b.score || (PROBABILITY_ORDER.indexOf(b.probability?.toLowerCase()) + 1) * (b.impact || 3);
      return scoreB - scoreA;
    });
  }, [data]);

  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!risks || risks.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert size={16} className="text-orange-500" />
        <h3 className="text-sm font-bold text-slate-800">Risk Assessment</h3>
        <span className="text-xs text-slate-400">{risks.length} risks identified</span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
          risks.some(r => (r.score || 0) >= 12 || r.impact >= 4) ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {risks.some(r => (r.score || 0) >= 12 || r.impact >= 4) ? 'High Risk' : 'Managed Risk'}
        </span>
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
        <span className="text-[10px] font-medium text-slate-500">Risk Level:</span>
        <div className="flex gap-1">
          {Object.entries(HEATMAP_CELLS).slice(0, 4).map(([key, cell]) => (
            <span key={key} className={`text-[10px] px-2 py-0.5 rounded ${cell.bg} text-white`}>{cell.label}</span>
          ))}
        </div>
      </div>

      {/* Risk Cards */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {risks.map((risk, i) => (
          <RiskCard
            key={i}
            risk={risk}
            index={i}
            expanded={expandedIndex === i}
            onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
          />
        ))}
      </div>
    </div>
  );
}
