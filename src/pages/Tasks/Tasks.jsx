
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckSquare, Plus, Search, AlertCircle,
  ArrowUpIcon, ArrowDownIcon, Calendar, X, Trash2,
  Sparkles, Filter, User, Edit3, ChevronDown, Check
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { getTasks, createTask, updateTask, deleteTask, updateAssigneeStatus } from '../../services/taskService';
import { countDevTasks, migrateDevTasks } from '../../services/migrateTasks';

// ── Constants ────────────────────────────────────

const STATUS_CONFIG = {
  pending:      { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500',  label: 'Pending' },
  in_progress:  { bg: 'bg-blue-500/10',  text: 'text-blue-400',  dot: 'bg-blue-500',   label: 'In Progress' },
  review:       { bg: 'bg-violet-500/10',text: 'text-violet-400',dot: 'bg-violet-500',  label: 'Review' },
  done:         { bg: 'bg-emerald-500/10',text: 'text-emerald-400',dot: 'bg-emerald-500',label: 'Done' },
  cancelled:    { bg: 'bg-slate-500/10',  text: 'text-slate-400',  dot: 'bg-slate-500',  label: 'Cancelled' },
};

const STAFF_STATUSES = ['pending', 'in_progress', 'done'];
const MANAGER_STATUSES = ['pending', 'in_progress', 'review', 'done', 'cancelled'];

const PRIORITY_CONFIG = {
  low:    { icon: ArrowDownIcon, color: 'text-emerald-400', label: 'Low' },
  medium: { icon: ArrowUpIcon,   color: 'text-amber-400',   label: 'Medium' },
  high:   { icon: ArrowUpIcon,   color: 'text-rose-400',    label: 'High' },
  urgent: { icon: AlertCircle,   color: 'text-red-400',     label: 'Urgent' },
};

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const STATUS_FILTERS = ['all', ...MANAGER_STATUSES];

// ── Helpers ───────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === 'done' || status === 'cancelled') return false;
  return new Date(dateStr) < new Date();
}

// ── Component ────────────────────────────────────

export default function Tasks() {
  const { user, getStaffMembers } = useAuth();
  const userRole = user?.user_metadata?.role || 'staff';
  const canManage = userRole === 'admin' || userRole === 'manager';

  const [tasks, setTasks] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Multi-assignee dropdown state
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeRef = useRef(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null = create, object = edit
  const [formData, setFormData] = useState({
    title: '', description: '', assigned_tos: [], priority: 'medium', due_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Data loading ────────────────────────────────
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

  // ── Modal helpers ───────────────────────────────
  // Close assignee dropdown on outside click
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
    setError('');
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    // Handle both new (assigned_tos array) and legacy (assigned_to string) formats
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

  // Update ONE assignee's personal status on a task
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
      loadTasks();
    } catch (err) {
      setDeleteError(err.message || 'Something went wrong while deleting.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Resolve the current user's profile ID for permission checks
  // ── Dev-to-Supabase migration ────────────────
  const [showMigration, setShowMigration] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateDone, setMigrateDone] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);

  useEffect(() => {
    // Show migration banner if: Supabase mode AND localStorage has tasks
    const isDev = !import.meta.env.VITE_SUPABASE_URL;
    if (!isDev && !migrateDone) {
      const count = countDevTasks();
      setShowMigration(count > 0);
    }
  }, [migrateDone]);

  const handleMigrate = async () => {
    if (!user) return;
    setMigrating(true);
    setMigrateResult(null);
    try {
      const result = await migrateDevTasks(user.id);
      setMigrateResult(result);
      if (result.migrated > 0) {
        setShowMigration(false);
        setMigrateDone(true);
        loadTasks(); // refresh the task list
      }
    } catch (err) {
      setMigrateResult({ migrated: 0, errors: [err.message] });
    } finally {
      setMigrating(false);
    }
  };

  const [myProfileId, setMyProfileId] = useState(null);
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

  // ── Filtering ───────────────────────────────────
  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'all') {
      if (canManage) {
        // Admin: filter by task-level status OR any assignee's status
        const matchesTaskStatus = t.status === statusFilter;
        const matchesAnyAssignee = t.assignees?.some((a) => a.status === statusFilter);
        if (!matchesTaskStatus && !matchesAnyAssignee) return false;
      } else {
        // Staff: filter by THEIR status on the task
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

  // ── Render ──────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {canManage ? 'Tasks' : 'My Tasks'}
          </h1>
          <p className="text-slate-400 mt-1">
            {canManage
              ? 'Create, assign, and track tasks across your team'
              : 'Tasks assigned to you'}
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-emerald-500/25"
          >
            <Plus size={18} />
            New Task
          </button>
        )}
      </div>

      {/* ── Dev-to-Supabase Migration Banner ── */}
      {showMigration && (
        <div className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 shrink-0">
              <Sparkles size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Tasks found in browser storage
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You have tasks saved locally from dev mode. Migrate them to your Supabase database to see them here.
              </p>
            </div>
          </div>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {migrating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Migrate My Tasks
              </>
            )}
          </button>
        </div>
      )}

      {/* Migration result toast */}
      {migrateResult && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 animate-fade-in-up ${
          migrateResult.errors?.length > 0
            ? 'bg-rose-500/10 border border-rose-500/20'
            : 'bg-emerald-500/10 border border-emerald-500/20'
        }`}>
          {migrateResult.errors?.length > 0 ? (
            <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-semibold text-white">
              {migrateResult.migrated > 0
                ? `Successfully migrated ${migrateResult.migrated} task${migrateResult.migrated !== 1 ? 's' : ''}!`
                : 'No tasks were migrated.'}
            </p>
            {migrateResult.errors?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {migrateResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i} className="text-xs text-rose-400">{err}</li>
                ))}
                {migrateResult.errors.length > 5 && (
                  <li className="text-xs text-rose-400">...and {migrateResult.errors.length - 5} more</li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="relative flex-1 max-w-md w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or assignee..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all text-sm"
          />
        </div>
        <div className="flex flex-wrap p-1 bg-white/5 rounded-xl border border-white/10">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s === 'in_progress' ? 'In Prog.' : s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400">
          <Filter size={16} />
          <span>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Task list */}
      {!loading && (
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <CheckSquare size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">
                {searchQuery || statusFilter !== 'all'
                  ? 'No tasks match your search'
                  : canManage
                  ? 'No tasks yet'
                  : 'No tasks assigned to you'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {canManage && !searchQuery && statusFilter === 'all'
                  ? 'Create a new task to get started'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div>
              {/* Column headers */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-white/5">
                <div className="sm:col-span-4">Task</div>
                <div className="sm:col-span-4">Assignees</div>
                <div className="sm:col-span-2">Due</div>
                <div className="sm:col-span-1 text-center">Priority</div>
                <div className="sm:col-span-1"></div>
              </div>

              {/* Rows */}
              {filtered.map((task, i) => {
                const pr = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const PrioIcon = pr.icon;
                const overdue = isOverdue(task.due_date, task.status);

                return (
                  <div
                    key={task.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 px-6 py-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0 animate-fade-in-up"
                    style={{ animationDelay: `${0.03 * i}s` }}
                  >
                    {/* Title + description */}
                    <div className="sm:col-span-4 min-w-0">
                      <button
                        onClick={() => canManage && openEditModal(task)}
                        className={`text-left ${canManage ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <p className="text-sm font-medium text-white truncate transition-colors">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
                        )}
                      </button>
                    </div>

                    {/* Assignees with individual statuses */}
                    <div className="sm:col-span-4 min-w-0">
                      {task.assignees?.length > 0 ? (
                        <div className="space-y-1.5">
                          {task.assignees.map((assignee) => {
                            const ast = STATUS_CONFIG[assignee.status] || STATUS_CONFIG.pending;
                            const isSelf = assignee.profile_id === myProfileId;
                            const canChange = canManage || isSelf;
                            return (
                              <div key={assignee.profile_id} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                  {assignee.email?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <span className="text-xs text-slate-400 truncate min-w-0 flex-1">
                                  {assignee.email?.split('@')[0] || 'Unknown'}
                                </span>
                                {canChange ? (
                                  <div className="relative shrink-0">
                                    <select
                                      value={assignee.status}
                                      onChange={(e) => handleAssigneeStatusChange(task.id, assignee.profile_id, e.target.value)}
                                      className={`appearance-none px-2 py-1 pr-6 rounded text-[11px] font-medium border cursor-pointer transition-all ${ast.bg} ${ast.text} border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30`}
                                    >
                                      {(canManage ? MANAGER_STATUSES : STAFF_STATUSES).map((s) => (
                                        <option key={s} value={s} className="bg-slate-900 text-white">
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
                          })}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">Unassigned</span>
                      )}
                    </div>

                    {/* Due date */}
                    <div className="sm:col-span-2 flex items-center gap-1.5 text-xs">
                      <Calendar size={14} className={overdue ? 'text-rose-400' : 'text-slate-500'} />
                      <span className={overdue ? 'text-rose-400 font-medium' : 'text-slate-500'}>
                        {formatDate(task.due_date)}
                        {overdue && ' (overdue)'}
                      </span>
                    </div>

                    {/* Priority */}
                    <div className="sm:col-span-1 flex justify-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${pr.color}`}>
                        <PrioIcon size={14} />
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="sm:col-span-1 flex justify-end gap-1">
                      {canManage && (
                        <>
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                            title="Edit task"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(task)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
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
            </div>
          )}
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600">
                  {editingTask ? (
                    <Edit3 size={20} className="text-white" />
                  ) : (
                    <Plus size={20} className="text-white" />
                  )}
                </div>
                <h2 className="text-lg font-bold text-white">
                  {editingTask ? 'Edit Task' : 'New Task'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
                  placeholder="What needs to be done?"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all resize-none"
                  placeholder="Add details, requirements, or notes..."
                />
              </div>

              {/* Assigned To (multi-select) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Assign To</label>
                <div className="relative" ref={assigneeRef}>
                  <button
                    type="button"
                    onClick={() => setShowAssigneeDropdown((p) => !p)}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                  >
                    <User size={16} className="text-slate-500 shrink-0" />
                    <span className="flex-1 text-sm">
                      {formData.assigned_tos.length === 0 ? (
                        <span className="text-slate-500">Select team members...</span>
                      ) : (
                        <span className="text-white">
                          {formData.assigned_tos.length} member{formData.assigned_tos.length !== 1 ? 's' : ''} selected
                        </span>
                      )}
                    </span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${showAssigneeDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showAssigneeDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-slate-800 border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-scale-in">
                      {staffMembers.length === 0 ? (
                        <div className="p-4 text-sm text-slate-500 text-center">No team members available</div>
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
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'text-slate-300 hover:bg-white/5'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'border-white/20'
                              }`}>
                                {isSelected && <Check size={10} className="text-white" />}
                              </div>
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                {m.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate">{m.email}</p>
                                <p className="text-[10px] text-slate-500 capitalize">{m.role}</p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Priority + Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
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
                          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all capitalize ${
                            isSelected
                              ? `${cfg.color} bg-white/10 border-white/20`
                              : 'text-slate-400 border-white/5 hover:bg-white/5 hover:text-white'
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
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData((p) => ({ ...p, due_date: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.title.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      {editingTask ? 'Update Task' : 'Create Task'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ──────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
            <div className="p-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/25 mb-4">
                <AlertCircle size={28} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete Task?</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Are you sure you want to delete <span className="text-white font-medium">&ldquo;{showDeleteConfirm.title}&rdquo;</span>?
                This action cannot be undone.
              </p>
            </div>
            {deleteError && (
          <div className="px-6 pb-2">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{deleteError}</p>
            </div>
          </div>
        )}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowDeleteConfirm(null); setDeleteError(''); }}
                className="flex-1 px-4 py-3 rounded-xl font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id)}
                disabled={deleteLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-[0.98] transition-all shadow-lg shadow-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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


