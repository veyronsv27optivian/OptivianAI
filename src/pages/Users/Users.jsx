import { useState, useEffect } from 'react';
import {
  Users as UsersIcon, UserPlus, Search, X, Check, AlertCircle, Trash2,
  ChevronDown, Sparkles, Filter
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pwd = '';
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

const roleColors = {
  admin: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500' },
  manager: { bg: 'bg-violet-500/10', text: 'text-violet-400', dot: 'bg-violet-500' },
  staff: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
};

const roleOptions = ['admin', 'manager', 'staff'];

export default function Users() {
  const { getStaffMembers, createStaffMember, removeStaffMember, updateStaffRole, user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ email: '', password: generateTempPassword(), role: 'staff' });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const userRole = user?.user_metadata?.role || 'staff';
  const canManageStaff = userRole === 'admin' || userRole === 'manager';

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getStaffMembers();
      setMembers(data || []);
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMembers(); }, [getStaffMembers]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const { error } = await createStaffMember({
        email: newStaff.email,
        password: newStaff.password,
        role: newStaff.role,
      });
      if (error) throw new Error(error.message);

      setActionSuccess(`Staff member created successfully!`);
      setShowAddModal(false);
      setNewStaff({ email: '', password: generateTempPassword(), role: 'staff' });
      loadMembers();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    setActionLoading(true);
    try {
      await removeStaffMember(memberId);
      loadMembers();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await updateStaffRole(memberId, newRole);
      loadMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const regeneratePassword = () => {
    setNewStaff(prev => ({ ...prev, password: generateTempPassword() }));
  };

  const filteredMembers = members.filter(m =>
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-white">Users & Roles</h1>
          <p className="text-slate-400 mt-1">
            {canManageStaff ? "Manage your organization's team members" : 'View your team members'}
          </p>
        </div>
        {canManageStaff && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-600 hover:to-indigo-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-500/25"
          >
            <UserPlus size={18} />
            Add Staff
          </button>
        )}
      </div>

      {/* Search & filters */}
      <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400">
          <Filter size={16} />
          <span>{filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Success/Error messages */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 animate-fade-in">
          <Check size={16} className="text-emerald-400" />
          <p className="text-sm text-emerald-400">{actionSuccess}</p>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 animate-fade-in">
          <AlertCircle size={16} className="text-red-400" />
          <p className="text-sm text-red-400">{actionError}</p>
        </div>
      )}

      {/* Staff List */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading staff members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No team members yet</p>
            <p className="text-sm text-slate-500 mt-1">
              {canManageStaff ? 'Add your first team member to get started' : 'Ask your admin to add team members'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {/* Header row */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="sm:col-span-5">Email</div>
              <div className="sm:col-span-3">Role</div>
              <div className="sm:col-span-2">Status</div>
              <div className="sm:col-span-2 text-right">Actions</div>
            </div>

            {filteredMembers.map((member, i) => {
              const roleStyle = roleColors[member.role] || roleColors.staff;
              return (
                <div
                  key={member.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center animate-fade-in-up"
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  {/* Email */}
                  <div className="sm:col-span-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/20 shrink-0">
                      {member.email?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{member.email}</p>
                      <p className="text-xs text-slate-500">ID: {member.id.slice(0, 8)}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="sm:col-span-3">
                    {canManageStaff ? (
                      <div className="relative inline-block group">
                        <select
                          value={member.role || 'staff'}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className={`appearance-none px-3 py-1.5 pr-8 rounded-lg text-xs font-medium border ${roleStyle.bg} ${roleStyle.text} border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer transition-all`}
                        >
                          {roleOptions.map(r => (
                            <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${roleStyle.text}`} />
                      </div>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`} />
                        <span className="capitalize">{member.role || 'staff'}</span>
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${member.isTempPassword || member.is_temp_password ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span className={`text-xs ${member.isTempPassword || member.is_temp_password ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {member.isTempPassword || member.is_temp_password ? 'Temp Password' : 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-2 flex justify-end gap-2">
                    {canManageStaff && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Remove member"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && canManageStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600">
                  <UserPlus size={20} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">Add Staff Member</h2>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setActionError(''); }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                  placeholder="staff@company.com"
                />
              </div>

              {/* Temp Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Temporary Password</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newStaff.password}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pr-12 pl-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={regeneratePassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Generate new password"
                  >
                    <Sparkles size={16} />
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">Share this password securely with the staff member</p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map(role => {
                    const style = roleColors[role];
                    const isSelected = newStaff.role === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setNewStaff(prev => ({ ...prev, role }))}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${
                          isSelected
                            ? `${style.bg} ${style.text} border-white/10`
                            : 'text-slate-400 border-white/5 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {actionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{actionError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setActionError(''); }}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Create Staff
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
