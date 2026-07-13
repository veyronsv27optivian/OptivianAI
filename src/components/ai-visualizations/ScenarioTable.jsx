import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';

const IMPACT_COLORS = {
  High: 'text-red-600 bg-red-50',
  Medium: 'text-amber-600 bg-amber-50',
  Low: 'text-emerald-600 bg-emerald-50',
  high: 'text-red-600 bg-red-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-emerald-600 bg-emerald-50',
};

function ScenarioRow({ scenario, index, isBest }) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`${isBest ? 'bg-emerald-50/50' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
    >
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          {isBest && <TrendingUp size={12} className="text-emerald-500" />}
          <span className="text-xs font-medium text-slate-800">{scenario.name}</span>
          {isBest && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-medium">Recommended</span>}
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${scenario.probability || 0}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className={`h-full rounded-full ${(scenario.probability || 0) >= 50 ? 'bg-emerald-500' : (scenario.probability || 0) >= 30 ? 'bg-amber-500' : 'bg-slate-400'}`}
            />
          </div>
          <span className="text-xs font-medium text-slate-600 w-8">{scenario.probability}%</span>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${IMPACT_COLORS[scenario.impact] || 'text-slate-600 bg-slate-50'}`}>
          {scenario.impact}
        </span>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-xs text-slate-500">{scenario.timeline || '-'}</span>
      </td>
      <td className="py-2.5 px-3 max-w-xs">
        <p className="text-xs text-slate-600 line-clamp-2">{scenario.description || scenario.outcome || '-'}</p>
      </td>
    </motion.tr>
  );
}

export default function ScenarioTable({ data }) {
  const { scenarios, recommendation, sensitivityFactors, decisionOverview } = useMemo(() => {
    const d = data || {};
    const scs = d.scenarios || [];
    return {
      scenarios: Array.isArray(scs) ? scs.filter(s => s.name) : [],
      recommendation: d.recommendation || '',
      sensitivityFactors: d.sensitivityFactors || d.sensitivity_factors || [],
      decisionOverview: d.decisionOverview || d.decision || d.decision_overview || '',
    };
  }, [data]);

  if (!scenarios || scenarios.length === 0) return null;

  // Find best scenario (highest probability * positive impact)
  const bestIdx = scenarios.reduce((best, s, i) => {
    const score = (s.probability || 0) * (s.impact === 'High' ? 3 : s.impact === 'Medium' ? 2 : 1);
    return score > (best.score || 0) ? { index: i, score } : best;
  }, { index: 0, score: -1 }).index;

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-cyan-500" />
        <h3 className="text-sm font-bold text-slate-800">Decision Simulation</h3>
        <span className="text-xs text-slate-400">{scenarios.length} scenarios</span>
      </div>

      {decisionOverview && (
        <p className="text-xs text-slate-500 mb-3 p-2.5 bg-slate-50 rounded-lg">{decisionOverview}</p>
      )}

      {/* Scenario Comparison Table */}
      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase">Scenario</th>
              <th className="py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase">Probability</th>
              <th className="py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase">Impact</th>
              <th className="py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase">Timeline</th>
              <th className="py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scenarios.map((s, i) => (
              <ScenarioRow key={i} scenario={s} index={i} isBest={i === bestIdx} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb size={12} className="text-blue-500" />
            <span className="text-[10px] font-semibold text-blue-700 uppercase">Recommendation</span>
          </div>
          <p className="text-xs text-blue-800">{recommendation}</p>
        </div>
      )}

      {/* Sensitivity Factors */}
      {sensitivityFactors.length > 0 && (
        <div className="mt-3">
          <h4 className="text-[10px] font-semibold text-slate-500 uppercase mb-1.5">Sensitivity Factors</h4>
          <div className="flex flex-wrap gap-1.5">
            {sensitivityFactors.map((factor, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{factor}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
