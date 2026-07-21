import { useState, useEffect } from 'react';
import {
  Building2, Plus, X, Edit3, Trash2, Users as UsersIcon,
  ChevronRight, ChevronDown, UserCircle, Target, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import {
  getDepartments, createDepartment,
  getTeams, createTeam,
  getOrganization,
} from '../../services/organizationService';

export default function OrganizationStructure() {
  const { user, profile } = useAuth();
  const [org, setOrg] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [expandedDepts, setExpandedDepts] = useState({});
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', description: '', parentDepartmentId: '' });
  const [teamForm, setTeamForm] = useState({ name: '', description: '', departmentId: '' });

  const orgId = profile?.organization_id || user?.user_metadata?.organization_id;
  const isAdmin = ['super_admin', 'owner', 'administrator', 'director', 'manager'].includes(profile?.role || 'staff');

  useEffect(() => {
    if (orgId) loadData();
    else setLoading(false);
  }, [orgId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [d, t, o] = await Promise.all([
        getDepartments(user, orgId),
        getTeams(user, orgId),
        getOrganization(user, orgId),
      ]);
      setDepartments(d || []);
      setTeams(t || []);
      setOrg(o);
    } catch (err) {
      console.error('Failed to load structure:', err);
      setFetchError('Failed to load organization structure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    const { error } = await createDepartment(user, orgId, {
      ...deptForm,
      parent_department_id: deptForm.parentDepartmentId || null,
    });
    if (!error) {
      setShowDeptModal(false);
      setDeptForm({ name: '', description: '', parentDepartmentId: '' });
      loadData();
    }
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    const { error } = await createTeam(user, orgId, {
      ...teamForm,
      department_id: teamForm.departmentId || null,
    });
    if (!error) {
      setShowTeamModal(false);
      setTeamForm({ name: '', description: '', departmentId: '' });
      loadData();
    }
  };

  const toggleDept = (id) => {
    setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getDeptTeams = (deptId) => teams.filter(t => t.department_id === deptId);

  // ── No organization ──────────────────────────────────────────
  if (!loading && !orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No Organization Found</h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-md text-center">
          You haven't created or joined an organization yet. Create one to get started with team structure and management.
        </p>
        <button
          onClick={() => window.location.href = '/create-organization'}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all"
        >
          Create Organization
        </button>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading structure...</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 max-w-md text-center">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-700 font-medium mb-1">Something went wrong</p>
          <p className="text-xs text-red-500">{fetchError}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Organization Structure</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {org?.name} — {departments.length} departments, {teams.length} teams
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={() => { setSelectedDeptId(null); setShowTeamModal(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm transition-all">
              <Plus size={16} />
              Add Team
            </button>
            <button onClick={() => setShowDeptModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all">
              <Plus size={16} />
              Add Department
            </button>
          </div>
        )}
      </div>

      {/* Organization Tree */}
      {departments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg">
          <Building2 size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">No departments yet</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500">Create your first department to organize your team structure</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Root level departments */}
          {departments.filter(d => !d.parent_department_id).map((dept) => (
            <DepartmentNode
              key={dept.id}
              department={dept}
              departments={departments}
              teams={teams}
              expanded={expandedDepts[dept.id]}
              onToggle={() => toggleDept(dept.id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/50 rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700/50">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Add Department</h2>
              <button onClick={() => setShowDeptModal(false)} className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddDept} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Department Name *</label>
                <input type="text" required value={deptForm.name} onChange={(e) => setDeptForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Engineering" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={deptForm.description} onChange={(e) => setDeptForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Department responsibilities..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Parent Department (optional)</label>
                <select value={deptForm.parentDepartmentId} onChange={(e) => setDeptForm(f => ({ ...f, parentDepartmentId: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">None (Top Level)</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDeptModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 text-sm font-medium">Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Create Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/50 rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700/50">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Add Team</h2>
              <button onClick={() => setShowTeamModal(false)} className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddTeam} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Team Name *</label>
                <input type="text" required value={teamForm.name} onChange={(e) => setTeamForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Frontend Team" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                <select value={teamForm.departmentId} onChange={(e) => setTeamForm(f => ({ ...f, departmentId: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">No Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTeamModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 text-sm font-medium">Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Department Node Component ─────────────────────────────────────
function DepartmentNode({ department, departments, teams, expanded, onToggle, isAdmin, depth = 0 }) {
  const childDepts = departments.filter(d => d.parent_department_id === department.id);
  const deptTeams = teams.filter(t => t.department_id === department.id);
  const hasChildren = childDepts.length > 0 || deptTeams.length > 0;

  return (
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
        onClick={onToggle}
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button className="p-0.5 rounded text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
            {hasChildren ? (
              expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            ) : (
              <div className="w-4" />
            )}
          </button>
          <div className="p-2 rounded-lg bg-violet-50">
            <Building2 size={16} className="text-violet-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">{department.name}</h3>
            {department.description && (
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-md">{department.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {deptTeams.length} teams
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {/* Teams */}
          {deptTeams.map((team) => (
            <div key={team.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30"
              style={{ marginLeft: `${24 + depth * 24}px` }}
            >
              <div className="p-1.5 rounded-lg bg-blue-50">
                <Target size={14} className="text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{team.name}</p>
                {team.description && <p className="text-xs text-slate-400 dark:text-slate-500">{team.description}</p>}
              </div>
            </div>
          ))}

          {/* Child departments */}
          {childDepts.map((child) => (
            <DepartmentNode
              key={child.id}
              department={child}
              departments={departments}
              teams={teams}
              expanded={false}
              onToggle={() => {}}
              isAdmin={isAdmin}
              depth={depth + 1}
            />
          ))}

          {!hasChildren && (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2" style={{ marginLeft: `${24 + depth * 24}px` }}>
              No teams or sub-departments
            </p>
          )}
        </div>
      )}
    </div>
  );
}
