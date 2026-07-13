import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ChevronDown, ChevronUp, Target, Star } from 'lucide-react';

function CompetitorCard({ competitor, index, expanded, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-lg border cursor-pointer transition-all ${
        expanded ? 'border-slate-300 shadow-sm bg-white' : 'border-slate-100 hover:border-slate-200 bg-white'
      }`}
      onClick={onToggle}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">
            {competitor.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900">{competitor.name}</span>
              {competitor.marketShare !== undefined && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">
                  {competitor.marketShare}% share
                </span>
              )}
              {expanded ? <ChevronUp size={14} className="ml-auto text-slate-400" /> : <ChevronDown size={14} className="ml-auto text-slate-400" />}
            </div>
            {competitor.positioning && (
              <p className="text-[10px] text-slate-500 mt-0.5">{competitor.positioning}</p>
            )}
            {competitor.pricing && (
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Pricing: {competitor.pricing}
              </span>
            )}
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
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                {/* Strengths */}
                {competitor.strengths && competitor.strengths.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                      <TrendingUp size={10} /> Strengths
                    </span>
                    <ul className="mt-1 space-y-0.5">
                      {competitor.strengths.map((s, i) => (
                        <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1.5">
                          <span className="w-1 h-1 mt-1 rounded-full bg-emerald-400 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-red-600 flex items-center gap-1">
                      <TrendingDown size={10} /> Weaknesses
                    </span>
                    <ul className="mt-1 space-y-0.5">
                      {competitor.weaknesses.map((w, i) => (
                        <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1.5">
                          <span className="w-1 h-1 mt-1 rounded-full bg-red-400 shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Target Audience */}
                {competitor.targetAudience && (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500">Target Audience</span>
                    <p className="text-[10px] text-slate-600 mt-0.5">{competitor.targetAudience}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function TrendingDown({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

export default function CompetitorTable({ data }) {
  const { competitors, differentiators, gapAnalysis } = useMemo(() => {
    const d = data || {};
    const comps = d.competitors || d.competitorProfiles || [];
    return {
      competitors: Array.isArray(comps) ? comps.filter(c => c.name) : [],
      differentiators: d.differentiators || d.differentiationStrategies || [],
      gapAnalysis: d.gapAnalysis || d.gap_analysis || '',
    };
  }, [data]);

  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!competitors || competitors.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Target size={16} className="text-orange-500" />
        <h3 className="text-sm font-bold text-slate-800">Competitor Analysis</h3>
        <span className="text-xs text-slate-400">{competitors.length} competitors</span>
      </div>

      {/* Competitor Cards */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {competitors.map((comp, i) => (
          <CompetitorCard
            key={i}
            competitor={comp}
            index={i}
            expanded={expandedIndex === i}
            onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
          />
        ))}
      </div>

      {/* Differentiation Strategies */}
      {differentiators.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <h4 className="text-[10px] font-semibold text-violet-600 uppercase mb-2 flex items-center gap-1">
            <Star size={10} /> Differentiation Strategies
          </h4>
          <ul className="space-y-1">
            {differentiators.map((diff, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className="w-1 h-1 mt-1.5 rounded-full bg-violet-400 shrink-0" />
                {typeof diff === 'string' ? diff : diff.strategy || diff.description || ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
