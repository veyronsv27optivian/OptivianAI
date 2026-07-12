import { useState, useEffect } from 'react';
import {
  Clock, Search, Filter, RefreshCw, Activity, AlertCircle,
  AlertTriangle, Info, ShieldAlert, User, Building2, Target,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { getOrgActivity } from '../../services/organizationService';

const SEVERITY_CONFIG = {
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  critical: { icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
};

const ACTION_ICONS = {
  organization_created: Building2,
  organization_updated: Building2,
  organization_deleted: Building2,
  branch_created: Building2,
  branch_updated: Building2,
  branch_deleted: Building2,
  department_created: Target,
  department_updated: Target,
  team_created: Target,
  member_joined: User,
  member_left: User,
  member_updated: User,
  member_suspended: AlertTriangle,
  member_unsuspended: User,
};

export default function OrganizationActivity() {
  const { user, profile } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const orgId = profile?.organization_id || user?.user_metadata?.organization_id;

  useEffect(() => { if (orgId) fetchActivity(); }, [orgId]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const data = await getOrgActivity(user, orgId, 200);
      setActivities(data || []);
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activities
    .filter(a => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.action?.toLowerCase().includes(q) ||
          a.actor_name?.toLowerCase().includes(q) ||
          a.resource_type?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity Timeline</h1>
        <p className="text-sm text-slate-500 mt-1">Track all changes and events across your organization</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Severity</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        <button onClick={fetchActivity} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Clock size={40} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No activity found</h3>
          <p className="text-sm text-slate-400">
            {searchQuery || severityFilter !== 'all' ? 'Try different filters' : 'Activity will appear here as changes are made'}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />

          <div className="space-y-3">
            {filtered.map((a, i) => {
              const sevConfig = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.info;
              const SevIcon = sevConfig.icon;
              const ActionIcon = ACTION_ICONS[a.action] || Activity;

              return (
                <div key={a.id || i} className="relative flex items-start gap-4 pl-14">
                  {/* Timeline dot */}
                  <div className={`absolute left-4 w-5 h-5 rounded-full ${sevConfig.bg} border-2 border-white flex items-center justify-center`}>
                    <div className={`w-2 h-2 rounded-full ${sevConfig.color.replace('text-', 'bg-')}`} />
                  </div>

                  <div className={`flex-1 p-4 rounded-lg border ${sevConfig.border} ${sevConfig.bg}/30`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-1.5 rounded-lg ${sevConfig.bg} shrink-0`}>
                          <SevIcon size={14} className={sevConfig.color} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-800">
                            <span className="font-medium">{a.actor_name || 'System'}</span>
                            {' '}
                            <span className="text-slate-500">
                              {a.action?.replace(/_/g, ' ')}
                              {a.resource_type ? ` ${a.resource_type}` : ''}
                            </span>
                          </p>
                          {a.details?.changes && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              Changes: {Array.isArray(a.details.changes) ? a.details.changes.join(', ') : JSON.stringify(a.details.changes)}
                            </p>
                          )}
                          {a.details?.name && (
                            <p className="text-xs text-slate-400 mt-0.5">Name: {a.details.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sevConfig.bg} ${sevConfig.color}`}>
                            {a.severity || 'info'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
