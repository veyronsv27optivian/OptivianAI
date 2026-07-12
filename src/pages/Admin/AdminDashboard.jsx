import { useState, useEffect } from 'react';
import {
  Shield, Users, Search, UserPlus, X, Check, AlertCircle,
  Ban, ShieldOff, Key,
} from 'lucide-react';
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

export default function AdminDashboard() {
  const {
    user, profile, getStaffMembers, createStaffMember,
    removeStaffMember, updateStaffRole, suspendMember,
  } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [memberToAction, setMemberToAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Invite form
  const [inviteForm, setInviteForm] = useState({
    email: '',
    password: generateTempPassword(),
    role: 'staff',
  });

  const userRole = profile?.role || user?.user_metadata?.role || 'staff';
  const canManage = ['super_admin', 'owner', 'administrator', 'director', 'manager'].includes(userRole);
  const availableRoles = getLowerRoles(userRole).map(r => r.id);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getStaffMembers();
      setMembers(data || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMembers(); }, [getStaffMembers]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    try {
      const { error } = await createStaffMember(inviteForm);
      if (error) throw new Error(error.message);
      setActionSuccess(`Invitation sent to ${inviteForm.email}`);
      setShowInviteModal(false);
      setInviteForm({ email: '', password: generateTempPassword(), role: 'staff' });
      loadMembers();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!memberToAction) return;
    setActionLoading(true);
    try {
      const { error } = await removeStaffMember(memberToAction.id, memberToAction.user_id);
      if (error) throw new Error(error.message);
      setActionSuccess(`Removed ${memberToAction.email}`);
      setShowRemoveModal(false);
      setMemberToAction(null);
      loadMembers();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!memberToAction) return;
    setActionLoading(true);
    try {
      const shouldSuspend = !memberToAction.is_suspended;
      const { error } = await suspendMember(memberToAction.profileId || memberToAction.id, shouldSuspend);
      if (error) throw new Error(error.message);
      setActionSuccess(shouldSuspend ? `Suspended ${memberToAction.email}` : `Unsuspended ${memberToAction.email}`);
      setShowSuspendModal(false);
      setMemberToAction(null);
      loadMembers();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (member, newRole) => {
    try {
      const { error } = await updateStaffRole(member.profileId || member.id, newRole);
      if (error) throw new Error(error.message);
      setActionSuccess(`Role updated for ${member.email}`);
      loadMembers();
    } catch (err) {
      setActionError(err.message);
    }
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
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage team members, roles, and permissions</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all"
          >
            <UserPlus size={18} />
            Invite Member
          </button>
        )}
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
        />
      </div>

      {/* Members Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading team members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No team members found</p>
            <p className="text-sm text-slate-400 mt-1">
              {canManage ? 'Invite your first team member to get started' : 'Ask your admin to add team members'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
              <div className="md:col-span-3">Member</div>
              <div className="md:col-span-2">Role</div>
              <div className="md:col-span-2">Provider</div>
              <div className="md:col-span-2">Status</div>
              <div className="md:col-span-3 text-right">Actions</div>
            </div>

            {filteredMembers.map((member) => {
              const roleInfo = getRoleInfo(member.role);
              return (
                <div
                  key={member.id || member.profileId}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center"
                >
                  {/* Member info */}
                  <div className="md:col-span-3 flex items-center gap-3">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {(member.full_name || member.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {member.full_name || member.email?.split('@')[0] || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{member.email}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="md:col-span-2">
                    {canManage && availableRoles.includes(member.role) ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member, e.target.value)}
                        className="appearance-none px-3 py-1.5 pr-8 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        {availableRoles.map(r => (
                          <option key={r} value={r}>{getRoleInfo(r).label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${roleInfo.bg} ${roleInfo.color}`}>
                        <span className="capitalize">{roleInfo.label}</span>
                      </span>
                    )}
                  </div>

                  {/* Provider */}
                  <div className="md:col-span-2">
                    <span className="text-xs text-slate-500 capitalize">
                      {member.provider || 'email'}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="md:col-span-2">
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
                  <div className="md:col-span-3 flex justify-end gap-1">
                    {canManage && (
                      <>
                        <button
                          onClick={() => {
                            setMemberToAction(member);
                            setShowSuspendModal(true);
                          }}
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
                          onClick={() => {
                            setMemberToAction(member);
                            setShowRemoveModal(true);
                          }}
                          className="p-2 rounded text-red-600 hover:bg-red-50 transition-all"
                          title="Remove member"
                        >
                          <X size={16} />
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600">
                  <UserPlus size={20} className="text-white" />
                </div>
                <h2 className="text-base font-semibold text-slate-900">Invite Team Member</h2>
              </div>
              <button onClick={() => { setShowInviteModal(false); setActionError(''); }}
                className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  placeholder="colleague@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Temporary Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={inviteForm.password}
                    onChange={(e) => setInviteForm(p => ({ ...p, password: e.target.value }))}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setInviteForm(p => ({ ...p, password: generateTempPassword() }))}
                    className="px-3 py-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium"
                    title="Generate new password"
                  >
                    <Key size={16} />
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">Share this password securely with the new member</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                >
                  {availableRoles.map(r => (
                    <option key={r} value={r}>{getRoleInfo(r).label}</option>
                  ))}
                </select>
              </div>

              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{actionError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowInviteModal(false); setActionError(''); }}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 text-sm"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Send Invitation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveModal && memberToAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center mb-4">
                <AlertCircle size={24} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Remove Team Member?</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Are you sure you want to remove{' '}
                <span className="text-slate-900 font-medium">{memberToAction.full_name || memberToAction.email}</span>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowRemoveModal(false); setMemberToAction(null); }}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 text-sm"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Remove'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && memberToAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg">
            <div className="p-6 text-center">
              <div className={`mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                memberToAction.is_suspended ? 'bg-emerald-600' : 'bg-amber-600'
              }`}>
                {memberToAction.is_suspended ? <ShieldOff size={24} className="text-white" /> : <Ban size={24} className="text-white" />}
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {memberToAction.is_suspended ? 'Unsuspend' : 'Suspend'} Team Member?
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                {memberToAction.is_suspended
                  ? `Reactivate ${memberToAction.full_name || memberToAction.email}'s access?`
                  : `This will prevent ${memberToAction.full_name || memberToAction.email} from accessing the workspace.`
                }
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowSuspendModal(false); setMemberToAction(null); }}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={actionLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50 text-sm ${
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
