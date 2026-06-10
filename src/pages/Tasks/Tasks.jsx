import { useState } from 'react';
import {
  CheckSquare, Plus, Search, Filter, Clock, AlertCircle,
  ArrowUpIcon, ArrowDownIcon, Calendar
} from 'lucide-react';

const statusColors = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500', label: 'Pending' },
  in_progress: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500', label: 'In Progress' },
  review: { bg: 'bg-violet-500/10', text: 'text-violet-400', dot: 'bg-violet-500', label: 'Review' },
  done: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500', label: 'Done' },
  cancelled: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-500', label: 'Cancelled' },
};

const priorityIcons = {
  low: { icon: ArrowDownIcon, color: 'text-emerald-400' },
  medium: { icon: ArrowUpIcon, color: 'text-amber-400' },
  high: { icon: ArrowUpIcon, color: 'text-rose-400' },
  urgent: { icon: AlertCircle, color: 'text-red-400' },
};

const statusFilters = ['all', 'pending', 'in_progress', 'review', 'done'];

export default function Tasks() {
  const [tasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = tasks.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="text-slate-400 mt-1">Manage and track your team's tasks</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-emerald-500/25">
          <Plus size={18} />
          New Task
        </button>
      </div>

      {/* Search & filters */}
      <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all text-sm"
          />
        </div>
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === s ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s === 'in_progress' ? 'In Progress' : s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No tasks yet</p>
            <p className="text-sm text-slate-500 mt-1">Create a new task to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="sm:col-span-5">Task</div>
              <div className="sm:col-span-2">Assigned To</div>
              <div className="sm:col-span-2">Status</div>
              <div className="sm:col-span-2">Due</div>
              <div className="sm:col-span-1"></div>
            </div>
            {filtered.map((task, i) => {
              const statusStyle = statusColors[task.status] || statusColors.pending;
              const PriorityIcon = priorityIcons[task.priority]?.icon || ArrowUpIcon;
              const priorityColor = priorityIcons[task.priority]?.color || 'text-slate-400';
              return (
                <div key={task.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center animate-fade-in-up" style={{ animationDelay: `${0.05 * i}s` }}>
                  <div className="sm:col-span-5 flex items-center gap-3">
                    <PriorityIcon size={16} className={`${priorityColor} shrink-0`} />
                    <p className="text-sm font-medium text-white">{task.title}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-sm text-slate-400">{task.assigned}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {statusStyle.label}
                    </span>
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={14} />
                    {task.due}
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
