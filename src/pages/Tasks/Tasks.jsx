import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckSquare, Plus, Search, AlertCircle,
  ArrowUpIcon, ArrowDownIcon, Calendar, X, Trash2,
  Filter, User, Edit3, ChevronDown, Check
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { getTasks, createTask, updateTask, deleteTask, updateAssigneeStatus } from '../../services/taskService';
import { countDevTasks, migrateDevTasks } from '../../services/migrateTasks';

const STATUS_CONFIG = {
  pending:      { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500',  label: 'Pending' },
  in_progress:  { bg: 'bg-blue-50',  text: 'text-blue-700',  dot: 'bg-blue-500',   label: 'In Progress' },
  review:       { bg: 'bg-violet-50',text: 'text-violet-700',dot: 'bg-violet-500',  label: 'Review' },
  done:         { bg: 'bg-emerald-50',text: 'text-emerald-700',dot: 'bg-emerald-500',label: 'Done' },
  cancelled:    { bg: 'bg-slate-100',  text: 'text-slate-500',  dot: 'bg-slate-400',  label: 'Cancelled' },
};

const STAFF_STATUSES = ['pending', 'in_progress', 'done'];
const MANAGER_STATUSES = ['pending', 'in_progress', 'review', 'done', 'cancelled'];

const PRIORITY_CONFIG = {
  low:    { icon: ArrowDownIcon, color: 'text-emerald-600', label: 'Low' },
  medium: { icon: ArrowUpIcon,   color: 'text-amber-600',   label: 'Medium' },
  high:   { icon: ArrowUpIcon,   color: 'text-red-600',    label: 'High' },
  urgent: { icon: AlertCircle,   color: 'text-red-700',     label: 'Urgent' },
};

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const STATUS_FILTERS = ['all', ...MANAGER_STATUSES];

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
  const canManage = userRole === 'admin' || userRole === 'owner' || userRole === 'manager';

  const [tasks, setTasks] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', assigned_tos: [], priority: 'medium', due_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const [showMigration, setShowMigration] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateDone, setMigrateDone] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);

  useEffect(() => {
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
        loadTasks();
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

  const filtered = tasks.filter((t) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {canManage ? 'Tasks' : 'My Tasks'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {canManage
              ? 'Create, assign, and track tasks across your team'
              : 'Tasks assigned to you'}
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-all"
          >
            <Plus size={18} />
            New Task
          </button>
        )}
      </div>

      {/* Migration Banner */}
      {showMigration && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 shrink-0">
              <AlertCircle size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Tasks found in browser storage
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                You have tasks saved locally from dev mode. Migrate them to your Supabase database to see them here.
              </p>
            </div>
          </div>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {migrating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Migrating...
              </>
            ) : (
              'Migrate My Tasks'
            )}
          </button>
        </div>
      )}

      {/* Migration result */}
      {migrateResult && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          migrateResult.errors?.length > 0
            ? 'bg-red-50 border border-red-200'
            : 'bg-emerald-50 border border-emerald-200'
        }`}>
          {migrateResult.errors?.length > 0 ? (
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          ) : (
            <Check size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-medium text-slate-900">
              {migrateResult.migrated > 0
                ? `Successfully migrated ${migrateResult.migrated} task${migrateResult.migrated !== 1 ? 's' : ''}!`
                : 'No tasks were migrated.'}
            </p>
            {migrateResult.errors?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {migrateResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i} className="text-xs text-red-600">{err}</li>
                ))}
                {migrateResult.errors.length > 5 && (
                  <li className="text-xs text-red-600">...and {migrateResult.errors.length - 5} more</li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or assignee..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
          />
        </div>
        <div className="flex flex-wrap p-1 bg-slate-100 rounded-lg border border-slate-200">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s === 'in_progress' ? 'In Prog.' : s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600">
          <Filter size={16} className="text-slate-400" />
          <span className="text-xs">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Task list */}
      {!loading && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {filtered.length === 0 ? (
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
              {/* Column headers */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50">
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
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    {/* Title + description */}
                    <div className="sm:col-span-4 min-w-0">
                      <button
                        onClick={() => canManage && openEditModal(task)}
                        className={`text-left ${canManage ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
                        )}
                      </button>
                    </div>

                    {/* Assignees */}
                    <div className="sm:col-span-4 min-w-0">
                      {task.assignees?.length > 0 ? (
                        <div className="space-y-1.5">
                          {task.assignees.map((assignee) => {
                            const ast = STATUS_CONFIG[assignee.status] || STATUS_CONFIG.pending;
                            const isSelf = assignee.profile_id === myProfileId;
                            const canChange = isSelf;
                            return (
                              <div key={assignee.profile_id} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                                  {assignee.email?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <span className="text-xs text-slate-500 truncate min-w-0 flex-1">
                                  {assignee.email?.split('@')[0] || 'Unknown'}
                                </span>
                                {canChange ? (
                                  <div className="relative shrink-0">
                                    <select
                                      value={assignee.status}
                                      onChange={(e) => handleAssigneeStatusChange(task.id, assignee.profile_id, e.target.value)}
                                      className={`appearance-none px-2 py-1 pr-6 rounded text-[11px] font-medium border cursor-pointer transition-all ${ast.bg} ${ast.text} border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    >
                                      {(canManage ? MANAGER_STATUSES : STAFF_STATUSES).map((s) => (
                                        <option key={s} value={s} className="bg-white text-slate-900">
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
                        <span className="text-sm text-slate-400">Unassigned</span>
                      )}
                    </div>

                    {/* Due date */}
                    <div className="sm:col-span-2 flex items-center gap-1.5 text-xs">
                      <Calendar size={14} className={overdue ? 'text-red-500' : 'text-slate-400'} />
                      <span className={overdue ? 'text-red-600 font-medium' : 'text-slate-500'}>
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
                            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                            title="Edit task"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(task)}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600">
                  {editingTask ? (
                    <Edit3 size={18} className="text-white" />
                  ) : (
                    <Plus size={18} className="text-white" />
                  )}
                </div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingTask ? 'Edit Task' : 'New Task'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  placeholder="What needs to be done?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm"
                  placeholder="Add details, requirements, or notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign To</label>
                <div className="relative" ref={assigneeRef}>
                  <button
                    type="button"
                    onClick={() => setShowAssigneeDropdown((p) => !p)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  >
                    <User size={16} className="text-slate-400 shrink-0" />
                    <span className="flex-1">
                      {formData.assigned_tos.length === 0 ? (
                        <span className="text-slate-400">Select team members...</span>
                      ) : (
                        <span className="text-slate-900">
                          {formData.assigned_tos.length} member{formData.assigned_tos.length !== 1 ? 's' : ''} selected
                        </span>
                      )}
                    </span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${showAssigneeDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showAssigneeDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-slate-300'
                              }`}>
                                {isSelected && <Check size={10} className="text-white" />}
                              </div>
                              <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                                {m.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate">{m.email}</p>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
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
                              ? `${cfg.color} bg-white border-slate-300`
                              : 'text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData((p) => ({ ...p, due_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
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
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center mb-4">
                <AlertCircle size={24} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Delete Task?</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Are you sure you want to delete <span className="text-slate-900 font-medium">&ldquo;{showDeleteConfirm.title}&rdquo;</span>?
                This action cannot be undone.
              </p>
            </div>
            {deleteError && (
              <div className="px-6 pb-2">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">{deleteError}</p>
                </div>
              </div>
            )}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowDeleteConfirm(null); setDeleteError(''); }}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all text-sm"
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
