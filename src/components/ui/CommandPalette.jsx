import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, Command, Home, Users, CheckSquare, Brain, MessageSquare,
  Settings, Building2, BarChart3, Clock, History, Server,
  Sun, Moon, X, ArrowRight, Sparkles, FileText, Target,
  Zap, Shield, Activity, TrendingUp, PieChart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../services/ThemeContext';
import GlobalSearch from '../../pages/Search/GlobalSearch';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/app', icon: Home, keywords: 'dashboard home main' },
  { label: 'Users & Roles', path: '/app/users', icon: Users, keywords: 'users team members roles permissions' },
  { label: 'Tasks', path: '/app/tasks', icon: CheckSquare, keywords: 'tasks todo assignments projects' },
  { label: 'Chat', path: '/app/chat', icon: MessageSquare, keywords: 'chat messages conversations' },
  { label: 'AI Platform', path: '/app/ai', icon: Brain, keywords: 'ai artificial intelligence tools' },
  { label: 'AI Usage', path: '/app/ai/usage', icon: BarChart3, keywords: 'ai usage analytics tokens' },
  { label: 'AI History', path: '/app/ai/history', icon: History, keywords: 'ai history past queries' },
  { label: 'AI Providers', path: '/app/ai/providers', icon: Server, keywords: 'ai providers models settings' },
  { label: 'AI Settings', path: '/app/ai/settings', icon: Settings, keywords: 'ai settings configuration' },
  { label: 'Settings', path: '/app/settings', icon: Settings, keywords: 'settings preferences profile' },
  { label: 'Organization', path: '/app/org', icon: Building2, keywords: 'org organization profile settings' },
  { label: 'Org Analytics', path: '/app/org/analytics', icon: TrendingUp, keywords: 'org analytics reports data' },
  { label: 'Org Structure', path: '/app/org/structure', icon: Target, keywords: 'org structure hierarchy teams' },
  { label: 'Org Activity', path: '/app/org/activity', icon: Activity, keywords: 'org activity history log' },
  { label: 'Admin Panel', path: '/app/admin', icon: Shield, keywords: 'admin panel management' },
  { label: 'Login History', path: '/app/settings/login-history', icon: Clock, keywords: 'login history activity signins' },
];

const ACTIONS = [
  { label: 'Toggle Dark Mode', icon: Sun, action: 'toggleTheme', keywords: 'dark mode theme light' },
  { label: 'Go Home', icon: Home, action: 'navigate', path: '/app', keywords: 'home dashboard' },
];

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fullSearch, setFullSearch] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setFullSearch(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter items based on query
  const results = useMemo(() => {
    if (!query.trim()) return NAV_ITEMS.slice(0, 8);
    const q = query.toLowerCase();
    const all = [
      ...NAV_ITEMS.map(item => ({ ...item, type: 'page' })),
      ...ACTIONS.map(item => ({ ...item, type: 'action' })),
    ];
    return all.filter(item => {
      const searchable = `${item.label} ${item.keywords || ''} ${item.path || ''}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[selectedIndex];
      if (!item) return;
      if (item.type === 'action') {
        if (item.action === 'toggleTheme') toggleTheme();
        onClose();
      } else {
        navigate(item.path);
        onClose();
      }
    }
  }, [results, selectedIndex, navigate, onClose, toggleTheme]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSelect = (item) => {
    if (item.type === 'action') {
      if (item.action === 'toggleTheme') toggleTheme();
    } else {
      navigate(item.path);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Full search mode
  if (fullSearch) {
    return (
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-2xl mx-4 dropdown-premium overflow-hidden" style={{ maxHeight: '70vh' }}>
          <GlobalSearch onClose={onClose} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-xl mx-4 dropdown-premium overflow-hidden animate-scale-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <Search size={20} className="text-slate-400 dark:text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, tools, or actions..."
            className="flex-1 bg-transparent text-base text-slate-900 dark:text-text-primary placeholder-slate-400 dark:placeholder-text-tertiary focus:outline-none"
          />
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-text-tertiary">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] font-mono text-[10px] text-slate-400 dark:text-text-tertiary">esc</kbd>
          </div>
        </div>

        {/* Results */}
        <div className="p-2" style={{ maxHeight: fullSearch ? '50vh' : '320px' }}>
          {results.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 dark:text-text-tertiary">
              <Search size={24} className="mx-auto mb-2 opacity-30" />
              <p>No results for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {results.map((item, i) => {
                const Icon = item.icon;
                const isSelected = i === selectedIndex;
                return (
                  <button
                    key={`${item.type}-${item.label}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isSelected
                      ? 'bg-primary/10 text-primary dark:text-primary-light'
                      : 'text-slate-600 dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${
                      isSelected
                        ? 'bg-primary/15'
                        : 'bg-slate-100 dark:bg-white/[0.04]'
                    }`}>
                      <Icon size={16} className={
                        isSelected ? 'text-primary dark:text-primary-light' : 'text-slate-400 dark:text-text-tertiary'
                      } />
                    </div>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-text-tertiary capitalize">
                      {item.type || 'page'}
                    </span>
                    {isSelected && (
                      <ArrowRight size={14} className="text-primary-light animate-fade-in" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-text-tertiary">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/[0.06] font-mono text-[9px]">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-text-tertiary">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/[0.06] font-mono text-[9px]">↵</kbd>
            <span>Open</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-text-tertiary">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/[0.06] font-mono text-[9px]">⌘K</kbd>
            <span>Toggle</span>
          </div>
          {query.trim().length >= 2 && (
            <button
              onClick={() => setFullSearch(true)}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-primary dark:text-primary-light hover:bg-primary/10 transition-all"
            >
              <Search size={10} />
              Full Search ({NAV_ITEMS.length + ACTIONS.length}+ items)
            </button>
          )}
          {results.length > 0 && query.trim().length < 2 && (
            <span className="ml-auto text-[10px] text-slate-400 dark:text-text-tertiary">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
