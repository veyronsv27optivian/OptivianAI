import { useState, useEffect } from 'react';
import {
  Users as UsersIcon, UserPlus, Search, X, Check, AlertCircle, Trash2,
  ChevronDown, Filter
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
  admin: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  manager: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  staff: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
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
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

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

      setActionSuccess('Staff member created successfully!');
      setShowAddModal(false);
      setNewStaff({ email: '', password: generateTempPassword(), role: 'staff' });
      loadMembers();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveClick = (member) => {
    setMemberToRemove(member);
    setShowRemoveModal(true);
  };

  const handleRemoveConfirm = async () => {
    if (!memberToRemove || actionLoading) return;
    setActionLoading(true);
    setShowRemoveModal(false);
    setActionError('');
    try {
      const { error } = await removeStaffMember(memberToRemove.id, memberToRemove.user_id);
      if (error) throw new Error(error.message || error);
      setActionSuccess('Staff member removed successfully.');
      loadMembers();
    } catch (err) {
      setActionError(err.message || 'Failed to remove staff member.');
    } finally {
      setActionLoading(false);
      setMemberToRemove(null);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const { error } = await updateStaffRole(memberId, newRole);
      if (error) throw new Error(error.message || error);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users & Roles</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {canManageStaff ? "Manage your organization's team members" : 'View your team members'}
          </p>
        </div>
        {canManageStaff && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-all"
          >
            <UserPlus size={18} />
            Add Staff
          </button>
        )}
      </div>

      {/* Search & filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600">
          <Filter size={16} className="text-slate-400" />
          <span className="text-xs">{filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Success/Error messages */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
          <Check size={16} className="text-emerald-600" />
          <p className="text-sm text-emerald-700">{actionSuccess}</p>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      {/* Staff List */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading staff members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No team members yet</p>
            <p className="text-sm text-slate-400 mt-1">
              {canManageStaff ? 'Add your first team member to get started' : 'Ask your admin to add team members'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Header row */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
              <div className="sm:col-span-5">Email</div>
              <div className="sm:col-span-3">Role</div>
              <div className="sm:col-span-2">Status</div>
              <div className="sm:col-span-2 text-right">Actions</div>
            </div>

            {filteredMembers.map((member) => {
              const roleStyle = roleColors[member.role] || roleColors.staff;
              return (
                <div
                  key={member.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center"
                >
                  {/* Email */}
                  <div className="sm:col-span-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {member.email?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{member.email}</p>
                      <p className="text-xs text-slate-400">ID: {member.id.slice(0, 8)}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="sm:col-span-3">
                    {canManageStaff ? (
                      <div className="relative inline-block">
                        <select
                          value={member.role || 'staff'}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className={`appearance-none px-3 py-1.5 pr-8 rounded-lg text-xs font-medium border ${roleStyle.bg} ${roleStyle.text} border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all`}
                        >
                          {roleOptions.map(r => (
                            <option key={r} value={r} className="bg-white text-slate-900">{r}</option>
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
                    {member.isTempPassword || member.is_temp_password ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Temp Password
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-2 flex justify-end gap-2">
                    {canManageStaff && (
                      <button
                        onClick={() => handleRemoveClick(member)}
                        className="p-2 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600">
                  <UserPlus size={20} className="text-white" />
                </div>
                <h2 className="text-base font-semibold text-slate-900">Add Staff Member</h2>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setActionError(''); }}
                className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  placeholder="staff@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Temporary Password</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newStaff.password}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pr-12 pl-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={regeneratePassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                    title="Generate new password"
                  >
                    <Check size={16} />
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">Share this password securely with the staff member</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map(role => {
                    const style = roleColors[role];
                    const isSelected = newStaff.role === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setNewStaff(prev => ({ ...prev, role }))}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all capitalize ${
                          isSelected
                            ? `${style.bg} ${style.text} border-slate-300`
                            : 'text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">{actionError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setActionError(''); }}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Create Staff'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Staff Confirmation Modal */}
      {showRemoveModal && memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center mb-4">
                <AlertCircle size={24} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Remove Staff Member?</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Are you sure you want to remove <span className="text-slate-900 font-medium">{memberToRemove.email}</span>?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowRemoveModal(false); setMemberToRemove(null); }}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-all text-sm"
              >
                <Trash2 size={16} />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
