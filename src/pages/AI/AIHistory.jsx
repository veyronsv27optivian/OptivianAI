import { useState, useEffect, useMemo } from 'react';
import {
  History, Search, Filter, Trash2, Download, Star, Eye,
  Clock, BarChart3, DollarSign, Activity, RefreshCw,
  ChevronLeft, ChevronRight, Brain,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { getAnalyses, deleteAnalysis, getAvailableTools, getAnalytics, AI_TOOL_TYPES } from '../../services/ai';

export default function AIHistory() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [favorites, setFavorites] = useState(new Set());
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const orgId = user?.user_metadata?.organization_id;
  const tools = getAvailableTools();

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }

    const fetchAnalyses = async () => {
      setLoading(true);
      try {
        const { data } = await getAnalyses({ organizationId: orgId, limit: 100 });
        setAnalyses(data || []);
      } catch (err) {
        console.error('Failed to fetch analyses:', err);
      } finally {
        setLoading(false);
      }

      // Fetch analytics
      try {
        const agg = await getAnalytics({});
        setAnalytics(agg);
      } catch { /* ignore */ }
    };

    fetchAnalyses();

    // Load favorites from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('optivian_ai_favorites') || '[]');
      setFavorites(new Set(saved));
    } catch { /* ignore */ }
  }, [orgId]);

  // ── Filtering & Sorting ───────────────────────────────────────
  const filteredAnalyses = useMemo(() => {
    let items = [...analyses];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(a => {
        const inputStr = JSON.stringify(a.input_data || {}).toLowerCase();
        const outputStr = JSON.stringify(a.output_data || {}).toLowerCase();
        return inputStr.includes(q) || outputStr.includes(q) || (a.type || '').includes(q);
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      items = items.filter(a => a.type === typeFilter);
    }

    // Sort
    items.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return items;
  }, [analyses, searchQuery, typeFilter, sortOrder]);

  const paginatedAnalyses = filteredAnalyses.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredAnalyses.length / pageSize);

  // ── Actions ───────────────────────────────────────────────────
  const handleDelete = async (id) => {
    await deleteAnalysis(id);
    setAnalyses(prev => prev.filter(a => a.id !== id));
  };

  const handleToggleFavorite = (id) => {
    const updated = new Set(favorites);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setFavorites(updated);
    localStorage.setItem('optivian_ai_favorites', JSON.stringify([...updated]));
  };

  const handleExport = (analysis) => {
    const text = [
      `=== AI Analysis Export ===`,
      `Type: ${analysis.type}`,
      `Date: ${analysis.created_at}`,
      `Model: ${analysis.model_used || 'N/A'}`,
      ``,
      `--- Input ---`,
      JSON.stringify(analysis.input_data, null, 2),
      ``,
      `--- Output ---`,
      typeof analysis.output_data === 'object'
        ? JSON.stringify(analysis.output_data, null, 2)
        : analysis.output_data,
      ``,
      `--- Metadata ---`,
      `Score: ${analysis.score ?? 'N/A'}`,
      `ID: ${analysis.id}`,
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${analysis.type}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getToolLabel = (type) => {
    const tool = tools.find(t => t.id === type);
    return tool?.label || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  // ── Render ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg bg-white border border-slate-200">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Activity size={14} />
              <span className="text-xs">Total Requests</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{analytics.total || 0}</p>
          </div>
          <div className="p-4 rounded-lg bg-white border border-slate-200">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <BarChart3 size={14} />
              <span className="text-xs">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {analytics.successRate ? `${Math.round(analytics.successRate)}%` : 'N/A'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white border border-slate-200">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Clock size={14} />
              <span className="text-xs">Avg Latency</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {analytics.avgLatency ? `${analytics.avgLatency}ms` : 'N/A'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white border border-slate-200">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <DollarSign size={14} />
              <span className="text-xs">Total Tokens</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {analytics.totalTokens ? analytics.totalTokens.toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder="Search analyses..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          {tools.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Analyses List */}
      {paginatedAnalyses.length === 0 ? (
        <div className="text-center py-16">
          <History size={40} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No analyses found</h3>
          <p className="text-sm text-slate-400">
            {searchQuery || typeFilter !== 'all'
              ? 'Try a different search or filter'
              : 'Run an AI analysis to see it here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedAnalyses.map((analysis) => (
            <div
              key={analysis.id}
              className="flex items-start gap-3 p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-all group"
            >
              <div className="p-2 rounded-lg bg-slate-50 shrink-0">
                <Brain size={16} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-medium text-slate-800">
                    {getToolLabel(analysis.type)}
                  </h4>
                  {analysis.model_used && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {analysis.model_used}
                    </span>
                  )}
                  {analysis.score != null && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                      Score: {analysis.score}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {getTimeAgo(analysis.created_at)}
                  {analysis.created_by && ` · by ${analysis.created_by.slice(0, 8)}...`}
                </p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {typeof analysis.input_data === 'object'
                    ? JSON.stringify(analysis.input_data).slice(0, 150)
                    : String(analysis.input_data || '').slice(0, 150)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleToggleFavorite(analysis.id)}
                  className={`p-1.5 rounded-lg transition-all ${
                    favorites.has(analysis.id)
                      ? 'text-amber-500 hover:text-amber-600'
                      : 'text-slate-300 hover:text-slate-500'
                  }`}
                  title="Toggle favorite"
                >
                  <Star size={14} fill={favorites.has(analysis.id) ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => handleExport(analysis)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 transition-all"
                  title="Export"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => handleDelete(analysis.id)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 transition-all"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
