/**
 * ─── Global Full-Text Search (Item 72) ──────────────────────────
 * Searches across tasks, conversations, messages, AI analyses, and
 * other entities using Supabase full-text search or in-memory filtering.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, X, FileText, MessageSquare, CheckSquare,
  Brain, User, ChevronRight, Clock, Filter, Loader2,
  AlertCircle, BookOpen, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { supabase } from '../../services/supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;

const SEARCH_RESULTS_PER_PAGE = 20;

const SEARCHABLE_ENTITIES = [
  { key: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'messages', label: 'Messages', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { key: 'ai_analyses', label: 'AI Reports', icon: Brain, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  { key: 'profiles', label: 'People', icon: User, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { key: 'notifications', label: 'Notifications', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  { key: 'conversations', label: 'Conversations', icon: MessageSquare, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  { key: 'announcements', label: 'Announcements', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
];

export default function GlobalSearch({ onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load recent searches
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('optivian_recent_searches') || '[]');
      setRecentSearches(saved);
    } catch {}
  }, []);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Save recent search
  const saveRecentSearch = (q) => {
    try {
      const saved = JSON.parse(localStorage.getItem('optivian_recent_searches') || '[]');
      const updated = [q, ...saved.filter(s => s !== q)].slice(0, 10);
      localStorage.setItem('optivian_recent_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {}
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    localStorage.removeItem('optivian_recent_searches');
    setRecentSearches([]);
  };

  // Search function
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults({});
      return;
    }

    setLoading(true);
    setError('');

    try {
      const q = searchQuery.toLowerCase();
      const results = {};

      if (DEV_MODE) {
        // Dev mode: search localStorage
        if (selectedEntity === 'all' || selectedEntity === 'tasks') {
          const tasks = JSON.parse(localStorage.getItem('optivian_dev_tasks') || '[]');
          results.tasks = tasks.filter(t =>
            t.title?.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q)
          ).slice(0, SEARCH_RESULTS_PER_PAGE);
        }

        if (selectedEntity === 'all' || selectedEntity === 'messages') {
          // Search across all conversations
          const conversations = JSON.parse(localStorage.getItem('optivian_dev_conversations') || '[]');
          const allMessages = [];
          for (const conv of conversations) {
            const msgs = JSON.parse(localStorage.getItem(`optivian_dev_messages_${conv.id}`) || '[]');
            for (const msg of msgs) {
              if (msg.content?.toLowerCase().includes(q) || msg.file_name?.toLowerCase().includes(q)) {
                allMessages.push({ ...msg, conversation_name: conv.name || 'Direct Message' });
              }
            }
          }
          results.messages = allMessages.slice(0, SEARCH_RESULTS_PER_PAGE);
        }

        if (selectedEntity === 'all' || selectedEntity === 'profiles') {
          const profiles = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
          results.profiles = profiles.filter(p =>
            p.email?.toLowerCase().includes(q) ||
            p.full_name?.toLowerCase().includes(q)
          ).slice(0, SEARCH_RESULTS_PER_PAGE);
        }

        setSearchResults(results);
        setLoading(false);
        return;
      }

      // Supabase mode: use full-text search queries
      const orgId = user?.user_metadata?.organization_id;
      if (!orgId) {
        setLoading(false);
        return;
      }

      const promises = [];

      // Search tasks
      if (selectedEntity === 'all' || selectedEntity === 'tasks') {
        promises.push(
          supabase
            .from('tasks')
            .select('id, title, description, status, priority, due_date, created_at')
            .eq('organization_id', orgId)
            .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
            .order('created_at', { ascending: false })
            .limit(SEARCH_RESULTS_PER_PAGE)
            .then(({ data }) => { results.tasks = data || []; })
        );
      }

      // Search messages (across user's conversations)
      if (selectedEntity === 'all' || selectedEntity === 'messages') {
        promises.push(
          supabase
            .from('messages')
            .select('id, content, conversation_id, created_at, sender_id')
            .ilike('content', `%${q}%`)
            .order('created_at', { ascending: false })
            .limit(SEARCH_RESULTS_PER_PAGE)
            .then(({ data }) => { results.messages = (data || []).slice(0, SEARCH_RESULTS_PER_PAGE); })
        );
      }

      // Search AI analyses
      if (selectedEntity === 'all' || selectedEntity === 'ai_analyses') {
        promises.push(
          supabase
            .from('ai_analyses')
            .select('id, type, input_data, output_data, created_at')
            .eq('organization_id', orgId)
            .or(`type.ilike.%${q}%,input_data->>description.ilike.%${q}%`)
            .order('created_at', { ascending: false })
            .limit(SEARCH_RESULTS_PER_PAGE)
            .then(({ data }) => { results.ai_analyses = data || []; })
        );
      }

      // Search profiles
      if (selectedEntity === 'all' || selectedEntity === 'profiles') {
        promises.push(
          supabase
            .from('profiles')
            .select('id, email, full_name, role, avatar_url')
            .eq('organization_id', orgId)
            .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
            .limit(SEARCH_RESULTS_PER_PAGE)
            .then(({ data }) => { results.profiles = data || []; })
        );
      }

      // Search notifications
      if (selectedEntity === 'all' || selectedEntity === 'notifications') {
        promises.push(
          supabase
            .from('notifications')
            .select('id, type, message, created_at, read')
            .eq('user_id', user?.id)
            .ilike('message', `%${q}%`)
            .order('created_at', { ascending: false })
            .limit(SEARCH_RESULTS_PER_PAGE)
            .then(({ data }) => { results.notifications = data || []; })
        );
      }

      // Search conversations
      if (selectedEntity === 'all' || selectedEntity === 'conversations') {
        promises.push(
          supabase
            .from('conversations')
            .select('id, name, created_at')
            .ilike('name', `%${q}%`)
            .order('created_at', { ascending: false })
            .limit(SEARCH_RESULTS_PER_PAGE)
            .then(({ data }) => { results.conversations = data || []; })
        );
      }

      // Search announcements
      if (selectedEntity === 'all' || selectedEntity === 'announcements') {
        promises.push(
          supabase
            .from('announcements')
            .select('id, title, message, type, created_at')
            .or(`title.ilike.%${q}%,message.ilike.%${q}%`)
            .order('created_at', { ascending: false })
            .limit(SEARCH_RESULTS_PER_PAGE)
            .then(({ data }) => { results.announcements = data || []; })
        );
      }

      await Promise.all(promises);
      setSearchResults(results);
    } catch (err) {
      console.error('[GlobalSearch] Error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, selectedEntity]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim()) {
      setSearchResults({});
      setLoading(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => performSearch(query), 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, performSearch]);

  const totalResults = useMemo(() => {
    return Object.values(searchResults).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  }, [searchResults]);

  const handleSelect = (entityType, item) => {
    saveRecentSearch(query);
    if (onClose) onClose();

    switch (entityType) {
      case 'tasks':
        navigate(`/app/tasks`);
        break;
      case 'messages':
        navigate(`/app/chat`);
        break;
      case 'profiles':
        navigate(`/app/users`);
        break;
      case 'notifications':
        navigate(`/app/settings`);
        break;
      case 'ai_analyses':
        navigate(`/app/ai/history`);
        break;
      case 'conversations':
        navigate(`/app/chat`);
        break;
      case 'announcements':
        navigate(`/app`);
        break;
      default:
        break;
    }
  };

  const handleRecentSearch = (q) => {
    setQuery(q);
    performSearch(q);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 shrink-0">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across tasks, messages, people, AI reports..."
            className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Entity filters */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedEntity('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedEntity === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600/50'
            }`}
          >
            <Filter size={12} />
            All
          </button>
          {SEARCHABLE_ENTITIES.map(entity => (
            <button
              key={entity.key}
              onClick={() => setSelectedEntity(entity.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedEntity === entity.key
                  ? `${entity.bg} ${entity.color} border border-current`
                  : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600/50'
              }`}
            >
              <entity.icon size={12} />
              {entity.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-blue-500 animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && query && totalResults === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Search size={40} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">No results found</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                No matches for "{query}" in {selectedEntity === 'all' ? 'any category' : selectedEntity}. Try a different search term.
              </p>
            </div>
          </div>
        )}

        {/* Initial state (no query) */}
        {!loading && !query && recentSearches.length > 0 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recent Searches</h3>
              <button onClick={clearRecentSearches} className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors">
                Clear
              </button>
            </div>
            <div className="space-y-0.5">
              {recentSearches.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleRecentSearch(q)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <Clock size={14} className="text-slate-400" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search results */}
        {!loading && totalResults > 0 && (
          <div className="p-4 space-y-6">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
            </p>

            {Object.entries(searchResults).map(([entityType, items]) => {
              if (!items || items.length === 0) return null;
              const entity = SEARCHABLE_ENTITIES.find(e => e.key === entityType);
              if (!entity) return null;
              const Icon = entity.icon;

              return (
                <div key={entityType}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className={entity.color} />
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {entity.label}
                    </h3>
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(entityType, item)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <div className={`p-1.5 rounded-lg ${entity.bg} shrink-0`}>
                          <Icon size={14} className={entity.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 dark:text-slate-100 truncate">
                            {item.title || item.content || item.message || item.full_name || item.email || item.type || 'Untitled'}
                          </p>
                          {item.description && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{item.description}</p>
                          )}
                        </div>
                        <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                    {items.length > 5 && (
                      <button
                        onClick={() => handleSelect(entityType, items[0])}
                        className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 py-1.5 text-center"
                      >
                        View all {items.length} results
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
