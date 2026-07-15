import { useState, useEffect } from 'react';
import {
  Users as UsersIcon, UserPlus, Search, X, Check, AlertCircle, Trash2,
  ChevronDown, Filter, Ban, ShieldOff, Key, Shield, Download,
} from 'lucide-react';
import { exportUsersToCSV } from '../../services/dataExportService';
import { useAuth } from '../../services/AuthContext';
import { getRoleInfo, getLowerRoles } from '../../services/auth/roles';

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pwd = '';
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export default function Users() {
  const {
    user, profile, getStaffMembers, createStaffMember,
    removeStaffMember, updateStaffRole, suspendMember,
  } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [memberToAction, setMemberToAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Add form
  const [newStaff, setNewStaff] = useState({ email: '', password: generateTempPassword(), role: 'staff' });

  const userRole = profile?.role || user?.user_metadata?.role || 'staff';
  const canManage = ['super_admin', 'owner', 'administrator', 'director', 'manager'].includes(userRole);
  const availableRoles = getLowerRoles(userRole).map(r => r.id);

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
    setMemberToAction(member);
    setShowRemoveModal(true);
  };

  const handleRemoveConfirm = async () => {
    if (!memberToAction || actionLoading) return;
    setActionLoading(true);
    setShowRemoveModal(false);
    try {
      const { error } = await removeStaffMember(memberToAction.id, memberToAction.user_id);
      if (error) throw new Error(error.message || error);
      setActionSuccess('Staff member removed successfully.');
      loadMembers();
    } catch (err) {
      setActionError(err.message || 'Failed to remove staff member.');
    } finally {
      setActionLoading(false);
      setMemberToAction(null);
    }
  };

  const handleRoleChange = async (member, newRole) => {
    try {
      const { error } = await updateStaffRole(member.profileId || member.id, newRole);
      if (error) throw new Error(error.message || error);
      loadMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuspendClick = (member) => {
    setMemberToAction(member);
    setShowSuspendModal(true);
  };

  const handleSuspendConfirm = async () => {
    if (!memberToAction) return;
    setActionLoading(true);
    setShowSuspendModal(false);
    try {
      const shouldSuspend = !memberToAction.is_suspended;
      const { error } = await suspendMember(memberToAction.profileId || memberToAction.id, shouldSuspend);
      if (error) throw new Error(error.message);
      setActionSuccess(shouldSuspend ? 'Member suspended.' : 'Member unsuspended.');
      loadMembers();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
      setMemberToAction(null);
    }
  };

  const regeneratePassword = () => {
    setNewStaff(prev => ({ ...prev, password: generateTempPassword() }));
  };

  const filteredMembers = members.filter(m =>
    m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Users & Roles</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {canManage ? "Manage your organization's team members" : 'View your team members'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportUsersToCSV(members)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-medium transition-all"
            title="Export CSV"
          >
            <Download size={14} />
            Export
          </button>
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-all shadow-premium"
            >
              <UserPlus size={18} />
              Add Staff
            </button>
          )}
        </div>
      </div>

      {/* Success/Error messages */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
          <Check size={16} className="text-emerald-600" />
          <p className="text-sm text-emerald-700">{actionSuccess}</p>
          <button onClick={() => setActionSuccess('')} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X size={16} />
          </button>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <p className="text-sm text-red-700">{actionError}</p>
          <button onClick={() => setActionError('')} className="ml-auto text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search & filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-600 dark:text-text-secondary">
          <Filter size={16} className="text-slate-400 dark:text-slate-500" />
          <span className="text-xs">{filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white dark:dark-card-metallic border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
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
              {canManage ? 'Add your first team member to get started' : 'Ask your admin to add team members'}
            </p>
          </div>
        ) : (            <div className="divide-y divide-slate-100 dark:divide-slate-700/30">
            {/* Header row */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-white/[0.03]">
              <div className="sm:col-span-4">Member</div>
              <div className="sm:col-span-3">Role</div>
              <div className="sm:col-span-2">Status</div>
              <div className="sm:col-span-3 text-right">Actions</div>
            </div>

            {filteredMembers.map((member) => {
              const roleInfo = getRoleInfo(member.role);
              return (
                <div
                  key={member.id || member.profileId}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors items-center"
                >
                  {/* Member info */}
                  <div className="sm:col-span-4 flex items-center gap-3">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {(member.full_name || member.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {member.full_name || member.email?.split('@')[0] || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{member.email}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="sm:col-span-3">
                    {canManage && availableRoles.includes(member.role) ? (
                      <div className="relative inline-block">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member, e.target.value)}
                          className={`appearance-none px-3 py-1.5 pr-8 rounded-lg text-xs font-medium border ${roleInfo.bg} ${roleInfo.color} border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all`}
                        >
                          {availableRoles.map(r => (
                            <option key={r} value={r}>{getRoleInfo(r).label}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${roleInfo.color}`} />
                      </div>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${roleInfo.bg} ${roleInfo.color}`}>
                        <span className="capitalize">{roleInfo.label}</span>
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="sm:col-span-2">
                    {member.is_suspended ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-2.5 py-1 rounded-lg font-medium">
                        <Ban size={12} />
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-3 flex justify-end gap-1">
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleSuspendClick(member)}
                          className={`p-2 rounded transition-all ${
                            member.is_suspended
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-amber-600 hover:bg-amber-50'
                          }`}
                          title={member.is_suspended ? 'Unsuspend' : 'Suspend'}
                        >
                          {member.is_suspended ? <ShieldOff size={16} /> : <Ban size={16} />}
                        </button>
                        <button
                          onClick={() => handleRemoveClick(member)}
                          className="p-2 rounded text-red-600 hover:bg-red-50 transition-all"
                          title="Remove member"
                        >
                          <Trash2 size={16} />
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

      {/* Add Staff Modal */}
      {showAddModal && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">            <div className="w-full max-w-lg bg-white dark:bg-surface-raised/95 border border-slate-200 dark:border-white/10 rounded-xl shadow-glass-lg dark:shadow-glass-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600">
                  <UserPlus size={20} className="text-white" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Add Staff Member</h2>
              </div>
              <button onClick={() => { setShowAddModal(false); setActionError(''); }}
                className="p-1.5 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all">
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
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
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
                    className="w-full pr-12 pl-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={regeneratePassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                    title="Generate new password"
                  >
                    <Key size={16} />
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">Share this password securely with the staff member</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                >
                  {availableRoles.map(r => (
                    <option key={r} value={r}>{getRoleInfo(r).label}</option>
                  ))}
                </select>
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
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all text-sm"
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
      {showRemoveModal && memberToAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
          <div              className="w-full max-w-md bg-white dark:bg-surface-raised/95 border border-slate-200 dark:border-white/10 rounded-xl shadow-glass-lg dark:shadow-glass-xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center mb-4">
                <AlertCircle size={24} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Remove Staff Member?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Are you sure you want to remove{' '}
                <span className="text-slate-900 dark:text-slate-100 font-medium">{memberToAction.full_name || memberToAction.email}</span>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowRemoveModal(false); setMemberToAction(null); }}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-all text-sm"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 size={16} />
                    Remove
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && memberToAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-surface-raised/95 border border-slate-200 dark:border-white/10 rounded-xl shadow-glass-lg dark:shadow-glass-xl">
            <div className="p-6 text-center">
              <div className={`mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                memberToAction.is_suspended ? 'bg-emerald-600' : 'bg-amber-600'
              }`}>
                {memberToAction.is_suspended
                  ? <ShieldOff size={24} className="text-white" />
                  : <Ban size={24} className="text-white" />
                }
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {memberToAction.is_suspended ? 'Unsuspend' : 'Suspend'} Member?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {memberToAction.is_suspended
                  ? `Reactivate ${memberToAction.full_name || memberToAction.email}'s access?`
                  : `Prevent ${memberToAction.full_name || memberToAction.email} from accessing the workspace?`
                }
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowSuspendModal(false); setMemberToAction(null); }}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendConfirm}
                disabled={actionLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white transition-all text-sm ${
                  memberToAction.is_suspended
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  memberToAction.is_suspended ? 'Unsuspend' : 'Suspend'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
