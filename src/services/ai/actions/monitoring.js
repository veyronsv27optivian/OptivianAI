/**
 * ─── Monitoring Engine — Phase C4 ─────────────────────────────────
 *
 * Proactive monitoring system that runs scheduled health checks on:
 *   - Task completion rates and deadlines
 *   - Bottlenecks and overdue items
 *   - User activity and engagement
 *   - AI usage and costs
 *
 * Generates proactive recommendations and auto-escalates critical issues.
 *
 * Usage:
 *   import { monitoringEngine } from './monitoring';
 *   monitoringEngine.start();   // Starts the monitoring loop
 *   monitoringEngine.stop();    // Stops it
 *   monitoringEngine.runOnce(); // Run a single check
 */

import { createNotification } from '../../notificationService';

// ─── Configuration ────────────────────────────────────────────────

const DEFAULT_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const MIN_INTERVAL_MS = 60 * 1000;           // 1 minute minimum

// ─── State ────────────────────────────────────────────────────────

let _intervalId = null;
let _isRunning = false;
let _lastRunAt = null;
let _checkResults = [];
let _onRecommendationCallbacks = [];

// ─── Initialize services lazily ──────────────────────────────────

let _taskService = null;
let _notificationService = null;
let _profileService = null;

async function _getServices() {
  if (!_taskService) {
    const taskModule = await import('../../taskService');
    _taskService = taskModule;
  }
  if (!_notificationService) {
    const notifModule = await import('../../notificationService');
    _notificationService = notifModule;
  }
  return { taskService: _taskService, notificationService: _notificationService };
}

// ─── Health Checks ───────────────────────────────────────────────

/**
 * Check for overdue tasks and approaching deadlines.
 */
async function _checkOverdueTasks(user, profile) {
  try {
    const { taskService } = await _getServices();
    const tasks = await taskService.getTasks(user);

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const overdue = tasks.filter(t =>
      t.due_date && new Date(t.due_date) < now &&
      t.status !== 'done' && t.status !== 'cancelled'
    );

    const dueSoon = tasks.filter(t =>
      t.due_date && new Date(t.due_date) > now &&
      new Date(t.due_date) < in24h &&
      t.status !== 'done' && t.status !== 'cancelled'
    );

    const stale = tasks.filter(t =>
      t.status === 'in_progress' && t.updated_at &&
      new Date(t.updated_at) < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    );

    return {
      check: 'overdue_tasks',
      timestamp: now.toISOString(),
      data: { overdue: overdue.length, dueSoon: dueSoon.length, stale: stale.length },
      details: {
        overdue: overdue.map(t => ({ id: t.id, title: t.title, due: t.due_date })),
        dueSoon: dueSoon.map(t => ({ id: t.id, title: t.title, due: t.due_date })),
        stale: stale.map(t => ({ id: t.id, title: t.title, updated: t.updated_at })),
      },
      score: Math.max(0, 100 - (overdue.length * 15) - (dueSoon.length * 5) - (stale.length * 10)),
    };
  } catch (err) {
    return { check: 'overdue_tasks', error: err.message, score: 0 };
  }
}

/**
 * Check user activity and engagement.
 */
async function _checkUserActivity(user) {
  try {
    const isDev = !import.meta.env.VITE_SUPABASE_URL;
    let profile;

    if (isDev) {
      const profiles = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
      profile = profiles.find(p => p.user_id === user.id);
    } else {
      const { supabase } = await import('../../supabase');
      const { data } = await supabase
        .from('profiles')
        .select('last_login, created_at')
        .eq('user_id', user.id)
        .single();
      profile = data;
    }

    const lastLogin = profile?.last_login ? new Date(profile.last_login) : null;
    const daysSinceLogin = lastLogin ? Math.floor((Date.now() - lastLogin.getTime()) / 86400000) : null;

    return {
      check: 'user_activity',
      timestamp: new Date().toISOString(),
      data: {
        daysSinceLogin,
        lastLogin: profile?.last_login,
      },
      score: daysSinceLogin === null ? 50 : Math.max(0, 100 - daysSinceLogin * 10),
      recommendations: daysSinceLogin > 7
        ? [{ type: 'engagement', message: `You haven't logged in for ${daysSinceLogin} days.` }]
        : [],
    };
  } catch (err) {
    return { check: 'user_activity', error: err.message, score: 50 };
  }
}

/**
 * Run all health checks for a given user.
 */
async function _runChecks(user) {
  const results = await Promise.all([
    _checkOverdueTasks(user),
    _checkUserActivity(user),
  ]);

  return results;
}

// ─── Recommendation Generation ───────────────────────────────────

function _generateRecommendations(results) {
  const recommendations = [];

  for (const result of results) {
    if (result.error) continue;

    // Overdue tasks
    if (result.check === 'overdue_tasks' && result.data?.overdue > 0) {
      recommendations.push({
        type: 'overdue',
        severity: result.data.overdue > 5 ? 'critical' : result.data.overdue > 2 ? 'high' : 'medium',
        message: `${result.data.overdue} task${result.data.overdue > 1 ? 's are' : ' is'} overdue.`,
        details: result.details?.overdue || [],
        action: 'Review overdue tasks',
        actionType: 'navigate',
        actionTarget: '/app/tasks',
      });
    }

    if (result.check === 'overdue_tasks' && result.data?.dueSoon > 0) {
      recommendations.push({
        type: 'due_soon',
        severity: result.data.dueSoon > 3 ? 'high' : 'low',
        message: `${result.data.dueSoon} task${result.data.dueSoon > 1 ? 's are' : ' is'} due within 24 hours.`,
        details: result.details?.dueSoon || [],
        action: 'View upcoming tasks',
        actionType: 'navigate',
        actionTarget: '/app/tasks',
      });
    }

    if (result.check === 'overdue_tasks' && result.data?.stale > 0) {
      recommendations.push({
        type: 'stale_tasks',
        severity: 'low',
        message: `${result.data.stale} task${result.data.stale > 1 ? 's have' : ' has'} been in progress for over a week without updates.`,
        action: 'Review stale tasks',
        actionType: 'navigate',
        actionTarget: '/app/tasks',
      });
    }

    if (result.check === 'user_activity' && result.recommendations?.length > 0) {
      recommendations.push(...result.recommendations);
    }
  }

  return recommendations;
}

// ─── Auto-escalation ──────────────────────────────────────────────

async function _autoEscalate(results, user) {
  const critical = [];

  for (const result of results) {
    if (result.check === 'overdue_tasks' && result.data?.overdue > 10) {
      critical.push({
        type: 'massive_overdue',
        message: `Critical: ${result.data.overdue} tasks are overdue across the organization.`,
        severity: 'critical',
      });
    }
  }

  for (const item of critical) {
    try {
      await createNotification(
        user?.id,
        'system_alert',
        item.message,
        'alert',
        null
      );
    } catch {
      // Silent fail on notification errors
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Run a single monitoring cycle.
 * Returns check results and recommendations.
 */
export async function runOnce(user) {
  if (!user) return { results: [], recommendations: [], healthScore: 100 };

  const results = await _runChecks(user);
  const recommendations = _generateRecommendations(results);
  const healthScore = Math.round(
    results.reduce((sum, r) => sum + (r.score ?? 100), 0) / results.length
  );

  _lastRunAt = new Date().toISOString();
  _checkResults = results;

  // Auto-escalate critical issues
  await _autoEscalate(results, user);

  // Notify listeners
  for (const cb of _onRecommendationCallbacks) {
    try { cb(recommendations, healthScore, results); } catch {}
  }

  return { results, recommendations, healthScore };
}

/**
 * Start the automatic monitoring loop.
 * Runs checks at the specified interval and triggers recommendations.
 */
export function start(user, intervalMs = DEFAULT_INTERVAL_MS) {
  if (_isRunning) return;
  _isRunning = true;

  const interval = Math.max(intervalMs, MIN_INTERVAL_MS);

  // Run immediately on start
  runOnce(user);

  _intervalId = setInterval(() => {
    runOnce(user);
  }, interval);
}

/**
 * Stop the monitoring loop.
 */
export function stop() {
  _isRunning = false;
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

/**
 * Check if the monitoring engine is currently running.
 */
export function isRunning() {
  return _isRunning;
}

/**
 * Get the timestamp of the last check run.
 */
export function getLastRunAt() {
  return _lastRunAt;
}

/**
 * Get the results from the last check run.
 */
export function getLastResults() {
  return _checkResults;
}

/**
 * Register a callback for new recommendations.
 * Callback receives (recommendations, healthScore, rawResults).
 */
export function onRecommendation(callback) {
  _onRecommendationCallbacks.push(callback);
  return () => {
    _onRecommendationCallbacks = _onRecommendationCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * Get a weighted health score (0-100) based on all checks.
 * Higher is healthier.
 */
export function getHealthScore() {
  if (_checkResults.length === 0) return 100;
  return Math.round(
    _checkResults.reduce((sum, r) => sum + (r.score ?? 100), 0) / _checkResults.length
  );
}

export const monitoringEngine = {
  runOnce,
  start,
  stop,
  isRunning,
  getLastRunAt,
  getLastResults,
  onRecommendation,
  getHealthScore,
};
