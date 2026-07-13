/**
 * AI Actions — Phase B1
 *
 * The Action Registry maps AI tool types to executable functions
 * with rollback, approval requirements, and logging.
 *
 * Usage:
 *   import { executeAction, getActionsForTool } from '../actions';
 *
 *   const actions = getActionsForTool('swot_analysis');
 *   const result = await executeAction('create_task', { title: '...' }, { user });
 */

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
