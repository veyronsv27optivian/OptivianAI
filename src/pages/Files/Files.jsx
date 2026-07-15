import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  File, FileText, FileSpreadsheet, FileType, Image, Download,
  Search, Trash2, Clock, Calendar, ChevronDown, ChevronUp,
  HardDrive, X,
} from 'lucide-react';

const DEV_KEY = 'optivian_dev_files';

// Collect files from across the app
function collectFiles() {
  const allFiles = [];

  // From tasks
  try {
    const tasks = JSON.parse(localStorage.getItem('optivian_dev_tasks') || '[]');
    tasks.forEach(task => {
      if (task.files && Array.isArray(task.files)) {
        task.files.forEach(file => {
          allFiles.push({
            id: file.id || `task-${task.id}-${file.name}`,
            name: file.name,
            size: file.size,
            type: file.type,
            data: file.data,
            source: 'task',
            sourceName: task.title || 'Untitled Task',
            sourceId: task.id,
            created_at: file.created_at || task.updated_at || task.created_at,
          });
        });
      }
    });
  } catch { /* ignore */ }

  // From chat messages
  try {
    const convs = JSON.parse(localStorage.getItem('optivian_dev_conversations') || '[]');
    convs.forEach(conv => {
      const msgs = JSON.parse(localStorage.getItem(`optivian_dev_messages_${conv.id}`) || '[]');
      msgs.forEach(msg => {
        if (msg.file_url && msg.file_name) {
          allFiles.push({
            id: `msg-${msg.id}`,
            name: msg.file_name,
            size: 0,
            type: msg.file_type || 'application/octet-stream',
            url: msg.file_url,
            source: 'chat',
            sourceName: conv.name || 'Conversation',
            sourceId: conv.id,
            created_at: msg.created_at,
          });
        }
      });
    });
  } catch { /* ignore */ }

  // Sort by date, newest first
  return allFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes === 0) return 'N/A';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getFileIcon(file) {
  if (file.type?.startsWith('image/')) return Image;
  const ext = file.name?.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) return FileText;
  if (['doc', 'docx'].includes(ext)) return FileText;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['ppt', 'pptx'].includes(ext)) return FileType;
  if (['zip', 'rar', '7z'].includes(ext)) return HardDrive;
  return File;
}

function getFileColor(file) {
  if (file.type?.startsWith('image/')) return 'text-pink-600 bg-pink-50';
  const ext = file.name?.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) return 'text-red-600 bg-red-50';
  if (['doc', 'docx'].includes(ext)) return 'text-blue-600 bg-blue-50';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'text-emerald-600 bg-emerald-50';
  if (['ppt', 'pptx'].includes(ext)) return 'text-orange-600 bg-orange-50';
  return 'text-slate-600 bg-slate-50';
}

const SOURCE_LABELS = {
  task: 'Task Attachment',
  chat: 'Chat File',
};

export default function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [expandedFile, setExpandedFile] = useState(null);
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'name' | 'size'

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setFiles(collectFiles());
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    let result = [...files];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f =>
        f.name?.toLowerCase().includes(q) ||
        f.sourceName?.toLowerCase().includes(q)
      );
    }

    if (sourceFilter !== 'all') {
      result = result.filter(f => f.source === sourceFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name?.localeCompare(b.name);
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return result;
  }, [files, searchQuery, sourceFilter, sortBy]);

  const handleDownload = (file) => {
    if (file.data) {
      const link = document.createElement('a');
      link.href = file.data;
      link.download = file.name;
      link.click();
    } else if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  const handleDelete = (fileId) => {
    // Mark file as deleted in a skipped-ids set so it persists across refreshes
    try {
      const deleted = JSON.parse(localStorage.getItem('optivian_deleted_file_ids') || '[]');
      if (!deleted.includes(fileId)) {
        deleted.push(fileId);
        localStorage.setItem('optivian_deleted_file_ids', JSON.stringify(deleted));
      }
    } catch { /* ignore */ }
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Filter out deleted files on load
  useEffect(() => {
    const deleted = JSON.parse(localStorage.getItem('optivian_deleted_file_ids') || '[]');
    if (deleted.length > 0) {
      setFiles(prev => prev.filter(f => !deleted.includes(f.id)));
    }
  }, []);

  // Group by date
  const groupedFiles = useMemo(() => {
    const groups = {};
    filtered.forEach(file => {
      const dateKey = file.created_at
        ? new Date(file.created_at).toDateString()
        : 'unknown';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(file);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Files</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {files.length} file{files.length !== 1 ? 's' : ''} across tasks and chat
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename or source..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
            {['all', 'task', 'chat'].map(s => (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-all ${
                  sourceFilter === s
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {s === 'all' ? 'All' : SOURCE_LABELS[s] || s}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 text-xs text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Newest</option>
            <option value="name">Name A-Z</option>
            <option value="size">Size</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <File size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            {searchQuery || sourceFilter !== 'all' ? 'No files match your search' : 'No files yet'}
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {searchQuery || sourceFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Files uploaded in tasks and chat will appear here'}
          </p>
        </div>
      )}

      {/* File list grouped by date */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedFiles).map(([dateKey, dateFiles]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {dateKey === 'unknown' ? 'Unknown Date' : formatDate(dateKey)}
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {dateFiles.length} file{dateFiles.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-1">
                {dateFiles.map((file, i) => {
                  const FileIcon = getFileIcon(file);
                  const iconStyle = getFileColor(file);
                  const isExpanded = expandedFile === file.id;

                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg overflow-hidden hover:border-slate-300 dark:hover:border-slate-600/50 transition-all"
                    >
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                        onClick={() => setExpandedFile(isExpanded ? null : file.id)}
                      >
                        <div className={`p-2 rounded-lg ${iconStyle} shrink-0`}>
                          <FileIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            <span>{formatFileSize(file.size)}</span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {formatDate(file.created_at)}
                            </span>
                            {file.source && (
                              <span className={`px-1.5 py-0.5 rounded font-medium ${
                                file.source === 'task'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                {SOURCE_LABELS[file.source] || file.source}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                            className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                            className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            title="Remove from list"
                          >
                            <Trash2 size={14} />
                          </button>
                          {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                        </div>
                      </div>

                      {/* Expanded preview */}
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="overflow-hidden border-t border-slate-100 dark:border-slate-700/30"
                        >
                          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-medium">File Name</p>
                                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 break-all">{file.name}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-medium">Size</p>
                                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{formatFileSize(file.size)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-medium">Source</p>
                                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{file.sourceName || 'Unknown'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-medium">Date</p>
                                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{formatDate(file.created_at)}</p>
                              </div>
                            </div>

                            {/* Image preview */}
                            {file.type?.startsWith('image/') && (file.data || file.url) && (
                              <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700/50 max-w-sm">
                                <img
                                  src={file.data || file.url}
                                  alt={file.name}
                                  className="max-w-full h-auto max-h-48 object-contain bg-white"
                                />
                              </div>
                            )}

                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleDownload(file)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
                              >
                                <Download size={12} />
                                Download
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
