import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Users, Layers, Target, Globe, MapPin, Activity,
  TrendingUp, ArrowRight, Calendar, Shield, Briefcase,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function OrgOverview({
  staffCount,
  onlineStaff,
  loading,
  recentMembers = [],
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const orgName = user?.user_metadata?.organization_name || 'My Organization';

  const stats = useMemo(() => [
    { label: 'Total Staff', value: staffCount, icon: Users, color: 'blue' },
    { label: 'Online Now', value: onlineStaff, icon: Activity, color: 'emerald' },
    { label: 'Departments', value: 3, icon: Layers, color: 'violet' },
    { label: 'Teams', value: 5, icon: Target, color: 'cyan' },
  ], [staffCount, onlineStaff]);

  if (loading) {
    return (
      <Card variant="default" padding="p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="p-5">
      <CardHeader
        title="Organization"
        subtitle="Team snapshot"
        icon={Building2}
        color="primary"
        action={
          <button onClick={() => navigate('/app/org')}
            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1">
            View <ArrowRight size={12} />
          </button>
        }
      />

      {/* Organization Name */}
      <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-violet-50 border border-primary/10">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">{orgName}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Globe size={12} /> Tech</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> Remote</span>
          <span className="flex items-center gap-1"><Calendar size={12} /> Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const colorMap = {
            blue: 'bg-blue-100 text-blue-600',
            emerald: 'bg-emerald-100 text-emerald-600',
            violet: 'bg-violet-100 text-violet-600',
            cyan: 'bg-cyan-100 text-cyan-600',
          };
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-lg bg-slate-50 border border-slate-100"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1 rounded-md ${colorMap[stat.color]}`}>
                  <Icon size={12} />
                </div>
                <span className="text-[10px] font-medium text-slate-500 uppercase">{stat.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Members */}
      {recentMembers.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
            <Users size={12} /> Recent Members
          </h4>
          <div className="space-y-1.5">
            {recentMembers.slice(0, 4).map((m, i) => (
              <div key={m.id || i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {(m.email || m.full_name || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {m.full_name || m.email || 'Unknown'}
                  </p>
                  <p className="text-[10px] text-slate-400">{m.role || 'staff'}</p>
                </div>
                <Badge color={m.is_active ? 'emerald' : 'slate'} size="xs" dot>
                  {m.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
        <button onClick={() => navigate('/app/org')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium hover:bg-slate-200 transition-colors">
          <Building2 size={12} /> Org Profile
        </button>
        <button onClick={() => navigate('/app/org/analytics')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium hover:bg-slate-200 transition-colors">
          <TrendingUp size={12} /> Analytics
        </button>
        <button onClick={() => navigate('/app/org/structure')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium hover:bg-slate-200 transition-colors">
          <Layers size={12} /> Structure
        </button>
        <button onClick={() => navigate('/app/org/activity')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium hover:bg-slate-200 transition-colors">
          <Activity size={12} /> Activity
        </button>
      </div>
    </Card>
  );
}
