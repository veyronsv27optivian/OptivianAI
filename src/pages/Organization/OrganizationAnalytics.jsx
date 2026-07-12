import { useState, useEffect } from 'react';
import {
  BarChart3, Users, Building2, TrendingUp, Activity, Heart,
  Clock, Calendar, Target, PieChart,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { getOrgAnalytics, getOrgActivity } from '../../services/organizationService';

export default function OrganizationAnalytics() {
  const { user, profile } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.organization_id || user?.user_metadata?.organization_id;

  useEffect(() => {
    if (orgId) loadData();
  }, [orgId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [a, act] = await Promise.all([
        getOrgAnalytics(user, orgId),
        getOrgActivity(user, orgId, 20),
      ]);
      setAnalytics(a);
      setActivity(act || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const healthColor = analytics?.healthScore >= 80 ? 'emerald'
    : analytics?.healthScore >= 60 ? 'amber'
    : analytics?.healthScore >= 40 ? 'orange' : 'red';

  const healthLabel = analytics?.healthScore >= 80 ? 'Excellent'
    : analytics?.healthScore >= 60 ? 'Good'
    : analytics?.healthScore >= 40 ? 'Fair' : 'Needs Attention';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Organization Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Metrics, trends, and insights for your organization</p>
      </div>

      {/* Health Score */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-${healthColor}-50`}>
              <Heart size={24} className={`text-${healthColor}-600`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Organization Health</h2>
              <p className="text-sm text-slate-500">Overall health assessment</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold text-${healthColor}-600`}>{analytics?.healthScore || 0}</div>
            <div className={`text-xs font-medium text-${healthColor}-600`}>{healthLabel}</div>
          </div>
        </div>
        {/* Health bar */}
        <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 bg-${healthColor}-500`}
            style={{ width: `${analytics?.healthScore || 0}%` }}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Users size={16} />
            <span className="text-xs">Total Staff</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{analytics?.totalStaff || 0}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <Activity size={16} />
            <span className="text-xs">Active</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{analytics?.activeStaff || 0}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <Activity size={16} />
            <span className="text-xs">Online</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{analytics?.onlineStaff || 0}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Building2 size={16} />
            <span className="text-xs">Departments</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{analytics?.departmentCount || 0}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Growth */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            Staff Growth
          </h3>
          {analytics?.staffGrowth?.length > 0 ? (
            <div className="space-y-2">
              {analytics.staffGrowth.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-16 shrink-0">{item.month}</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                      style={{ width: `${(item.count / Math.max(...analytics.staffGrowth.map(s => s.count))) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No growth data available</p>
          )}
        </div>

        {/* Department Distribution */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-violet-600" />
            Department Distribution
          </h3>
          {analytics?.deptDistribution?.length > 0 ? (
            <div className="space-y-2">
              {analytics.deptDistribution.map((item, i) => {
                const total = analytics.deptDistribution.reduce((s, d) => s + d.count, 0);
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-28 truncate shrink-0">{item.name}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-600 w-12 text-right">{item.count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No departments configured</p>
          )}
        </div>

        {/* Role Distribution */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <PieChart size={16} className="text-amber-600" />
            Role Distribution
          </h3>
          {analytics?.roleDistribution?.length > 0 ? (
            <div className="space-y-2">
              {analytics.roleDistribution.map((item, i) => {
                const total = analytics.roleDistribution.reduce((s, d) => s + d.count, 0);
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                const colors = ['bg-indigo-500', 'bg-teal-500', 'bg-pink-500', 'bg-orange-500', 'bg-green-500', 'bg-slate-500'];
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-28 truncate shrink-0 capitalize">{item.name.replace(/_/g, ' ')}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-600 w-12 text-right">{item.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No role data available</p>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-emerald-600" />
            Recent Activity
          </h3>
          {activity.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activity.slice(0, 10).map((a, i) => (
                <div key={a.id || i} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-700">
                      <span className="font-medium">{a.actor_name || 'System'}</span>
                      {' '}{a.action?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
