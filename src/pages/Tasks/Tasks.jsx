import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  CheckSquare, Plus, Search, AlertCircle,
  ArrowUpIcon, ArrowDownIcon, Calendar, X, Trash2,
  Filter, User, Edit3, ChevronDown, Check, Columns, List,
  Paperclip, MessageSquare, Download, Upload,
  CheckSquare as CheckSquareIcon, MoreHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../services/AuthContext';
import { getTasks, createTask, updateTask, deleteTask, updateAssigneeStatus } from '../../services/taskService';
import { exportTasksToCSV } from '../../services/dataExportService';

const STATUS_CONFIG = {
  pending:      { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', label: 'Pending', col: 'border-t-amber-400' },
  in_progress:  { bg: 'bg-blue-50 dark:bg-blue-900/20',  text: 'text-blue-700 dark:text-blue-400',  dot: 'bg-blue-500',  label: 'In Progress', col: 'border-t-blue-400' },
  review:       { bg: 'bg-violet-50 dark:bg-violet-900/20',text: 'text-violet-700 dark:text-violet-400',dot: 'bg-violet-500',label: 'Review', col: 'border-t-violet-400' },
  done:         { bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-700 dark:text-emerald-400',dot: 'bg-emerald-500',label: 'Done', col: 'border-t-emerald-400' },
  cancelled:    { bg: 'bg-slate-100 dark:bg-slate-800/50',  text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400', label: 'Cancelled', col: 'border-t-slate-400' },
};

const STAFF_STATUSES = ['pending', 'in_progress', 'done'];
const MANAGER_STATUSES = ['pending', 'in_progress', 'review', 'done', 'cancelled'];

const PRIORITY_CONFIG = {
  low:    { icon: ArrowDownIcon, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Low' },
  medium: { icon: ArrowUpIcon,   color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20',   label: 'Medium' },
  high:   { icon: ArrowUpIcon,   color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20',      label: 'High' },
  urgent: { icon: AlertCircle,   color: 'text-red-700 dark:text-red-300',     bg: 'bg-red-100 dark:bg-red-900/30',     label: 'Urgent' },
};

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUS_FILTERS = ['all', ...MANAGER_STATUSES];
const PAGE_SIZE = 20;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === 'done' || status === 'cancelled') return false;
  return new Date(dateStr) < new Date();
}

export default function Tasks() {
  const { user, getStaffMembers } = useAuth();
  const userRole = user?.user_metadata?.role || 'staff';
  const canManage = userRole === 'admin' || userRole === 'owner' || userRole === 'manager' || userRole === 'administrator' || userRole === 'director';

  const [tasks, setTasks] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'board'

  // Pagination (Item 53)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Assignment dropdown
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeRef = useRef(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', assigned_tos: [], priority: 'medium', due_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // File attachments (Item 48)
  const [taskFiles, setTaskFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Comments (Item 49)
  const [taskComments, setTaskComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk actions (Item 50)
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkBar, setShowBulkBar] = useState(false);

  const [myProfileId, setMyProfileId] = useState(null);

  // ─── Load data ──────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    try {
      const data = await getTasks(user);
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }, [user]);

  const loadStaff = useCallback(async () => {
    try {
      const data = await getStaffMembers();
      setStaffMembers(data || []);
    } catch (err) {
      console.error('Failed to load staff:', err);
    }
  }, [getStaffMembers]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTasks(), loadStaff()]).finally(() => setLoading(false));
  }, [loadTasks, loadStaff]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const isDev = !import.meta.env.VITE_SUPABASE_URL;
      if (isDev) {
        const profiles = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
        const p = profiles.find((pr) => pr.user_id === user.id);
        setMyProfileId(p?.id || null);
      } else {
        const { supabase } = await import('../../services/supabase');
        const { data } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
        setMyProfileId(data?.id || null);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!showAssigneeDropdown) return;
    const handler = (e) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) {
        setShowAssigneeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAssigneeDropdown]);

  // ─── Filtering ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all') {
        if (canManage) {
          const matchesTaskStatus = t.status === statusFilter;
          const matchesAnyAssignee = t.assignees?.some((a) => a.status === statusFilter);
          if (!matchesTaskStatus && !matchesAnyAssignee) return false;
        } else {
          const myStatus = t.assignees?.find((a) => a.profile_id === myProfileId)?.status;
          if (myStatus !== statusFilter) return false;
        }
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title?.toLowerCase().includes(q);
        const matchesAssignee = t.assignee_emails?.some((e) => e?.toLowerCase().includes(q));
        if (!matchesTitle && !matchesAssignee) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, searchQuery, canManage, myProfileId]);

  const paginatedTasks = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  // ─── Load more (Item 53) ────────────────────────────────────
  const loadMore = () => setVisibleCount(prev => prev + PAGE_SIZE);

  // Reset pagination when filter changes
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [statusFilter, searchQuery]);

  // ─── Modal handlers ─────────────────────────────────────────
  const toggleAssignee = (profileId) => {
    setFormData((prev) => {
      const current = prev.assigned_tos || [];
      if (current.includes(profileId)) {
        return { ...prev, assigned_tos: current.filter((id) => id !== profileId) };
      }
      return { ...prev, assigned_tos: [...current, profileId] };
    });
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '', assigned_tos: [], priority: 'medium', due_date: '' });
    setTaskFiles([]);
    setTaskComments([]);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    let restoredAssignees = [];
    if (task.assigned_tos && Array.isArray(task.assigned_tos)) {
      restoredAssignees = [...task.assigned_tos];
    } else if (task.assigned_to) {
      restoredAssignees = [task.assigned_to];
    }
    setFormData({
      title: task.title || '',
      description: task.description || '',
      assigned_tos: restoredAssignees,
      priority: task.priority || 'medium',
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
    });
    setTaskFiles(task.files || []);
    setTaskComments(task.comments || []);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assigned_tos: formData.assigned_tos || [],
        priority: formData.priority,
        due_date: formData.due_date || null,
        files: taskFiles,
        comments: taskComments,
      };

      if (editingTask) {
        const { error: err } = await updateTask(user, editingTask.id, payload);
        if (err) throw new Error(err.message || 'Failed to update task');
      } else {
        const { error: err } = await createTask(user, payload);
        if (err) throw new Error(err.message || 'Failed to create task');
      }

      setShowModal(false);
      loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssigneeStatusChange = async (taskId, profileId, newStatus) => {
    try {
      const { error: err } = await updateAssigneeStatus(user, taskId, profileId, newStatus);
      if (err) throw new Error(err.message || 'Failed to update status');
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (taskId) => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const { error: err } = await deleteTask(user, taskId);
      if (err) throw new Error(err.message || 'Failed to delete task');
      setShowDeleteConfirm(null);
      selectedIds.delete(taskId);
      setSelectedIds(new Set(selectedIds));
      loadTasks();
    } catch (err) {
      setDeleteError(err.message || 'Something went wrong while deleting.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── File attachment handlers (Item 48) ─────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const fileEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: file.name,
        size: file.size,
        type: file.type,
        data: ev.target?.result,
      };
      setTaskFiles(prev => [...prev, fileEntry]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeFile = (fileId) => {
    setTaskFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // ─── Comment handlers (Item 49) ─────────────────────────────
  const addComment = () => {
    if (!commentInput.trim()) return;
    const comment = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: commentInput.trim(),
      author: user?.email || 'Anonymous',
      profileId: myProfileId,
      created_at: new Date().toISOString(),
    };
    setTaskComments(prev => [...prev, comment]);
    setCommentInput('');
  };

  const deleteComment = (commentId) => {
    setTaskComments(prev => prev.filter(c => c.id !== commentId));
  };

  // ─── Bulk actions (Item 50) ─────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedTasks.map(t => t.id)));
    }
  };

  const bulkUpdateStatus = async (newStatus) => {
    for (const id of selectedIds) {
      await updateTask(user, id, { status: newStatus });
    }
    setSelectedIds(new Set());
    loadTasks();
  };

  const bulkUpdatePriority = async (newPriority) => {
    for (const id of selectedIds) {
      await updateTask(user, id, { priority: newPriority });
    }
    setSelectedIds(new Set());
    loadTasks();
  };

  const bulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteTask(user, id);
    }
    setSelectedIds(new Set());
    loadTasks();
  };

  // ─── Drag & Drop (Item 47) ──────────────────────────────────
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-slate-100', 'dark:bg-slate-700/30');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-slate-100', 'dark:bg-slate-700/30');
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-slate-100', 'dark:bg-slate-700/30');
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    await updateTask(user, taskId, { status: newStatus });
    loadTasks();
  };

  // ─── Render helpers ─────────────────────────────────────────
  const renderStatusBadge = (status) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  };

  const renderPriorityBadge = (priority) => {
    const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
    const PrioIcon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
        <PrioIcon size={12} />
        {cfg.label}
      </span>
    );
  };

  const renderAssignee = (assignee) => {
    const ast = STATUS_CONFIG[assignee.status] || STATUS_CONFIG.pending;
    const isSelf = assignee.profile_id === myProfileId;
    const canChange = isSelf || canManage;
    return (
      <div key={assignee.profile_id} className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
          {assignee.email?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 truncate min-w-0 flex-1">
          {assignee.email?.split('@')[0] || 'Unknown'}
        </span>
        {canChange ? (
          <div className="relative shrink-0">
            <select
              value={assignee.status}
              onChange={(e) => handleAssigneeStatusChange(
                tasks.find(t => t.assignees?.find(a => a.profile_id === assignee.profile_id))?.id,
                assignee.profile_id,
                e.target.value
              )}
              className={`appearance-none px-2 py-1 pr-6 rounded text-[11px] font-medium border cursor-pointer transition-all ${ast.bg} ${ast.text} border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {(canManage ? MANAGER_STATUSES : STAFF_STATUSES).map((s) => (
                <option key={s} value={s} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {STATUS_CONFIG[s].label}
                </option>
              ))}
            </select>
            <ChevronDown className={`absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none ${ast.text}`} size={10} />
          </div>
        ) : (
          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${ast.bg} ${ast.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ast.dot}`} />
            {ast.label}
          </span>
        )}
      </div>
    );
  };

  // ─── Kanban Board ───────────────────────────────────────────
  const boardColumns = useMemo(() => {
    return MANAGER_STATUSES.map(status => ({
      status,
      label: STATUS_CONFIG[status]?.label || status,
      tasks: filtered.filter(t => {
        if (canManage) {
          return t.status === status || t.assignees?.some(a => a.status === status);
        }
        return t.assignees?.find(a => a.profile_id === myProfileId)?.status === status;
      }),
    }));
  }, [filtered, canManage, myProfileId]);

  const getTaskCardStatus = (task) => {
    if (canManage) return task.status;
    return task.assignees?.find(a => a.profile_id === myProfileId)?.status || task.status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {canManage ? 'Tasks' : 'My Tasks'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {canManage
              ? 'Create, assign, and track tasks across your team'
              : 'Tasks assigned to you'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle (Item 47) */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
              title="List view"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded text-xs transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
              title="Board view"
            >
              <Columns size={16} />
            </button>
          </div>
          {/* Export CSV (Item 56) */}
          <button
            onClick={() => exportTasksToCSV(tasks)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-medium transition-all"
            title="Export CSV"
          >
            <Download size={14} />
            Export
          </button>
          {/* New Task */}
          {canManage && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-all shadow-premium"
            >
              <Plus size={18} />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or assignee..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
          />
        </div>
        <div className="flex flex-wrap p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {s === 'in_progress' ? 'In Prog.' : s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm text-slate-600 dark:text-slate-400">
          <Filter size={16} className="text-slate-400 dark:text-slate-500" />
          <span className="text-xs">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {!loading && viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg overflow-hidden">
          {paginatedTasks.length === 0 ? (
            <div className="p-12 text-center">
              <CheckSquare size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">
                {searchQuery || statusFilter !== 'all'
                  ? 'No tasks match your search'
                  : canManage
                  ? 'No tasks yet'
                  : 'No tasks assigned to you'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {canManage && !searchQuery && statusFilter === 'all'
                  ? 'Create a new task to get started'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div>
              {/* Bulk action bar (Item 50) */}
              <AnimatePresence>
                {selectedIds.size > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-6 py-2.5 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300 mr-2">
                        {selectedIds.size} selected
                      </span>
                      <select
                        onChange={(e) => { bulkUpdateStatus(e.target.value); e.target.value = ''; }}
                        className="px-2 py-1 rounded text-xs border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        defaultValue=""
                      >
                        <option value="" disabled>Set status...</option>
                        {MANAGER_STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                        ))}
                      </select>
                      <select
                        onChange={(e) => { bulkUpdatePriority(e.target.value); e.target.value = ''; }}
                        className="px-2 py-1 rounded text-xs border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        defaultValue=""
                      >
                        <option value="" disabled>Set priority...</option>
                        {PRIORITIES.map(p => (
                          <option key={p} value={p}>{PRIORITY_CONFIG[p]?.label || p}</option>
                        ))}
                      </select>
                      <button
                        onClick={bulkDelete}
                        className="px-3 py-1 rounded text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedIds(new Set())}
                        className="px-3 py-1 rounded text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors ml-auto"
                      >
                        Clear
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Column headers */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                <div className="sm:col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={paginatedTasks.length > 0 && selectedIds.size === paginatedTasks.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-3">Task</div>
                <div className="sm:col-span-3">Assignees</div>
                <div className="sm:col-span-2">Due</div>
                <div className="sm:col-span-1 text-center">Status</div>
                <div className="sm:col-span-1 text-center">Priority</div>
                <div className="sm:col-span-1"></div>
              </div>

              {/* Rows */}
              {paginatedTasks.map((task, i) => {
                const pr = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const PrioIcon = pr.icon;
                const overdue = isOverdue(task.due_date, task.status);
                const commentCount = task.comments?.length || 0;
                const fileCount = task.files?.length || 0;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-700/30 last:border-0"
                  >
                    {/* Checkbox (Item 50) */}
                    <div className="sm:col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    {/* Title + description */}
                    <div className="sm:col-span-3 min-w-0">
                      <button
                        onClick={() => canManage && openEditModal(task)}
                        className={`text-left ${canManage ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{task.description}</p>
                        )}
                        {/* File & comment indicators */}
                        <div className="flex items-center gap-2 mt-1">
                          {fileCount > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                              <Paperclip size={10} />{fileCount}
                            </span>
                          )}
                          {commentCount > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                              <MessageSquare size={10} />{commentCount}
                            </span>
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Assignees */}
                    <div className="sm:col-span-3 min-w-0">
                      {task.assignees?.length > 0 ? (
                        <div className="space-y-1.5">
                          {task.assignees.map((assignee) => renderAssignee(assignee))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 dark:text-slate-500">Unassigned</span>
                      )}
                    </div>

                    {/* Due date */}
                    <div className="sm:col-span-2 flex items-center gap-1.5 text-xs">
                      <Calendar size={14} className={overdue ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'} />
                      <span className={overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-500 dark:text-slate-400'}>
                        {formatDate(task.due_date)}
                        {overdue && ' (overdue)'}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="sm:col-span-1 flex items-center justify-center">
                      {renderStatusBadge(task.status)}
                    </div>

                    {/* Priority */}
                    <div className="sm:col-span-1 flex justify-center">
                      {renderPriorityBadge(task.priority)}
                    </div>

                    {/* Actions */}
                    <div className="sm:col-span-1 flex justify-end gap-1">
                      {canManage && (
                        <>
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1.5 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
                            title="Edit task"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(task)}
                            className="p-1.5 rounded text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            title="Delete task"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load more (Item 53) */}
              {hasMore && (
                <div className="px-6 py-4 text-center border-t border-slate-100 dark:border-slate-700/30">
                  <button
                    onClick={loadMore}
                    className="px-6 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    Load more ({filtered.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── BOARD VIEW (Item 47) ── */}
      {!loading && viewMode === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
          {boardColumns.map(col => (
            <div
              key={col.status}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className="flex-1 min-w-[250px] max-w-[350px] bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50"
            >
              {/* Column header */}
              <div className={`p-3 border-b border-slate-200 dark:border-slate-700/50`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[col.status]?.dot || 'bg-slate-400'}`} />
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.label}</h3>
                  </div>
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {col.tasks.length}
                  </span>
                </div>
              </div>

              {/* Column body */}
              <div className="p-2 space-y-2 min-h-[200px]">
                {col.tasks.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Drop tasks here</p>
                  </div>
                ) : (
                  col.tasks.map(task => {
                    const pr = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                    const PrioIcon = pr.icon;
                    const overdue = isOverdue(task.due_date, task.status);
                    const taskStatus = getTaskCardStatus(task);
                    const colCfg = STATUS_CONFIG[taskStatus] || STATUS_CONFIG.pending;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => canManage && openEditModal(task)}
                        className={`bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700/50 border-t-2 ${colCfg.col} p-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-[0.98]`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">
                            {task.title}
                          </p>
                          <span className={`shrink-0 ${pr.color}`}>
                            <PrioIcon size={14} />
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Assignee avatars */}
                            <div className="flex -space-x-1.5">
                              {task.assignees?.slice(0, 3).map((a) => (
                                <div
                                  key={a.profile_id}
                                  className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-[8px] font-bold"
                                  title={a.email}
                                >
                                  {a.email?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              ))}
                              {(task.assignees?.length || 0) > 3 && (
                                <div className="w-5 h-5 rounded-full bg-slate-400 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-[8px] font-bold">
                                  +{task.assignees.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            {overdue && (
                              <span className="text-red-500 font-medium">
                                {formatDate(task.due_date)}
                              </span>
                            )}
                            {(task.comments?.length || 0) > 0 && (
                              <span className="flex items-center gap-0.5">
                                <MessageSquare size={10} />{task.comments.length}
                              </span>
                            )}
                            {(task.files?.length || 0) > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Paperclip size={10} />{task.files.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL (Items 48, 49) ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-glass-lg dark:shadow-glass-xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600">
                  {editingTask ? (
                    <Edit3 size={18} className="text-white" />
                  ) : (
                    <Plus size={18} className="text-white" />
                  )}
                </div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {editingTask ? 'Edit Task' : 'New Task'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <form onSubmit={handleSave} id="task-form">
                {/* Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    placeholder="What needs to be done?"
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm"
                    placeholder="Add details, requirements, or notes..."
                  />
                </div>

                {/* Assignee */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Assign To</label>
                  <div className="relative" ref={assigneeRef}>
                    <button
                      type="button"
                      onClick={() => setShowAssigneeDropdown((p) => !p)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    >
                      <User size={16} className="text-slate-400 shrink-0" />
                      <span className="flex-1">
                        {formData.assigned_tos.length === 0 ? (
                          <span className="text-slate-400">Select team members...</span>
                        ) : (
                          <span className="text-slate-900 dark:text-slate-100">
                            {formData.assigned_tos.length} member{formData.assigned_tos.length !== 1 ? 's' : ''} selected
                          </span>
                        )}
                      </span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${showAssigneeDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showAssigneeDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {staffMembers.length === 0 ? (
                          <div className="p-4 text-sm text-slate-400 text-center">No team members available</div>
                        ) : (
                          staffMembers.map((m) => {
                            const pid = m.profileId || m.id;
                            const isSelected = (formData.assigned_tos || []).includes(pid);
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => toggleAssignee(pid)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}>
                                  {isSelected && <Check size={10} className="text-white" />}
                                </div>
                                <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                  {m.email?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs">{m.email}</p>
                                  <p className="text-[10px] text-slate-400 capitalize">{m.role}</p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority & Due Date */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRIORITIES.map((p) => {
                        const cfg = PRIORITY_CONFIG[p];
                        const isSelected = formData.priority === p;
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, priority: p }))}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                              isSelected
                                ? `${cfg.color} ${cfg.bg} border-slate-300 dark:border-slate-600`
                                : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <Icon size={14} />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData((p) => ({ ...p, due_date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* File attachments (Item 48) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Attachments</label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center">
                    {taskFiles.length > 0 ? (
                      <div className="space-y-2">
                        {taskFiles.map(file => (
                          <div key={file.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <div className="flex items-center gap-2 min-w-0">
                              <Paperclip size={14} className="text-slate-400 shrink-0" />
                              <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                        >
                          + Add another file
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 w-full py-3 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                      >
                        <Upload size={16} />
                        Click to upload a file
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </form>

              {/* Comments section (Item 49) */}
              <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <MessageSquare size={14} />
                  Comments ({taskComments.length})
                </label>

                {/* Comment list */}
                <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                  {taskComments.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No comments yet</p>
                  ) : (
                    taskComments.map(comment => (
                      <div key={comment.id} className="flex gap-2 group">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5">
                          {comment.author?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{comment.author}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {comment.profileId === myProfileId && (
                              <button
                                onClick={() => deleteComment(comment.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-red-600 transition-all"
                              >
                                <X size={10} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={addComment}
                    disabled={!commentInput.trim()}
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <CheckSquareIcon size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-700/50 shrink-0">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 mb-3">
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="task-form"
                  disabled={saving || !formData.title.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingTask ? 'Update Task' : 'Create Task'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-glass-lg dark:shadow-glass-xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center mb-4">
                <AlertCircle size={24} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Delete Task?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Are you sure you want to delete{' '}
                <span className="text-slate-900 dark:text-slate-100 font-medium">&ldquo;{showDeleteConfirm.title}&rdquo;</span>?
                This action cannot be undone.
              </p>
            </div>
            {deleteError && (
              <div className="px-6 pb-2">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>
                </div>
              </div>
            )}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowDeleteConfirm(null); setDeleteError(''); }}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id)}
                disabled={deleteLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {deleteLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
