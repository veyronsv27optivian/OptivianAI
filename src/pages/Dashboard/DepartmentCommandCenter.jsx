import { useState } from 'react';
import {
  Users, TrendingUp, Target, Clock, AlertCircle,
  BarChart3, Activity, CheckCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Card, { CardHeader } from '../../components/ui/Card';

const DEPARTMENTS = [
  { id: 'engineering', label: 'Engineering', color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
  { id: 'marketing', label: 'Marketing', color: 'text-sky-600', bg: 'bg-sky-50', icon: TrendingUp },
  { id: 'sales', label: 'Sales', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Target },
  { id: 'hr', label: 'HR', color: 'text-pink-600', bg: 'bg-pink-50', icon: Users },
  { id: 'finance', label: 'Finance', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: BarChart3 },
  { id: 'operations', label: 'Operations', color: 'text-teal-600', bg: 'bg-teal-50', icon: Activity },
];

const DASHBOARD_TEMPLATES = {
  engineering: {
    metrics: [
      { label: 'Active Sprints', value: '3', trend: '+1', status: 'good' },
      { label: 'Pull Requests', value: '24', trend: '+5', status: 'good' },
      { label: 'Bug Reports', value: '8', trend: '-3', status: 'warning' },
      { label: 'Deployment Freq.', value: '12/day', trend: '+2', status: 'good' },
    ],
    tasks: [
      { title: 'API Rate Limiting', assignee: 'Alice', status: 'in_progress', priority: 'high' },
      { title: 'Dashboard Redesign', assignee: 'Bob', status: 'review', priority: 'medium' },
    ],
  },
  marketing: {
    metrics: [
      { label: 'Campaigns Active', value: '6', trend: '+2', status: 'good' },
      { label: 'Lead Gen', value: '142', trend: '+18%', status: 'good' },
      { label: 'Conv. Rate', value: '3.2%', trend: '+0.4%', status: 'good' },
      { label: 'Social Reach', value: '45K', trend: '+12%', status: 'good' },
    ],
    tasks: [
      { title: 'Q4 Campaign Plan', assignee: 'Carol', status: 'in_progress', priority: 'high' },
      { title: 'Brand Audit', assignee: 'Dave', status: 'pending', priority: 'medium' },
    ],
  },
  sales: {
    metrics: [
      { label: 'Pipeline Value', value: '$1.2M', trend: '+8%', status: 'good' },
      { label: 'Deals Closed', value: '18', trend: '+3', status: 'good' },
      { label: 'Win Rate', value: '42%', trend: '+5%', status: 'good' },
      { label: 'Avg Deal Size', value: '$24K', trend: '+$2K', status: 'good' },
    ],
    tasks: [
      { title: 'Enterprise Outreach', assignee: 'Eve', status: 'in_progress', priority: 'high' },
      { title: 'Q4 Forecast', assignee: 'Frank', status: 'pending', priority: 'medium' },
    ],
  },
};

function DeptHeader({ dept, selected, onClick }) {
  const Icon = dept.icon;
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
        selected ? `${dept.bg} ${dept.color} border-current` : 'border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon size={16} /> {dept.label}
    </button>
  );
}

export default function DepartmentCommandCenter({ taskStats }) {
  const [selectedDept, setSelectedDept] = useState('engineering');
  const template = DASHBOARD_TEMPLATES[selectedDept] || DASHBOARD_TEMPLATES.engineering;

  return (
    <div className="space-y-5">
      {/* Department Selector */}
      <div className="flex flex-wrap gap-2">
        {DEPARTMENTS.map(d => (
          <DeptHeader key={d.id} dept={d} selected={selectedDept === d.id} onClick={() => setSelectedDept(d.id)} />
        ))}
      </div>

      {/* Department Dashboard */}
      <motion.div key={selectedDept} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="default" padding="p-5">
          <CardHeader
            title={DEPARTMENTS.find(d => d.id === selectedDept)?.label + ' Dashboard'}
            subtitle="Real-time department metrics and tasks"
            icon={DEPARTMENTS.find(d => d.id === selectedDept)?.icon || Activity}
            color="primary"
          />

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {template.metrics.map(m => (
              <div key={m.label} className={`p-3 rounded-lg border ${
                m.status === 'good' ? 'bg-emerald-50 border-emerald-200' :
                m.status === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                <p className={`text-lg font-bold ${
                  m.status === 'good' ? 'text-emerald-700' :
                  m.status === 'warning' ? 'text-amber-700' : 'text-blue-700'
                }`}>{m.value}</p>
                <p className="text-[10px] text-slate-400">{m.trend}</p>
              </div>
            ))}
          </div>

          {/* Department Tasks */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Active Tasks</h4>
            <div className="space-y-2">
              {template.tasks.map(t => (
                <div key={t.title} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      t.status === 'in_progress' ? 'bg-blue-500' : t.status === 'review' ? 'bg-violet-500' : 'bg-amber-500'
                    }`} />
                    <span className="text-sm text-slate-700">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{t.assignee}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      t.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>{t.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all">
          <BarChart3 size={16} /> Generate Report
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all">
          <CheckCircle size={16} /> View All Tasks
        </button>
      </div>
    </div>
  );
}
