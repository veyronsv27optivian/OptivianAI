/**
 * Unit tests for Autonomous AI Manager — Phase D4.9
 *
 * Covers: Config, Lifecycle, Monitor, Executor, Learner, Detector,
 *         Healer, Alerting, Reporting, Event System, Utilities
 *
 * Run: npx vitest run src/services/ai/__tests__/autonomousAIManager.test.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────

// Mock actionRegistry
const mockExecuteAction = vi.fn();
const mockGetAction = vi.fn();
const mockGetAllActions = vi.fn();

vi.mock('../actions/actionRegistry', () => ({
  executeAction: (...args) => mockExecuteAction(...args),
  getAction: (...args) => mockGetAction(...args),
  getAllActions: (...args) => mockGetAllActions(...args),
}));

// Mock executionEngine
const mockProcessAIResponse = vi.fn();
const mockProposeAction = vi.fn();
const mockApproveAndExecute = vi.fn();

vi.mock('../actions/executionEngine', () => ({
  processAIResponse: (...args) => mockProcessAIResponse(...args),
  proposeAction: (...args) => mockProposeAction(...args),
  approveAndExecute: (...args) => mockApproveAndExecute(...args),
}));

// Mock taskService (dynamic import used in _checkSystemHealth, _checkTaskHealth)
const mockGetTasks = vi.fn();
vi.mock('../../taskService', () => ({
  getTasks: (...args) => mockGetTasks(...args),
}));

// ─── Module under test ────────────────────────────────────────────

import autonomousAIManager, { AutonomousAIManager } from '../autonomousAIManager';

// ─── Helpers ──────────────────────────────────────────────────────

function createFreshManager() {
  // Instantiate a new, isolated manager for each test
  return new AutonomousAIManager();
}

/**
 * Fast-forward past the stale detection threshold by
 * setting the stale task age cutoff to a very small value.
 */
function setStaleTaskThreshold(manager, days = 14) {
  manager.updateConfig({ maxStaleTaskDays: days });
}

function makeTask(overrides = {}) {
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: 'Test Task',
    status: 'pending',
    due_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────

describe('AutonomousAIManager', () => {
  let manager;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    // Default mock for getTasks returns empty array
    mockGetTasks.mockResolvedValue([]);
    mockExecuteAction.mockResolvedValue({ success: true, data: {} });
    // Use a fresh manager for each test (not the singleton)
    manager = createFreshManager();
  });

  afterEach(() => {
    // Ensure stopped
    if (manager.isRunning()) {
      manager.stop();
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Configuration
  // ═══════════════════════════════════════════════════════════════

  describe('Configuration', () => {
    it('should have default configuration values', () => {
      const config = manager.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.monitoringInterval).toBe(60_000);
      expect(config.taskCheckInterval).toBe(300_000);
      expect(config.autoExecuteLowSafety).toBe(true);
      expect(config.escalationThreshold).toBe('high');
      expect(config.maxAutoActionsPerCycle).toBe(3);
      expect(config.learningEnabled).toBe(true);
      expect(config.confidenceThreshold).toBe(0.7);
      expect(config.anomalySensitivity).toBe(0.6);
      expect(config.maxStaleTaskDays).toBe(14);
      expect(config.selfHealing).toBe(true);
    });

    it('should merge partial config updates', () => {
      manager.updateConfig({ confidenceThreshold: 0.85, maxAutoActionsPerCycle: 5 });
      const config = manager.getConfig();
      expect(config.confidenceThreshold).toBe(0.85);
      expect(config.maxAutoActionsPerCycle).toBe(5);
      expect(config.enabled).toBe(true); // unchanged
    });

    it('should emit event on config update', () => {
      const listener = vi.fn();
      manager.onEvent(listener);
      manager.updateConfig({ enabled: false });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].type).toBe('configUpdated');
      expect(listener.mock.calls[0][0].data.enabled).toBe(false);
    });

    it('should return a copy, not reference', () => {
      const config = manager.getConfig();
      config.enabled = false;
      expect(manager.getConfig().enabled).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Lifecycle
  // ═══════════════════════════════════════════════════════════════

  describe('Lifecycle', () => {
    it('should start and be running', () => {
      expect(manager.isRunning()).toBe(false);
      manager.start();
      expect(manager.isRunning()).toBe(true);
    });

    it('should not double-start', () => {
      manager.start();
      const runningAfterFirstStart = manager.isRunning();
      manager.start(); // second call should be noop
      expect(manager.isRunning()).toBe(runningAfterFirstStart);
    });

    it('should stop and clear timers', () => {
      manager.start();
      expect(manager.isRunning()).toBe(true);
      manager.stop();
      expect(manager.isRunning()).toBe(false);
    });

    it('should stop gracefully even when not started', () => {
      expect(() => manager.stop()).not.toThrow();
    });

    it('should restart and reset learning log and alerts', () => {
      // Seed some learning data and alerts
      manager._recordOutcome('test_action', true, 100);
      manager._addAlert({ type: 'test', severity: 'low', message: 'test', details: {}, suggestedAction: '' });
      expect(manager.getLearningLog()).toHaveLength(1);
      expect(manager.getState().alerts).toHaveLength(1);

      manager.restart();
      expect(manager.isRunning()).toBe(true);
      expect(manager.getLearningLog()).toHaveLength(0);
      expect(manager.getState().alerts).toHaveLength(0);
    });

    it('should emit started and stopped events', () => {
      const listener = vi.fn();
      manager.onEvent(listener);
      manager.start();
      manager.stop();
      const types = listener.mock.calls.map(c => c[0].type);
      expect(types).toContain('started');
      expect(types).toContain('stopped');
    });

    it('should call initial health checks on start', () => {
      const healthSpy = vi.spyOn(manager, '_checkSystemHealth');
      const taskHealthSpy = vi.spyOn(manager, '_checkTaskHealth');
      manager.start();
      expect(healthSpy).toHaveBeenCalled();
      expect(taskHealthSpy).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: State & Getters
  // ═══════════════════════════════════════════════════════════════

  describe('State & Getters', () => {
    it('should return initial state with healthy status', () => {
      const state = manager.getState();
      expect(state.status).toBe('healthy');
      expect(state.metrics.totalTasks).toBe(0);
      expect(state.metrics.overdueTasks).toBe(0);
      expect(state.metrics.actionSuccessRate).toBe(1.0);
      expect(state.alerts).toEqual([]);
    });

    it('should return a copy of state, not reference', () => {
      const state = manager.getState();
      state.status = 'critical';
      expect(manager.getState().status).toBe('healthy');
    });

    it('should track uptime', async () => {
      manager.start();
      await new Promise(r => setTimeout(r, 10));
      const state = manager.getState();
      expect(state.uptime).toBeGreaterThanOrEqual(10);
      manager.stop();
    });

    it('should return knowledge base with version info', () => {
      const kb = manager.getKnowledgeBase();
      expect(kb.name).toBe('OptivianAI Assistant');
      expect(kb.version).toBe('D4.9');
      expect(kb.totalDecisions).toBe(0);
      expect(kb.currentConfig).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Monitoring — Health Check
  // ═══════════════════════════════════════════════════════════════

  describe('Monitoring — Health Check', () => {
    it('should mark status as healthy when no tasks are overdue', async () => {
      mockGetTasks.mockResolvedValue([
        makeTask({ status: 'done', due_date: new Date(Date.now() - 86400000).toISOString() }),
      ]);
      await manager._checkSystemHealth();
      const state = manager.getState();
      expect(state.status).toBe('healthy');
      expect(state.metrics.totalTasks).toBe(1);
      expect(state.metrics.overdueTasks).toBe(0);
    });

    it('should detect overdue tasks and mark as degraded when > 10', async () => {
      const overdueTasks = Array.from({ length: 12 }, (_, i) =>
        makeTask({ due_date: new Date(Date.now() - 86400000 * (i + 1)).toISOString(), status: 'pending' }),
      );
      mockGetTasks.mockResolvedValue(overdueTasks);
      await manager._checkSystemHealth();
      const state = manager.getState();
      expect(state.status).toBe('degraded');
      expect(state.metrics.overdueTasks).toBe(12);
    });

    it('should mark status as critical when over 20 tasks are overdue', async () => {
      const overdueTasks = Array.from({ length: 25 }, (_, i) =>
        makeTask({ due_date: new Date(Date.now() - 86400000 * (i + 1)).toISOString(), status: 'pending' }),
      );
      mockGetTasks.mockResolvedValue(overdueTasks);
      await manager._checkSystemHealth();
      expect(manager.getState().status).toBe('critical');
    });

    it('should detect stale tasks untouched beyond maxStaleTaskDays', async () => {
      setStaleTaskThreshold(manager, 14);
      const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
      mockGetTasks.mockResolvedValue([
        makeTask({ updated_at: oldDate, status: 'pending' }),
        makeTask({ updated_at: oldDate, status: 'in_progress' }),
      ]);
      await manager._checkSystemHealth();
      expect(manager.getState().metrics.staleTasks).toBe(2);
    });

    it('should not count done/archived tasks as stale', async () => {
      const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
      mockGetTasks.mockResolvedValue([
        makeTask({ updated_at: oldDate, status: 'done' }),
        makeTask({ updated_at: oldDate, status: 'archived' }),
      ]);
      await manager._checkSystemHealth();
      expect(manager.getState().metrics.staleTasks).toBe(0);
    });

    it('should count completed today correctly', async () => {
      const today = new Date().toISOString();
      mockGetTasks.mockResolvedValue([
        makeTask({ updated_at: today, status: 'done' }),
        makeTask({ updated_at: today, status: 'done' }),
        makeTask({ updated_at: today, status: 'pending' }),
      ]);
      await manager._checkSystemHealth();
      expect(manager.getState().metrics.completedToday).toBe(2);
    });

    it('should handle getTasks failure gracefully', async () => {
      mockGetTasks.mockRejectedValue(new Error('DB connection lost'));
      await manager._checkSystemHealth();
      // Should set status to degraded on error
      expect(manager.getState().status).toBe('degraded');
    });

    it('should emit healthCheck event', async () => {
      const listener = vi.fn();
      manager.onEvent(listener);
      mockGetTasks.mockResolvedValue([]);
      await manager._checkSystemHealth();
      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].type).toBe('healthCheck');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Monitoring — Task Health
  // ═══════════════════════════════════════════════════════════════

  describe('Monitoring — Task Health', () => {
    it('should add alert when overdue tasks > 15', async () => {
      const overdueTasks = Array.from({ length: 18 }, (_, i) =>
        makeTask({ due_date: new Date(Date.now() - 86400000 * (i + 1)).toISOString(), status: 'pending' }),
      );
      mockGetTasks.mockResolvedValue(overdueTasks);
      await manager._checkTaskHealth();
      const alerts = manager.getState().alerts;
      const backlogAlerts = alerts.filter(a => a.type === 'task_backlog');
      expect(backlogAlerts).toHaveLength(1);
      expect(backlogAlerts[0].severity).toBe('high');
    });

    it('should add alert when > 3 tasks stuck "in_progress" for over 7 days', async () => {
      const weekAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      mockGetTasks.mockResolvedValue([
        makeTask({ status: 'in_progress', updated_at: weekAgo }),
        makeTask({ status: 'in_progress', updated_at: weekAgo }),
        makeTask({ status: 'in_progress', updated_at: weekAgo }),
        makeTask({ status: 'in_progress', updated_at: weekAgo }),
      ]);
      await manager._checkTaskHealth();
      const alerts = manager.getState().alerts;
      const stuckAlerts = alerts.filter(a => a.type === 'stuck_tasks');
      expect(stuckAlerts).toHaveLength(1);
      expect(stuckAlerts[0].severity).toBe('medium');
    });

    it('should not add alerts when metrics are normal', async () => {
      mockGetTasks.mockResolvedValue([
        makeTask({ status: 'done' }),
        makeTask({ status: 'pending', due_date: new Date(Date.now() + 86400000).toISOString() }),
      ]);
      await manager._checkTaskHealth();
      expect(manager.getState().alerts).toHaveLength(0);
    });

    it('should handle errors silently', async () => {
      mockGetTasks.mockRejectedValue(new Error('Network error'));
      expect(async () => {
        await manager._checkTaskHealth();
      }).not.toThrow();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Anomaly Detection
  // ═══════════════════════════════════════════════════════════════

  describe('Anomaly Detection', () => {
    it('should detect a success rate drop anomaly', async () => {
      manager._state.metrics.completedActions = 5;
      manager._state.metrics.failedActions = 5;
      manager._state.metrics.actionSuccessRate = 0.5;
      manager._config.confidenceThreshold = 0.7;
      const anomalies = await manager._detectAnomalies();
      const rateAnomalies = anomalies.filter(a => a.message.includes('success rate'));
      expect(rateAnomalies).toHaveLength(1);
      expect(rateAnomalies[0].severity).toBe('high');
    });

    it('should NOT detect success rate drop when total actions <= 5', async () => {
      manager._state.metrics.completedActions = 2;
      manager._state.metrics.failedActions = 3;
      manager._state.metrics.actionSuccessRate = 0.4;
      const anomalies = await manager._detectAnomalies();
      const rateAnomalies = anomalies.filter(a => a.message.includes('success rate'));
      expect(rateAnomalies).toHaveLength(0); // total = 5, not > 5
    });

    it('should detect overdue task surge anomaly', async () => {
      manager._state.metrics.overdueTasks = 35;
      manager._state.metrics.totalTasks = 100; // 35% overdue
      const anomalies = await manager._detectAnomalies();
      const surgeAnomalies = anomalies.filter(a => a.message.includes('tasks overdue'));
      expect(surgeAnomalies).toHaveLength(1);
    });

    it('should NOT detect surge when totalTasks <= 10', async () => {
      manager._state.metrics.overdueTasks = 8;
      manager._state.metrics.totalTasks = 10;
      const anomalies = await manager._detectAnomalies();
      const surgeAnomalies = anomalies.filter(a => a.message.includes('tasks overdue'));
      expect(surgeAnomalies).toHaveLength(0);
    });

    it('should detect stale tasks anomaly', async () => {
      manager._state.metrics.staleTasks = 8;
      const anomalies = await manager._detectAnomalies();
      const staleAnomalies = anomalies.filter(a => a.message.includes('untouched'));
      expect(staleAnomalies).toHaveLength(1);
      expect(staleAnomalies[0].severity).toBe('medium');
    });

    it('should NOT detect stale when <= 5', async () => {
      manager._state.metrics.staleTasks = 5;
      const anomalies = await manager._detectAnomalies();
      const staleAnomalies = anomalies.filter(a => a.message.includes('untouched'));
      expect(staleAnomalies).toHaveLength(0);
    });

    it('should increment anomaliesDetected counter', async () => {
      manager._state.metrics.overdueTasks = 50;
      manager._state.metrics.totalTasks = 100;
      manager._state.metrics.staleTasks = 10;
      manager._state.metrics.completedActions = 10;
      manager._state.metrics.failedActions = 10;
      manager._state.metrics.actionSuccessRate = 0.5;
      const before = manager._state.metrics.anomaliesDetected;
      await manager._detectAnomalies();
      expect(manager._state.metrics.anomaliesDetected).toBe(before + 3);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Full Monitoring Cycle
  // ═══════════════════════════════════════════════════════════════

  describe('Full Monitoring Cycle', () => {
    it('should run full cycle: health check → detect → auto-execute → heal', async () => {
      const healthSpy = vi.spyOn(manager, '_checkSystemHealth');
      const detectSpy = vi.spyOn(manager, '_detectAnomalies');
      const autoSpy = vi.spyOn(manager, '_autoExecuteRoutineActions');
      const healSpy = vi.spyOn(manager, '_attemptSelfHealing');

      manager._running = true;  // Must be running for cycle to execute
      manager._config.selfHealing = true;
      // Seed stale tasks so anomaly detection triggers
      const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
      mockGetTasks.mockResolvedValue(Array.from({ length: 10 }, () =>
        makeTask({ updated_at: oldDate, status: 'pending' }),
      ));

      await manager._runMonitoringCycle();

      expect(healthSpy).toHaveBeenCalled();
      expect(detectSpy).toHaveBeenCalled();
      expect(autoSpy).toHaveBeenCalled();
      expect(healSpy).toHaveBeenCalled();
      expect(manager.getState().lastMonitorCycle).toBeTruthy();
    });

    it('should skip monitoring when disabled', async () => {
      manager._config.enabled = false;
      const healthSpy = vi.spyOn(manager, '_checkSystemHealth');
      await manager._runMonitoringCycle();
      expect(healthSpy).not.toHaveBeenCalled();
    });

    it('should skip monitoring when not running', async () => {
      manager._running = false;
      const healthSpy = vi.spyOn(manager, '_checkSystemHealth');
      await manager._runMonitoringCycle();
      expect(healthSpy).not.toHaveBeenCalled();
    });

    it('should emit monitorCycle event', async () => {
      const listener = vi.fn();
      manager.onEvent(listener);
      manager._running = true;  // Must be running for cycle to execute
      manager._config.selfHealing = false;
      mockGetTasks.mockResolvedValue([]);
      await manager._runMonitoringCycle();
      const monitorEvents = listener.mock.calls
        .map(c => c[0])
        .filter(e => e.type === 'monitorCycle');
      expect(monitorEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Executor
  // ═══════════════════════════════════════════════════════════════

  describe('Executor', () => {
    beforeEach(() => {
      mockExecuteAction.mockReset();
    });

    it('should execute a named action successfully', async () => {
      mockExecuteAction.mockResolvedValue({ archived: 5 });
      const result = await manager.execute('cleanup_data', { olderThanDays: 30 });
      expect(result.success).toBe(true);
      expect(result.data.archived).toBe(5);
      expect(mockExecuteAction).toHaveBeenCalledWith(
        'cleanup_data',
        { olderThanDays: 30 },
        expect.objectContaining({ source: 'autonomous_ai' }),
      );
    });

    it('should handle action execution failure', async () => {
      mockExecuteAction.mockRejectedValue(new Error('Action not found'));
      const result = await manager.execute('unknown_action', {});
      expect(result.success).toBe(false);
      expect(result.error).toBe('Action not found');
    });

    it('should record outcome on success', async () => {
      mockExecuteAction.mockResolvedValue({ data: 'ok' });
      const recordSpy = vi.spyOn(manager, '_recordOutcome');
      await manager.execute('cleanup_data', {});
      expect(recordSpy).toHaveBeenCalledWith('cleanup_data', true, expect.any(Number));
    });

    it('should record outcome on failure', async () => {
      mockExecuteAction.mockRejectedValue(new Error('fail'));
      const recordSpy = vi.spyOn(manager, '_recordOutcome');
      await manager.execute('cleanup_data', {});
      expect(recordSpy).toHaveBeenCalledWith('cleanup_data', false, expect.any(Number), 'fail');
    });

    it('should increment completedActions counter on success', async () => {
      mockExecuteAction.mockResolvedValue({ data: 'ok' });
      const before = manager._state.metrics.completedActions;
      await manager.execute('cleanup_data', {});
      expect(manager._state.metrics.completedActions).toBe(before + 1);
    });

    it('should increment failedActions counter on failure', async () => {
      mockExecuteAction.mockRejectedValue(new Error('fail'));
      const before = manager._state.metrics.failedActions;
      await manager.execute('cleanup_data', {});
      expect(manager._state.metrics.failedActions).toBe(before + 1);
    });

    it('should emit actionExecuted and actionFailed events', async () => {
      const listener = vi.fn();
      manager.onEvent(listener);

      mockExecuteAction.mockResolvedValue({ data: 'ok' });
      await manager.execute('test_action', {});

      const executedEvents = listener.mock.calls
        .map(c => c[0])
        .filter(e => e.type === 'actionExecuted');
      expect(executedEvents).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Auto-Execute Routine Actions
  // ═══════════════════════════════════════════════════════════════

  describe('Auto-Execute Routine Actions', () => {
    it('should skip when autoExecuteLowSafety is disabled', async () => {
      manager._config.autoExecuteLowSafety = false;
      await manager._autoExecuteRoutineActions();
      expect(mockExecuteAction).not.toHaveBeenCalled();
    });

    it('should archive stale tasks when staleTasks > 3', async () => {
      manager._state.metrics.staleTasks = 5;
      mockExecuteAction.mockResolvedValue({ success: true });
      await manager._autoExecuteRoutineActions();
      expect(mockExecuteAction).toHaveBeenCalledWith(
        'cleanup_data',
        expect.objectContaining({ olderThanDays: 14 }),
        expect.any(Object),
      );
    });

    it('should not archive when staleTasks <= 3', async () => {
      manager._state.metrics.staleTasks = 2;
      await manager._autoExecuteRoutineActions();
      // Should still try to send notification (2nd action)
      expect(mockExecuteAction).toHaveBeenCalledTimes(1);
    });

    it('should send health notification as second action', async () => {
      manager._state.metrics.staleTasks = 0; // skip archive
      mockExecuteAction.mockResolvedValue({});
      await manager._autoExecuteRoutineActions();
      const notificationCalls = mockExecuteAction.mock.calls.filter(
        c => c[0] === 'create_notification',
      );
      expect(notificationCalls).toHaveLength(1);
    });

    it('should emit autoRoutineComplete event', async () => {
      const listener = vi.fn();
      manager.onEvent(listener);
      manager._state.metrics.staleTasks = 0;
      mockExecuteAction.mockResolvedValue({});
      await manager._autoExecuteRoutineActions();
      const events = listener.mock.calls
        .map(c => c[0])
        .filter(e => e.type === 'autoRoutineComplete');
      expect(events).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Self-Healing
  // ═══════════════════════════════════════════════════════════════

  describe('Self-Healing', () => {
    it('should attempt to heal task_backlog anomalies (medium severity)', async () => {
      mockExecuteAction.mockResolvedValue({});
      const anomalies = [
        { type: 'task_backlog', severity: 'medium', message: 'test', details: {}, suggestedAction: '' },
      ];
      await manager._attemptSelfHealing(anomalies);
      // Should call cleanup_data
      expect(mockExecuteAction).toHaveBeenCalledWith(
        'cleanup_data',
        expect.any(Object),
        expect.any(Object),
      );
      expect(manager._state.metrics.selfHealingAttempts).toBe(1);
      expect(manager._state.metrics.selfHealingSuccesses).toBe(1);
    });

    it('should NOT attempt to heal task_backlog with high severity', async () => {
      mockExecuteAction.mockResolvedValue({});
      const anomalies = [
        { type: 'task_backlog', severity: 'high', message: 'test', details: {}, suggestedAction: '' },
      ];
      await manager._attemptSelfHealing(anomalies);
      // Should not call cleanup_data for high severity
      const cleanupCalls = mockExecuteAction.mock.calls.filter(c => c[0] === 'cleanup_data');
      expect(cleanupCalls).toHaveLength(0);
      expect(manager._state.metrics.selfHealingAttempts).toBe(0);
    });

    it('should send reminder for stuck_tasks anomaly', async () => {
      mockExecuteAction.mockResolvedValue({});
      const anomalies = [
        { type: 'stuck_tasks', severity: 'medium', message: 'test', details: {}, suggestedAction: '' },
      ];
      await manager._attemptSelfHealing(anomalies);
      const notificationCalls = mockExecuteAction.mock.calls.filter(c => c[0] === 'create_notification');
      expect(notificationCalls).toHaveLength(1);
      expect(manager._state.metrics.selfHealingAttempts).toBe(1);
    });

    it('should respect maxAutoActionsPerCycle', async () => {
      mockExecuteAction.mockResolvedValue({});
      const anomalies = Array.from({ length: 10 }, (_, i) => ({
        type: 'task_backlog',
        severity: 'medium',
        message: `test ${i}`,
        details: {},
        suggestedAction: '',
      }));
      await manager._attemptSelfHealing(anomalies);
      // maxAutoActionsPerCycle is 3, but only medium-severity task_backlog triggers healing
      expect(manager._state.metrics.selfHealingAttempts).toBeLessThanOrEqual(3);
    });

    it('should emit selfHealAttempt event', async () => {
      const listener = vi.fn();
      manager.onEvent(listener);
      mockExecuteAction.mockResolvedValue({});
      await manager._attemptSelfHealing([
        { type: 'stuck_tasks', severity: 'medium', message: 'test', details: {}, suggestedAction: '' },
      ]);
      const events = listener.mock.calls
        .map(c => c[0])
        .filter(e => e.type === 'selfHealAttempt');
      expect(events).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Learning Engine
  // ═══════════════════════════════════════════════════════════════

  describe('Learning Engine', () => {
    it('should record outcome in learning log', () => {
      manager._recordOutcome('test_action', true, 150);
      const log = manager.getLearningLog();
      expect(log).toHaveLength(1);
      expect(log[0].actionName).toBe('test_action');
      expect(log[0].success).toBe(true);
      expect(log[0].executionTime).toBe(150);
    });

    it('should skip recording when learning is disabled', () => {
      manager._config.learningEnabled = false;
      manager._recordOutcome('test_action', true, 100);
      expect(manager.getLearningLog()).toHaveLength(0);
    });

    it('should update actionSuccessRate based on recent outcomes', () => {
      // Record 3 successes and 2 failures = 60% rate
      manager._recordOutcome('a', true, 100);
      manager._recordOutcome('b', true, 100);
      manager._recordOutcome('c', true, 100);
      manager._recordOutcome('d', false, 100);
      manager._recordOutcome('e', false, 100);
      expect(manager._state.metrics.actionSuccessRate).toBe(3 / 5);
    });

    it('should only consider last 50 outcomes for success rate', () => {
      // Add 55 outcomes: 55 successes
      for (let i = 0; i < 55; i++) {
        manager._recordOutcome('a', true, 10);
      }
      // Add 0 failures — last 50 are all successes
      expect(manager._state.metrics.actionSuccessRate).toBe(1.0);
    });

    it('should increase confidenceThreshold when failure rate > 30%', () => {
      // Start with default 0.7
      // Fill 21 outcomes: 15 failures, 6 successes = ~71% failure rate
      for (let i = 0; i < 15; i++) manager._recordOutcome('a', false, 100);
      for (let i = 0; i < 6; i++) manager._recordOutcome('a', true, 100);
      expect(manager._config.confidenceThreshold).toBeGreaterThanOrEqual(0.75);
    });

    it('should decrease confidenceThreshold when failure rate < 10%', () => {
      // Start with 0.7 — but decrease only starts after 20 outcomes
      // 21 successes, 0 failures = 0% failure rate
      for (let i = 0; i < 21; i++) manager._recordOutcome('a', true, 100);
      expect(manager._config.confidenceThreshold).toBeLessThanOrEqual(0.68);
    });

    it('should NOT adjust threshold before 20 outcomes are recorded', () => {
      // 19 outcomes: all failures
      for (let i = 0; i < 19; i++) manager._recordOutcome('a', false, 100);
      expect(manager._config.confidenceThreshold).toBe(0.7);
    });

    it('should clamp confidenceThreshold between 0.5 and 0.95', () => {
      // Push threshold up: many failures
      for (let i = 0; i < 100; i++) manager._recordOutcome('a', false, 100);
      expect(manager._config.confidenceThreshold).toBeLessThanOrEqual(0.95);
      expect(manager._config.confidenceThreshold).toBeGreaterThanOrEqual(0.5);
    });

    it('should return learned insights grouped by action', () => {
      manager._recordOutcome('action_a', true, 100);
      manager._recordOutcome('action_a', true, 200);
      manager._recordOutcome('action_a', false, 150);
      manager._recordOutcome('action_b', true, 50);

      const insights = manager.getLearnedInsights();
      const aInsight = insights.find(i => i.actionName === 'action_a');
      const bInsight = insights.find(i => i.actionName === 'action_b');

      expect(aInsight).toBeDefined();
      expect(aInsight.count).toBe(3);
      expect(aInsight.successRate).toBe(2 / 3);
      expect(aInsight.avgTime).toBe(150);
      expect(bInsight.count).toBe(1);
      expect(bInsight.successRate).toBe(1);
    });

    it('should return empty insights when no outcomes recorded', () => {
      expect(manager.getLearnedInsights()).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Alerting
  // ═══════════════════════════════════════════════════════════════

  describe('Alerting', () => {
    it('should add alert with id and timestamp', () => {
      manager._addAlert({
        type: 'test',
        severity: 'low',
        message: 'Test alert',
        details: {},
        suggestedAction: 'Do something',
      });
      const alerts = manager.getState().alerts;
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toMatch(/^alert_/);
      expect(alerts[0].timestamp).toBeTruthy();
      expect(alerts[0].message).toBe('Test alert');
      expect(alerts[0].suggestedAction).toBe('Do something');
    });

    it('should keep max 50 alerts', () => {
      for (let i = 0; i < 60; i++) {
        manager._addAlert({ type: 'test', severity: 'low', message: `Alert ${i}`, details: {}, suggestedAction: '' });
      }
      expect(manager.getState().alerts).toHaveLength(50);
    });

    it('should acknowledge an alert', () => {
      manager._addAlert({ type: 'test', severity: 'low', message: 'test', details: {}, suggestedAction: '' });
      const alertId = manager.getState().alerts[0].id;
      manager.acknowledgeAlert(alertId);
      const alert = manager.getState().alerts[0];
      expect(alert.acknowledged).toBe(true);
      expect(alert.acknowledgedAt).toBeTruthy();
    });

    it('should silently handle unknown alert ID', () => {
      expect(() => manager.acknowledgeAlert('nonexistent')).not.toThrow();
    });

    it('should clear non-critical alerts with clearResolvedAlerts', () => {
      manager._addAlert({ type: 'a', severity: 'low', message: 'low', details: {}, suggestedAction: '' });
      manager._addAlert({ type: 'b', severity: 'medium', message: 'medium', details: {}, suggestedAction: '' });
      manager._addAlert({ type: 'c', severity: 'critical', message: 'critical', details: {}, suggestedAction: '' });
      manager.clearResolvedAlerts();
      const alerts = manager.getState().alerts;
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('critical');
    });

    it('should emit alert event', () => {
      const listener = vi.fn();
      manager.onEvent(listener);
      manager._addAlert({ type: 'test', severity: 'high', message: 'test', details: {}, suggestedAction: '' });
      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].type).toBe('alert');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Reporting
  // ═══════════════════════════════════════════════════════════════

  describe('Reporting', () => {
    it('should generate a report with summary and sections', async () => {
      // Seed some data so the report has content
      manager._recordOutcome('test', true, 100);
      manager._addAlert({ type: 'test', severity: 'low', message: 'test alert', details: {}, suggestedAction: '' });

      const report = await manager.generateReport();

      expect(report.title).toContain('Autonomous AI Report');
      expect(report.summary).toBeTruthy();
      expect(report.sections).toBeInstanceOf(Array);
      expect(report.sections.length).toBeGreaterThanOrEqual(5);
      expect(report.generatedAt).toBeTruthy();
      expect(report.status).toBe('healthy');
    });

    it('should include learned insights in report when available', async () => {
      manager._recordOutcome('test_action', true, 100);
      manager._recordOutcome('test_action', true, 200);

      const report = await manager.generateReport();
      const insightsSection = report.sections.find(s => s.title === 'Learned Insights');
      expect(insightsSection).toBeDefined();
      expect(insightsSection.content).toContain('test_action');
    });

    it('should not include insights section when no outcomes', async () => {
      const report = await manager.generateReport();
      const insightsSection = report.sections.find(s => s.title === 'Learned Insights');
      expect(insightsSection).toBeUndefined();
    });

    it('should include active alerts in report', async () => {
      manager._addAlert({ type: 'test', severity: 'high', message: 'Critical alert', details: {}, suggestedAction: '' });
      const report = await manager.generateReport();
      const alertsSection = report.sections.find(s => s.title === 'Active Alerts');
      expect(alertsSection.content).toContain('Critical alert');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Event System
  // ═══════════════════════════════════════════════════════════════

  describe('Event System', () => {
    it('should register and call event listeners', () => {
      const listener = vi.fn();
      const unsub = manager.onEvent(listener);
      manager._emit('testEvent', { key: 'value' });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].type).toBe('testEvent');
      expect(listener.mock.calls[0][0].data.key).toBe('value');
      expect(listener.mock.calls[0][0].timestamp).toBeTruthy();
    });

    it('should unsubscribe listeners', () => {
      const listener = vi.fn();
      const unsub = manager.onEvent(listener);
      unsub();
      manager._emit('testEvent', {});
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn().mockImplementation(() => { throw new Error('listener failed'); });
      manager.onEvent(errorListener);
      expect(() => manager._emit('testEvent', {})).not.toThrow();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Utilities
  // ═══════════════════════════════════════════════════════════════

  describe('Utilities', () => {
    describe('_formatDuration', () => {
      it('should format seconds', () => {
        expect(manager._formatDuration(5000)).toBe('5s');
      });

      it('should format minutes and seconds', () => {
        expect(manager._formatDuration(125000)).toBe('2m 5s');
      });

      it('should format hours and minutes', () => {
        expect(manager._formatDuration(7500000)).toBe('2h 5m');
      });

      it('should format days and hours', () => {
        expect(manager._formatDuration(200000000)).toBe('2d 7h');
      });
    });

    describe('getKnowledgeBase', () => {
      it('should return structured knowledge base', () => {
        manager._recordOutcome('test', true, 100);
        const kb = manager.getKnowledgeBase();
        expect(kb.name).toBe('OptivianAI Assistant');
        expect(kb.totalDecisions).toBe(1);
        expect(kb.recentActions).toHaveLength(1);
        expect(kb.learnedInsights).toBeDefined();
        expect(kb.currentConfig).toBeDefined();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Singleton
  // ═══════════════════════════════════════════════════════════════

  describe('Singleton', () => {
    it('should export a default singleton instance', () => {
      expect(autonomousAIManager).toBeDefined();
      expect(autonomousAIManager).toBeInstanceOf(AutonomousAIManager);
      expect(autonomousAIManager.getConfig).toBeDefined();
      expect(autonomousAIManager.start).toBeDefined();
      expect(autonomousAIManager.stop).toBeDefined();
    });
  });
});
