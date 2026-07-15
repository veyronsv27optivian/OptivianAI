/**
 * Action Registry — Phase B1
 *
 * Maps AI tool types to executable actions with approval levels,
 * rollback support, and action logging.
 *
 * Schema per action:
 * {
 *   toolType: '*',                    // Which AI tool can trigger this ('*' for all)
 *   actionName: 'create_task',        // Unique action identifier
 *   label: 'Create Task',             // Display text for UI
 *   handler: async (params, ctx) => {},  // The function that executes
 *   rollbackHandler: async (params, ctx) => {}, // How to undo (optional)
 *   requiresApproval: true,           // Does user need to approve first?
 *   description: 'Creates a task...', // Help text
 *   safetyLevel: 'low',               // 'low' | 'medium' | 'high' | 'critical'
 * }
 */

// ─── Internal Store ──────────────────────────────────────────────

/** @type {Map<string, ActionDefinition>} */
const _actions = new Map();

/** @type {ActionLogEntry[]} */
const _actionLog = [];

// ─── Validation ──────────────────────────────────────────────────

function validateAction(action) {
  const required = ['actionName', 'label', 'handler', 'description'];
  const missing = required.filter((f) => !action[f]);
  if (missing.length > 0) {
    throw new Error(
      `Action "${action.actionName || '(unnamed)'}" missing required fields: ${missing.join(', ')}`,
    );
  }
  if (typeof action.handler !== 'function') {
    throw new Error(`Action "${action.actionName}" handler must be a function`);
  }
  if (action.rollbackHandler && typeof action.rollbackHandler !== 'function') {
    throw new Error(`Action "${action.actionName}" rollbackHandler must be a function`);
  }
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Register a new action.
 *
 * @param {ActionDefinition} action
 * @throws {Error} If the action name is already registered or validation fails.
 */
export function registerAction(action) {
  validateAction(action);

  const key = action.actionName;
  if (_actions.has(key)) {
    throw new Error(`Action "${key}" is already registered`);
  }

  _actions.set(key, {
    toolType: action.toolType || '*',
    actionName: action.actionName,
    label: action.label,
    description: action.description,
    handler: action.handler,
    rollbackHandler: action.rollbackHandler || null,
    requiresApproval: action.requiresApproval ?? true,
    safetyLevel: action.safetyLevel || 'medium',
    registeredAt: new Date().toISOString(),
  });
}

/**
 * Get all actions available for a given tool type.
 *
 * @param {string} toolType - AI_TOOL_TYPES value or '*' for global actions.
 * @returns {ActionDefinition[]}
 */
export function getActionsForTool(toolType) {
  const results = [];
  for (const action of _actions.values()) {
    if (action.toolType === '*' || action.toolType === toolType) {
      results.push({ ...action });
    }
  }
  return results;
}

/**
 * Execute an action by name.
 *
 * @param {string} actionName - The registered action name.
 * @param {object} params - Parameters passed to the handler.
 * @param {object} [context={}] - Execution context (user, organization, etc.).
 * @param {object} [context.user] - Current user object (required by most handlers).
 * @returns {Promise<{ success: boolean, data: any, action: string }>}
 * @throws {Error} If the action is not found or the handler throws.
 */
export async function executeAction(actionName, params, context = {}) {
  const action = _actions.get(actionName);
  if (!action) {
    throw new Error(`Action "${actionName}" not found in registry`);
  }

  const logEntry = {
    id: _generateLogId(),
    actionName,
    toolType: action.toolType,
    status: 'executing',
    params: _sanitizeForLog(params),
    context: _sanitizeContext(context),
    startedAt: new Date().toISOString(),
  };

  try {
    const result = await action.handler(params, context);
    logEntry.status = 'success';
    logEntry.result = _sanitizeForLog(result);
    logEntry.completedAt = new Date().toISOString();
    _actionLog.push(logEntry);
    return { success: true, data: result, action: action.actionName };
  } catch (error) {
    logEntry.status = 'error';
    logEntry.error = error.message;
    logEntry.completedAt = new Date().toISOString();
    _actionLog.push(logEntry);
    throw error;
  }
}

/**
 * Rollback an action by running its rollback handler.
 *
 * @param {string} actionName - The registered action name.
 * @param {object} params - Parameters passed to the rollback handler.
 * @param {object} [context={}] - Execution context.
 * @returns {Promise<any>}
 * @throws {Error} If no rollback handler exists or the handler throws.
 */
export async function rollbackAction(actionName, params, context = {}) {
  const action = _actions.get(actionName);
  if (!action) {
    throw new Error(`Action "${actionName}" not found in registry`);
  }
  if (!action.rollbackHandler) {
    throw new Error(`Action "${actionName}" has no rollback handler defined`);
  }

  const result = await action.rollbackHandler(params, context);

  _actionLog.push({
    id: _generateLogId(),
    actionName,
    toolType: action.toolType,
    status: 'rolled_back',
    params: _sanitizeForLog(params),
    context: _sanitizeContext(context),
    rolledBackAt: new Date().toISOString(),
  });

  return result;
}

/**
 * Get all registered actions (copies, not references).
 * @returns {ActionDefinition[]}
 */
export function getAllActions() {
  return Array.from(_actions.values()).map((a) => ({ ...a }));
}

/**
 * Get a single action by name.
 * @param {string} actionName
 * @returns {ActionDefinition|null}
 */
export function getAction(actionName) {
  const action = _actions.get(actionName);
  return action ? { ...action } : null;
}

/**
 * Get recent action execution log entries.
 * @param {number} [limit=50]
 * @returns {ActionLogEntry[]}
 */
export function getActionLog(limit = 50) {
  return _actionLog.slice(-limit).reverse();
}

/**
 * Check whether an action requires user approval before executing.
 * @param {string} actionName
 * @returns {boolean}
 */
export function requiresApproval(actionName) {
  const action = _actions.get(actionName);
  return action ? action.requiresApproval : true;
}

/**
 * Get the safety level of an action.
 * @param {string} actionName
 * @returns {string} 'low' | 'medium' | 'high' | 'critical'
 */
export function getSafetyLevel(actionName) {
  const action = _actions.get(actionName);
  return action ? action.safetyLevel : 'critical';
}

/**
 * Clear all registered actions (useful for testing).
 */
export function clearRegistry() {
  _actions.clear();
  _actionLog.length = 0;
}

// ─── Helpers ─────────────────────────────────────────────────────

let _logCounter = 0;

function _generateLogId() {
  _logCounter += 1;
  return `act_${Date.now().toString(36)}_${_logCounter}`;
}

function _sanitizeForLog(obj) {
  if (!obj) return obj;
  try {
    // Deep clone, stripping functions and circular refs
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return { _circular: true, keys: Object.keys(obj) };
  }
}

function _sanitizeContext(ctx) {
  const sanitized = { ...ctx };
  // Remove sensitive fields from log
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.apiKey;
  return sanitized;
}

// ─── Default Action Registration ─────────────────────────────────

/**
 * Register all built-in default actions.
 *
 * These actions cover common operations that AI agents might want
 * to perform: task management, communication, and reporting.
 *
 * Called automatically on module import.
 */
export function registerDefaultActions() {
  // ── Task Actions ──────────────────────────────────────────────

  registerAction({
    toolType: '*',
    actionName: 'create_task',
    label: 'Create Task',
    description: 'Create a new task and optionally assign it to team members',
    handler: async (params, context) => {
      const { createTask } = await import('../../taskService');
      const user = context.user;
      if (!user) throw new Error('User context required — provide context.user');
      const { data, error } = await createTask(user, params);
      if (error) throw new Error(error.message || 'Failed to create task');
      return data;
    },
    rollbackHandler: async (params, context) => {
      const taskId = params.taskId || params.data?.id;
      if (!taskId) throw new Error('taskId required for rollback');
      const { deleteTask } = await import('../../taskService');
      await deleteTask(context.user, taskId);
      return { rolledBack: true, taskId };
    },
    requiresApproval: true,
    safetyLevel: 'low',
  });

  registerAction({
    toolType: '*',
    actionName: 'update_task',
    label: 'Update Task',
    description: 'Update an existing task — title, description, status, priority, or assignees',
    handler: async (params, context) => {
      const { updateTask } = await import('../../taskService');
      const user = context.user;
      if (!user) throw new Error('User context required');
      const { data, error } = await updateTask(user, params.taskId, params.updates);
      if (error) throw new Error(error.message || 'Failed to update task');
      return data;
    },
    requiresApproval: true,
    safetyLevel: 'low',
  });

  registerAction({
    toolType: '*',
    actionName: 'delete_task',
    label: 'Delete Task',
    description: 'Permanently delete a task',
    handler: async (params, context) => {
      const { deleteTask } = await import('../../taskService');
      const user = context.user;
      if (!user) throw new Error('User context required');
      const { error } = await deleteTask(user, params.taskId);
      if (error) throw new Error(error.message || 'Failed to delete task');
      return { deleted: true, taskId: params.taskId };
    },
    requiresApproval: true,
    safetyLevel: 'medium',
  });

  // ── Communication Actions ─────────────────────────────────────

  registerAction({
    toolType: '*',
    actionName: 'send_message',
    label: 'Send Message',
    description: 'Send a message to an existing conversation',
    handler: async (params, context) => {
      const { sendMessage } = await import('../../chatService');
      const user = context.user;
      if (!user) throw new Error('User context required');
      const { data, error } = await sendMessage(user, params.conversationId, params.content, params.options || {});
      if (error) throw new Error(typeof error === 'string' ? error : error.message);
      return data;
    },
    requiresApproval: false,
    safetyLevel: 'low',
  });

  registerAction({
    toolType: '*',
    actionName: 'create_notification',
    label: 'Send Notification',
    description: 'Send a notification to a user (task assigned, mention, alert)',
    handler: async (params, context) => {
      const { createNotification } = await import('../../notificationService');
      await createNotification(params.userId, params.type, params.message, params.refType, params.refId);
      return { sent: true, userId: params.userId };
    },
    requiresApproval: false,
    safetyLevel: 'low',
  });

  // ── AI / Reporting Actions ────────────────────────────────────

  registerAction({
    toolType: '*',
    actionName: 'save_analysis',
    label: 'Save AI Analysis Result',
    description: 'Persist an AI analysis result to the database for later reference',
    handler: async (params, context) => {
      const { saveAnalysis } = await import('../aiService');
      const { data, error } = await saveAnalysis(params);
      if (error) throw new Error(error.message || 'Failed to save analysis');
      return data;
    },
    requiresApproval: false,
    safetyLevel: 'low',
  });

  registerAction({
    toolType: '*',
    actionName: 'get_analyses',
    label: 'Retrieve AI Analysis History',
    description: 'Fetch previously saved AI analysis results',
    handler: async (params, context) => {
      const { getAnalyses } = await import('../aiService');
      const { data, error } = await getAnalyses(params);
      if (error) throw new Error(error.message || 'Failed to fetch analyses');
      return data;
    },
    requiresApproval: false,
    safetyLevel: 'low',
  });

  // ── Conversation Actions ──────────────────────────────────────

  registerAction({
    toolType: '*',
    actionName: 'create_conversation',
    label: 'Create Conversation',
    description: 'Create a new direct or group conversation with specified participants',
    handler: async (params, context) => {
      const { createConversation } = await import('../../chatService');
      const user = context.user;
      if (!user) throw new Error('User context required');
      const { data, error } = await createConversation(user, params.participantIds, params.name, params.isGroup);
      if (error) throw new Error(typeof error === 'string' ? error : error.message);
      return data;
    },
    requiresApproval: true,
    safetyLevel: 'low',
  });

  // ── Assignee Status Actions ───────────────────────────────────

  registerAction({
    toolType: '*',
    actionName: 'update_assignee_status',
    label: 'Update Task Status',
    description: 'Update your own task completion status (pending, in_progress, completed)',
    handler: async (params, context) => {
      const { updateAssigneeStatus } = await import('../../taskService');
      const user = context.user;
      if (!user) throw new Error('User context required');
      const { data, error } = await updateAssigneeStatus(user, params.taskId, params.profileId, params.status);
      if (error) throw new Error(error.message || 'Failed to update status');
      return data;
    },
    requiresApproval: false,
    safetyLevel: 'low',
  });

  // ── Phase C3: Admin Actions ────────────────────────────────────

  registerAction({
    toolType: '*',
    actionName: 'generate_report',
    label: 'Generate & Send Report',
    description: 'Generate an AI report and optionally email or share it with team members',
    handler: async (params, context) => {
      const user = context.user;
      if (!user) throw new Error('User context required');
      const { generateText } = await import('../aiService');
      const result = await generateText('report_generation', params.prompt || params.topic, {
        systemPrompt: `Generate a detailed ${params.reportType || 'business'} report. Title: ${params.title || 'Untitled'}. Include executive summary, key findings, data analysis, and recommendations.`,
        skipLogging: false,
        useCache: false,
      });
      // Share result if conversationId provided
      if (params.shareWith && params.conversationId) {
        const { sendMessage } = await import('../../chatService');
        await sendMessage(user, params.conversationId, `**Report: ${params.title || 'AI Report'}**\n\n${result.text.slice(0, 60000)}`, {});
      }
      return { text: result.text, provider: result.provider, reportType: params.reportType || 'business' };
    },
    requiresApproval: true,
    safetyLevel: 'low',
  });

  registerAction({
    toolType: '*',
    actionName: 'suggest_provisioning',
    label: 'Suggest User Provisioning',
    description: 'Analyze team workload and suggest new roles or hiring needs',
    handler: async (params, context) => {
      const user = context.user;
      if (!user) throw new Error('User context required');
      const { getTasks } = await import('../../taskService');
      const tasks = await getTasks(user);
      const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;
      const totalTasks = tasks.length;
      const workloadScore = totalTasks > 0 ? Math.round((overdue / totalTasks) * 100) : 0;
      const suggestion = {
        suggestedRoles: workloadScore > 30 ? ['additional_staff', 'project_manager'] : [],
        workloadScore,
        totalTasks,
        overdueTasks: overdue,
        analysis: workloadScore > 30
          ? `Team is at ${workloadScore}% overdue rate. Consider hiring additional staff or reallocating resources.`
          : `Team workload is manageable (${workloadScore}% overdue rate). No urgent hiring needed.`,
      };
      return suggestion;
    },
    requiresApproval: true,
    safetyLevel: 'medium',
  });

  registerAction({
    toolType: '*',
    actionName: 'cleanup_data',
    label: 'Data Cleanup Automation',
    description: 'Archive old completed tasks that are past the retention period',
    handler: async (params, context) => {
      const user = context.user;
      if (!user) throw new Error('User context required');
      const cleaned = { tasks: 0 };
      const cutoff = new Date(Date.now() - (params.olderThanDays || 90) * 24 * 60 * 60 * 1000);

      // Clean completed tasks older than cutoff
      const { getTasks, updateTask } = await import('../../taskService');
      const tasks = await getTasks(user);
      for (const t of tasks) {
        if ((t.status === 'done' || t.status === 'cancelled') && new Date(t.updated_at || t.created_at) < cutoff) {
          await updateTask(user, t.id, { status: 'archived' });
          cleaned.tasks++;
        }
      }

      return {
        archivedTasks: cleaned.tasks,
        olderThanDays: params.olderThanDays || 90,
        message: `Archived ${cleaned.tasks} completed task${cleaned.tasks !== 1 ? 's' : ''} older than ${params.olderThanDays || 90} days.`,
      };
    },
    requiresApproval: true,
    safetyLevel: 'medium',
  });
}

// ─── Auto-register on import ─────────────────────────────────────
registerDefaultActions();
