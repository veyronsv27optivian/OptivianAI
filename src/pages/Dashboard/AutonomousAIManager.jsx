/**
 * AutonomousAIManager — Phase D4.9 UI Dashboard
 *
 * Full-featured control panel for the Autonomous AI Manager:
 *   - Real-time system health status
 *   - Task metrics dashboard
 *   - Auto-executed actions log
 *   - Learning insights panel
 *   - Alert center with acknowledge
 *   - Manual action trigger
 *   - Config editor
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Cpu, Activity, AlertTriangle, CheckCircle, XCircle,
  Clock, BarChart3, Brain, Zap, Shield, Settings,
  Play, Square, RefreshCw, ChevronRight, FileText,
  Sliders, Target,
} from 'lucide-react';
import autonomousAIManager from '../../services/ai/autonomousAIManager';
import Card from '../../components/ui/Card';
import { useAuth } from '../../services/AuthContext';

// ─── Metric Card ──────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, subtext, color = 'text-blue-500', bg = 'bg-blue-50/50' }) {
  return (
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${bg} dark:bg-opacity-20`}>
          <Icon size={18} className={color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{value}</p>
        </div>
      </div>
      {subtext && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 ml-[44px]">{subtext}</p>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────

function StatusBadge({ status }) {
  const config = {
    healthy: { label: 'Healthy', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
    degraded: { label: 'Degraded', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
    critical: { label: 'Critical', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
    stopped: { label: 'Stopped', icon: Square, color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
  };

  const cfg = config[status] || config.stopped;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

// ─── Action Log Item ─────────────────────────────────────────────

function ActionLogItem({ outcome, index }) {
  return (
    <div
      key={`${outcome.timestamp}-${index}`}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
    >
      {outcome.success ? (
        <CheckCircle size={14} className="text-emerald-500 shrink-0" />
      ) : (
        <XCircle size={14} className="text-red-500 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
            {outcome.actionName.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] text-slate-400">{outcome.executionTime.toFixed(0)}ms</span>
        </div>
        {outcome.error && (
          <p className="text-[10px] text-red-400 mt-0.5 truncate">{outcome.error}</p>
        )}
      </div>
      <span className="text-[10px] text-slate-400 shrink-0">
        {new Date(outcome.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
}

// ─── Alert Item ───────────────────────────────────────────────────

function AlertItem({ alert, onAcknowledge }) {
  const severityColors = {
    low: 'border-l-blue-400 bg-blue-50/50 dark:bg-blue-900/10',
    medium: 'border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10',
    high: 'border-l-red-400 bg-red-50/50 dark:bg-red-900/10',
    critical: 'border-l-red-600 bg-red-50 dark:bg-red-900/20',
  };

  return (
    <div className={`px-3 py-2.5 border-l-4 rounded-r-lg ${severityColors[alert.severity] || severityColors.medium} ${alert.acknowledged ? 'opacity-50' : ''} transition-opacity`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium uppercase ${
              alert.severity === 'critical' ? 'text-red-600' :
              alert.severity === 'high' ? 'text-red-500' :
              alert.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'
            }`}>{alert.severity}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{alert.message}</p>
          {alert.suggestedAction && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">
              Suggestion: {alert.suggestedAction}
            </p>
          )}
        </div>
        {!alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="shrink-0 p-1 rounded hover:bg-white dark:hover:bg-slate-700/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Acknowledge"
          >
            <CheckCircle size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────

function InsightCard({ insight }) {
  const rateColor = insight.successRate > 0.8 ? 'text-emerald-500' :
    insight.successRate > 0.5 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/30">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
          {insight.actionName.replace(/_/g, ' ')}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">{insight.count} executions</p>
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className={`text-sm font-bold ${rateColor}`}>
          {(insight.successRate * 100).toFixed(0)}%
        </p>
        <p className="text-[9px] text-slate-400">{insight.avgTime.toFixed(0)}ms avg</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

const D4_9_VER = 'D4.9';

export default function AutonomousAIManagerDashboard({ onClose }) {
  const { user } = useAuth();
  const [state, setState] = useState(null);
  const [learningLog, setLearningLog] = useState([]);
  const [insights, setInsights] = useState([]);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfig, setShowConfig] = useState(false);
  const [showManualAction, setShowManualAction] = useState(false);
  const [manualActionName, setManualActionName] = useState('');
  const [manualActionParams, setManualActionParams] = useState('');
  const [manualActionResult, setManualActionResult] = useState(null);
  const [reportContent, setReportContent] = useState(null);
  const intervalRef = useRef(null);

  // Refresh state from the singleton
  const refreshState = useCallback(() => {
    const s = autonomousAIManager.getState();
    setState(s);
    setRunning(autonomousAIManager.isRunning());
    setLearningLog(autonomousAIManager.getLearningLog(20));
    setInsights(autonomousAIManager.getLearnedInsights());
  }, []);

  // Subscribe to events
  useEffect(() => {
    const unsub = autonomousAIManager.onEvent((event) => {
      if (event.type === 'monitorCycle' || event.type === 'healthCheck' ||
          event.type === 'actionExecuted' || event.type === 'actionFailed') {
        refreshState();
      }
    });
    return unsub;
  }, [refreshState]);

  // Poll state periodically
  useEffect(() => {
    refreshState();
    intervalRef.current = setInterval(refreshState, 5000);
    return () => clearInterval(intervalRef.current);
  }, [refreshState]);

  const handleStart = () => {
    autonomousAIManager.start();
    setRunning(true);
  };

  const handleStop = () => {
    autonomousAIManager.stop();
    setRunning(false);
  };

  const handleRestart = () => {
    autonomousAIManager.restart();
    setRunning(true);
  };

  const handleAcknowledge = (alertId) => {
    autonomousAIManager.acknowledgeAlert(alertId);
    refreshState();
  };

  const handleGenerateReport = async () => {
    const report = await autonomousAIManager.generateReport();
    setReportContent(report);
  };

  const handleManualExecute = async () => {
    if (!manualActionName.trim()) return;
    let params = {};
    try {
      params = manualActionParams.trim() ? JSON.parse(manualActionParams) : {};
    } catch {
      setManualActionResult({ success: false, error: 'Invalid JSON in params' });
      return;
    }
    const result = await autonomousAIManager.execute(manualActionName.trim(), params);
    setManualActionResult(result);
    refreshState();
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (!state) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading AI Manager...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'actions', label: 'Action Log', icon: Zap },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, count: state.alerts.filter(a => !a.acknowledged).length },
    { id: 'learning', label: 'Learning', icon: Brain },
    { id: 'report', label: 'Report', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
              <Cpu size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Autonomous AI Manager</h2>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                v{D4_9_VER}
                <StatusBadge status={running ? state.status : 'stopped'} />
                <span className="text-slate-300">·</span>
                <span>Uptime {formatDuration(state.uptime)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {running ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-xs font-medium"
            >
              <Square size={14} />
              Stop
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all text-xs font-medium"
            >
              <Play size={14} />
              Start
            </button>
          )}
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-medium"
          >
            <RefreshCw size={14} />
            Restart
          </button>
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-xs font-medium"
          >
            <FileText size={14} />
            Generate Report
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs font-medium ${
              showConfig
                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Sliders size={14} />
            Config
          </button>
          <button
            onClick={() => setShowManualAction(!showManualAction)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs font-medium ${
              showManualAction
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Zap size={14} />
            Manual Action
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ChevronRight size={16} className="rotate-180" />
            </button>
          )}
        </div>
      </div>

      {/* Config Panel (collapsible) */}
      {showConfig && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 animate-fade-in-up">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Manager Configuration</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {Object.entries(autonomousAIManager.getConfig()).map(([key, value]) => (
              <div key={key} className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                </p>
                <p className="font-mono text-slate-800 dark:text-slate-200">
                  {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Action Panel */}
      {showManualAction && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 animate-fade-in-up">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Execute Action Manually</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={manualActionName}
              onChange={(e) => setManualActionName(e.target.value)}
              placeholder="Action name (e.g., cleanup_data)"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={manualActionParams}
              onChange={(e) => setManualActionParams(e.target.value)}
              placeholder='JSON params (e.g., {"olderThanDays": 30})'
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleManualExecute}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Execute
            </button>
          </div>
          {manualActionResult && (
            <div className={`mt-3 p-3 rounded-lg text-xs font-mono ${
              manualActionResult.success
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            }`}>
              <pre className="max-h-32 overflow-auto">{JSON.stringify(manualActionResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700/50 pb-1">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800/90 border border-b-0 border-slate-200 dark:border-slate-700/50 -mb-[1px]'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <TabIcon size={14} />
              {tab.label}
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[9px] font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────── */}

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Quick metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard icon={CheckCircle} label="Success Rate" value={`${(state.metrics.actionSuccessRate * 100).toFixed(0)}%`}
              color="text-emerald-500" bg="bg-emerald-50/50" />
            <MetricCard icon={Zap} label="Auto Actions" value={state.metrics.autoActionsExecuted}
              color="text-violet-500" bg="bg-violet-50/50" />
            <MetricCard icon={AlertTriangle} label="Overdue Tasks" value={state.metrics.overdueTasks}
              color={state.metrics.overdueTasks > 10 ? 'text-red-500' : 'text-amber-500'}
              bg={state.metrics.overdueTasks > 10 ? 'bg-red-50/50' : 'bg-amber-50/50'} />
            <MetricCard icon={Target} label="Total Tasks" value={state.metrics.totalTasks}
              color="text-blue-500" bg="bg-blue-50/50" />
            <MetricCard icon={Activity} label="Completed Today" value={state.metrics.completedToday}
              color="text-teal-500" bg="bg-teal-50/50" />
            <MetricCard icon={Shield} label="Healing Rate" value={`${state.metrics.selfHealingAttempts > 0 ? (state.metrics.selfHealingSuccesses / state.metrics.selfHealingAttempts * 100).toFixed(0) : '—'}%`}
              color="text-purple-500" bg="bg-purple-50/50"
              subtext={`${state.metrics.selfHealingSuccesses}/${state.metrics.selfHealingAttempts} attempts`} />
          </div>

          {/* System summary */}
          <Card variant="flat">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Activity size={14} />
                System Summary
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-400">Status</span>
                    <StatusBadge status={running ? state.status : 'stopped'} />
                  </div>
                  <div className="flex justify-between px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-400">Uptime</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatDuration(state.uptime)}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-400">Last Health Check</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {state.lastHealthCheck ? new Date(state.lastHealthCheck).toLocaleTimeString() : '—'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-400">Stale Tasks</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{state.metrics.staleTasks}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-400">Pending Approvals</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{state.metrics.pendingApprovals}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-400">Anomalies Detected</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{state.metrics.anomaliesDetected}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden animate-fade-in-up">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Action Log</h4>
            <span className="text-[10px] text-slate-400">{learningLog.length} entries</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/30 max-h-80 overflow-y-auto">
            {learningLog.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                <Zap size={24} className="mx-auto mb-2 text-slate-300" />
                No actions have been logged yet.
              </div>
            ) : (
              learningLog.map((outcome, i) => (
                <ActionLogItem key={i} outcome={outcome} index={i} />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-2 animate-fade-in-up">
          {state.alerts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-xl p-8 text-center text-sm text-slate-400">
              <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
              No active alerts. System is running smoothly.
            </div>
          ) : (
            state.alerts.slice().reverse().map((alert) => (
              <AlertItem key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
            ))
          )}
        </div>
      )}

      {activeTab === 'learning' && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden animate-fade-in-up">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700/50">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Learned Insights</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Action performance analysis based on {autonomousAIManager.getKnowledgeBase().totalDecisions} past decisions
            </p>
          </div>
          <div className="p-4 space-y-2">
            {insights.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No learning data yet. Actions need to be executed first.</p>
            ) : (
              insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="animate-fade-in-up">
          {!reportContent ? (
            <Card variant="flat">
              <div className="p-6 text-center">
                <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Generate an autonomous status report to see AI Manager's analysis of system health, task metrics, and recommendations.
                </p>
                <button
                  onClick={handleGenerateReport}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Generate Report Now
                </button>
              </div>
            </Card>
          ) : (
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{reportContent.title}</h4>
                  <p className="text-[10px] text-slate-400">Generated {new Date(reportContent.generatedAt).toLocaleString()}</p>
                </div>
                <StatusBadge status={reportContent.status} />
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{reportContent.summary}</p>
                <div className="space-y-3">
                  {reportContent.sections.map((section, i) => (
                    <div key={i} className="px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{section.title}</h5>
                      <pre className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-pre-wrap font-sans">
                        {section.content}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
