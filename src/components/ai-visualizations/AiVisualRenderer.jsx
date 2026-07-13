import React, { useMemo } from 'react';
import SwotGrid from './SwotGrid';
import RiskHeatmap from './RiskHeatmap';
import LaunchRadar from './LaunchRadar';
import FinancialCharts from './FinancialCharts';
import ScenarioTable from './ScenarioTable';
import CompetitorTable from './CompetitorTable';

// ─── Markdown-like text renderer ─────────────────────────────────
function SimpleMarkdown({ content }) {
  if (!content) return null;

  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
      if (match) {
        const [, lang, code] = match;
        return (
          <div key={i} className="relative group my-3">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-t-lg border-b border-slate-700">
              <span>{lang || 'code'}</span>
              <button
                onClick={() => navigator.clipboard.writeText(code.trim())}
                className="hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-b-lg overflow-x-auto text-sm leading-relaxed"><code>{code.trim()}</code></pre>
          </div>
        );
      }
    }
    return <InlineMarkdown key={i} text={part} />;
  });
}

function InlineMarkdown({ text }) {
  const elements = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0, match, key = 0;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    elements.push(<strong key={key++} className="font-semibold">{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    elements.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  if (elements.length === 0) {
    const italicParts = text.split(/(\*[^*\n]+\*)/g);
    return italicParts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*') && part.length > 1) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      const codeParts = part.split(/(`[^`\n]+`)/g);
      return codeParts.map((cp, j) => {
        if (cp.startsWith('`') && cp.endsWith('`') && cp.length > 1) {
          return <code key={`${i}-${j}`} className="px-1.5 py-0.5 bg-slate-100 rounded text-sm font-mono text-rose-600">{cp.slice(1, -1)}</code>;
        }
        return <span key={`${i}-${j}`}>{cp}</span>;
      });
    });
  }

  return elements;
}

// ─── JSON extraction ─────────────────────────────────────────────
function extractJsonBlocks(text) {
  const blocks = [];
  const regex = /<!--\s*AI_JSON_START\s*-->([\s\S]*?)<!--\s*AI_JSON_END\s*-->/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    try {
      const data = JSON.parse(match[1].trim());
      blocks.push(data);
    } catch (e) {
      console.warn('[AiVisualRenderer] Failed to parse JSON block:', e.message);
    }
  }

  return blocks;
}

// ─── Detect visualization type from JSON structure ──────────────
function detectVisualType(data) {
  if (data.swot) return 'swot';
  if (data.risks && Array.isArray(data.risks)) return 'risk';
  if (data.overallScore !== undefined || data.dimensions) return 'launch';
  if (data.scenarios && data.metrics !== undefined) return 'financial';
  if (data.scenarios && Array.isArray(data.scenarios) && data.recommendation !== undefined) return 'decision';
  if (data.competitors && Array.isArray(data.competitors)) return 'competitor';
  return null;
}

// ─── Clean text by removing JSON blocks ─────────────────────────
function cleanText(text) {
  return text.replace(/<!--\s*AI_JSON_START\s*-->[\s\S]*?<!--\s*AI_JSON_END\s*-->/g, '').trim();
}

// ─── Main Component ─────────────────────────────────────────────
export default function AiVisualRenderer({ content, toolType }) {
  const { cleanedText, jsonBlocks, visualType } = useMemo(() => {
    const blocks = extractJsonBlocks(content);
    const text = cleanText(content);
    const type = blocks.length > 0 ? detectVisualType(blocks[0]) : null;
    return { cleanedText: text, jsonBlocks: blocks, visualType: type };
  }, [content]);

  return (
    <div className="ai-visual-renderer">
      {/* Render visual component if JSON data found */}
      {jsonBlocks.length > 0 && visualType && (
        <div className="mb-4">
          {visualType === 'swot' && <SwotGrid data={jsonBlocks[0]} />}
          {visualType === 'risk' && <RiskHeatmap data={jsonBlocks[0]} />}
          {visualType === 'launch' && <LaunchRadar data={jsonBlocks[0]} />}
          {visualType === 'financial' && <FinancialCharts data={jsonBlocks[0]} />}
          {visualType === 'decision' && <ScenarioTable data={jsonBlocks[0]} />}
          {visualType === 'competitor' && <CompetitorTable data={jsonBlocks[0]} />}
        </div>
      )}

      {/* Render markdown text */}
      {cleanedText && (
        <div className="text-sm leading-relaxed prose prose-sm max-w-none">
          <SimpleMarkdown content={cleanedText} />
        </div>
      )}

      {/* Fallback: render full content if no JSON was extracted */}
      {!cleanedText && jsonBlocks.length === 0 && (
        <div className="text-sm leading-relaxed prose prose-sm max-w-none">
          <SimpleMarkdown content={content} />
        </div>
      )}
    </div>
  );
}
