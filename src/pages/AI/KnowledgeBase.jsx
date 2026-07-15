/**
 * ─── AI Knowledge Base (Phase 9, Item 116) ───────────────────────
 * Centralized repository for saved AI analyses, prompt templates,
 * and searchable organizational memory.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Search, FileText, Star, Clock, Brain,
  Trash2, ChevronRight, Sparkles, Bookmark,
  MessageSquare, Target, Filter,
  ArrowUpDown, Loader2, X,
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader } from '../../components/ui/Card';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;

// ─── Knowledge Entry ─────────────────────────────────────────────
function KnowledgeEntry({ entry, onDelete }) {
  const Icon = entry.icon || FileText;
  const colorMap = {
    analysis: 'violet', advisory: 'blue', forecast: 'emerald',
    risk: 'rose', content: 'amber', document: 'slate',
  };
  const color = colorMap[entry.category] || 'slate';

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-slate-700/50 shrink-0`}>
          <Icon size={16} className={`text-${color}-600 dark:text-${color}-400`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{entry.title}</h3>
            <Badge color={color} size="xs">{entry.category}</Badge>
            {entry.favorite && <Star size={12} className="text-amber-500 fill-amber-500" />}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{entry.summary}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(entry.created_at)}</span>
            <span className="flex items-center gap-1"><Brain size={10} /> {entry.toolType || 'AI Analysis'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDelete?.(entry.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            title="View details"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Sample Knowledge Data (removed for production — no fake data) ──

// ─── Main Component ──────────────────────────────────────────────
export default function KnowledgeBase({ onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load knowledge entries (from localStorage in dev, Supabase in prod)
    const loadEntries = async () => {
      try {
        if (DEV_MODE) {
          const stored = localStorage.getItem('optivian_knowledge_base');
          if (stored) {
            setEntries(JSON.parse(stored));
          } else {
            // No fake data — start with empty knowledge base
            setEntries([]);
          }
        } else {
          // In production, fetch from Supabase `knowledge_base` table
          // const { data } = await supabase.from('knowledge_base').select('*').order('created_at', { ascending: false });
          // setEntries(data || []);
          setEntries([]);
        }
      } catch (err) {
        console.warn('Failed to load knowledge base:', err);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };
    loadEntries();
  }, []);

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(entries.map(e => e.category))];
    return cats;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.toolType?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'favorites') {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return 0;
      }
      return 0;
    });

    return filtered;
  }, [entries, searchQuery, selectedCategory, sortBy]);

  const handleDelete = (id) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    if (DEV_MODE) {
      localStorage.setItem('optivian_knowledge_base', JSON.stringify(updated));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
        >
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20">
          <BookOpen size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Knowledge Base</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Saved analyses, insights & organizational memory</p>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
          {entries.length} entries
        </span>
      </div>

      {/* Search & Filters */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge base..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-all ${
              showFilters
                ? 'border-blue-300 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-700/50 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Filter size={16} />
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="flex items-center gap-3 mt-3 overflow-hidden"
          >
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-slate-500">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-lg px-2 py-1.5 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={12} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-lg px-2 py-1.5 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="favorites">Favorites First</option>
              </select>
            </div>

            {filteredEntries.length !== entries.length && (
              <span className="text-[10px] text-slate-400">
                {filteredEntries.length} of {entries.length} shown
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* Knowledge Entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <BookOpen size={40} className="text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              {searchQuery ? 'No matching entries found' : 'Knowledge base is empty'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-sm">
              {searchQuery
                ? 'Try a different search term or clear filters'
                : 'AI analyses and insights will appear here as you use the platform. Saved reports, forecasts, and strategic documents are automatically indexed.'
              }
            </p>
          </div>
        ) : (
          filteredEntries.map(entry => (
            <KnowledgeEntry key={entry.id} entry={entry} onDelete={handleDelete} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/30 shrink-0 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Sparkles size={10} /> AI automatically indexes analyses
        </span>
        <span>{filteredEntries.length} entries</span>
      </div>
    </div>
  );
}
