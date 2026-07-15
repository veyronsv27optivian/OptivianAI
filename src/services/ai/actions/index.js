/**
 * AI Actions — Phase B1 & B2
 *
 * The Action Registry (B1) maps AI tool types to executable functions
 * with rollback, approval requirements, and logging.
 *
 * The Execution Engine (B2) orchestrates the full lifecycle:
 * intent parsing → validation → permission check → approval → execute → rollback.
 *
 * Usage:
 *   import { executeAction, executeIntent } from '../actions';
 *
 *   const result = await executeIntent('create_task', { title: '...' }, { user });
 *   const pending = getPendingIntents(user.id);
 */

// ─── Phase B1: Action Registry ────────────────────────────────────
export {
  registerAction,
  getActionsForTool,
  executeAction,
  rollbackAction,
  getAllActions,
  getAction,
  getActionLog,
  requiresApproval,
  getSafetyLevel,
  clearRegistry,
  registerDefaultActions,
} from './actionRegistry';

// ─── Phase B2: Execution Engine ───────────────────────────────────
export {
  parseIntent,
  validateIntent,
  checkPermission,
  proposeAction,
  approveAndExecute,
  rejectAction,
  dismissAction,
  rollbackCompletedAction,
  processAIResponse,
  getPendingIntents,
  getAllPendingIntents,
  getIntent,
  getIntentsByStatus,
  getExecutionLog,
  cleanPendingQueue,
} from './executionEngine';
