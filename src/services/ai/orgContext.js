/**
 * ─── Org Shared Context ─────────────────────────────────────────
 *
 * A singleton that maintains a live, concise "organizational brief"
 * that is automatically injected into EVERY AI call across ALL
 * providers (DeepSeek, Gemini, OpenAI, etc.).
 *
 * This means every AI model has full context awareness of:
 *   - Org health & risk scores (from DeepSeek analysis)
 *   - Task statistics & completion rates
 *   - Member activity & online status
 *   - Recent insights, recommendations, and trend predictions
 *
 * The context is rebuilt whenever:
 *   - The org analytics engine publishes new insights (every 60s)
 *   - The updateOrgContext() function is called explicitly
 *
 * Usage:
 *   import { getOrgContext } from './orgContext';
 *   const brief = getOrgContext(); // Returns the current org brief string
 *
 * The aiService.js automatically calls getOrgContext() and prepends
 * the result to every system prompt — no manual wiring needed.
 *
 * In DEV_MODE, reads from localStorage. In production, queries Supabase
 * to provide real-time org awareness to every AI model.
 */

import { supabase } from '../supabase';

// ─── Module-level state ─────────────────────────────────────────

/** @type {string} */
let contextString = '';

/** @type {number} */
let lastBuildTime = 0;

/** @type {boolean} */
let initialized = false;

/** @type {number|null} */
let pollingIntervalId = null;

/** @type {string|null} */
let currentOrgId = null;

// ─── Context builder (async, supports both modes) ──────────────

/**
 * Build a concise org context brief from the available data sources.
 * This is designed to be injected as a prefix to every AI system prompt.
 *
 * In DEV_MODE reads from localStorage; in production queries Supabase.
 *
 * @param {object} [orgId] - Organization ID for Supabase queries (not needed in DEV_MODE)
 * @returns {Promise<string>}
 */
async function buildContextStringAsync(orgId) {
  let tasks = [];
  let profiles = [];
  let latestInsights = null;

  const isDev = !import.meta.env.VITE_SUPABASE_URL;

  // ── Collect live data ──────────────────────────────────────
  if (isDev) {
    try {
      tasks = JSON.parse(localStorage.getItem('optivian_dev_tasks') || '[]');
    } catch {}
    try {
      profiles = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
    } catch {}
  } else if (orgId) {
    // Production: query Supabase
    try {
      const { data: fetchedTasks } = await supabase
        .from('tasks')
        .select('status, priority, due_date')
        .eq('organization_id', orgId);
      if (fetchedTasks) tasks = fetchedTasks;
    } catch {}

    try {
      const { data: fetchedProfiles } = await supabase
        .from('profiles')
        .select('last_seen, is_suspended')
        .eq('organization_id', orgId);
      if (fetchedProfiles) profiles = fetchedProfiles;
    } catch {}
  }

  // ── Try to get cached org insights (always from localStorage) ──
  try {
    const insightsKey = 'optivian_org_ai_insights';
    const raw = localStorage.getItem(insightsKey);
    if (raw) {
      latestInsights = JSON.parse(raw);
    }
  } catch {}

  // ── Compute stats ──────────────────────────────────────────
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress').length;
  const overdueTasks = tasks.filter(t =>
    t.due_date && new Date(t.due_date) < new Date() &&
    t.status !== 'done' && t.status !== 'completed'
  ).length;
  const urgentCount = tasks.filter(t => t.priority === 'urgent').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalMembers = profiles.length;
  const activeMembers = profiles.filter(p => !p.is_suspended).length;
  const onlineMembers = profiles.filter(p => {
    if (!p.last_seen) return false;
    return Date.now() - new Date(p.last_seen).getTime() < 300000; // 5 min
  }).length;

  // ── Build the context string ───────────────────────────────
  const parts = [];

  // Organization overview
  parts.push(`📊 ORGANIZATION OVERVIEW`);
  parts.push(`Members: ${activeMembers} active (${onlineMembers} online now) out of ${totalMembers} total`);
  parts.push(`Tasks: ${totalTasks} total | ${completionRate}% complete | ${pendingTasks} pending | ${inProgressTasks} in-progress | ${overdueTasks} overdue | ${urgentCount} urgent`);

  // AI-powered insights (if available from DeepSeek analysis)
  if (latestInsights && !latestInsights.isDefault) {
    parts.push(``);
    parts.push(`🧠 AI EXECUTIVE ANALYSIS`);
    parts.push(`Org Health: ${latestInsights.orgHealthScore ?? '?'}/100`);
    parts.push(`Productivity: ${latestInsights.productivityScore ?? '?'}/100`);
    parts.push(`Risk Score: ${latestInsights.riskScore ?? '?'}/100`);
    parts.push(`Satisfaction: ${latestInsights.satisfactionScore ?? '?'}/100`);
    parts.push(`Launch Readiness: ${latestInsights.launchReadiness ?? '?'}/100`);

    if (latestInsights.summary) {
      parts.push(`Summary: ${latestInsights.summary}`);
    }
    if (latestInsights.trendPrediction) {
      parts.push(`Trend: ${latestInsights.trendPrediction}`);
    }
    if (latestInsights.recommendations?.length > 0) {
      parts.push(`Top Recommendations: ${latestInsights.recommendations.slice(0, 3).join(' | ')}`);
    }
    if (latestInsights.keyInsights?.length > 0) {
      const top = latestInsights.keyInsights.slice(0, 3);
      top.forEach((insight) => {
        parts.push(`- [${insight.type?.toUpperCase()}] ${insight.title}: ${insight.description}`);
      });
    }
    if (latestInsights.topRisks?.length > 0) {
      const risks = latestInsights.topRisks.slice(0, 2);
      risks.forEach((risk) => {
        parts.push(`⚠️ [${risk.severity?.toUpperCase()}] ${risk.title}: ${risk.description}`);
      });
    }
    parts.push(`Analysis Timestamp: ${latestInsights.analyzedAt || 'unknown'}`);
  }

  // Closing instruction
  parts.push(``);
  parts.push(`⚠️ NOTE: The above is live organizational context. Use it to ground your responses in the current state of this organization. When asked about the organization's performance, refer to these metrics.`);

  return parts.join('\n');
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Get the current org context brief.
 * This is called by aiService.js and automatically prepended to
 * every AI call's system prompt — all providers share this context.
 *
 * Auto-initializes on first call: if no context has been built yet,
 * it builds immediately and starts the polling loop. This ensures
 * the org context is always available regardless of which page
 * (Dashboard, Chat, etc.) triggers the first AI call.
 *
 * @returns {string} The current org context string (empty string if no context yet)
 */
export function getOrgContext() {
  // Lazy auto-initialize — build context on first call and start polling
  if (!initialized) {
    // Fire-and-forget async refresh — context string will be populated in background
    refreshContext();
    pollingIntervalId = setInterval(() => {
      refreshContext();
    }, 30000);
    initialized = true;
  }
  return contextString;
}

/**
 * Manually trigger a refresh of the org context.
 * Called automatically by the periodic polling interval.
 * Now async — queries Supabase in production mode.
 *
 * @param {object|string} [userOrOrgId] - The current user or orgId string
 */
export async function refreshContext(userOrOrgId) {
  // Accept either a user object or a string orgId
  let orgId;
  if (typeof userOrOrgId === 'string') {
    orgId = userOrOrgId;
  } else if (userOrOrgId?.user_metadata?.organization_id) {
    orgId = userOrOrgId.user_metadata.organization_id;
  } else {
    orgId = currentOrgId;
  }
  contextString = await buildContextStringAsync(orgId);
  lastBuildTime = Date.now();
}

/**
 * Start the polling loop that keeps org context up-to-date.
 * Runs immediately and then every REFRESH_INTERVAL.
 *
 * @param {number} intervalMs - Polling interval in ms (default 30s)
 * @param {string|object} [orgIdOrUser] - Org ID string or user object to track
 * @returns {() => void} Cleanup function to stop polling
 */
export function startContextUpdates(intervalMs = 30000, orgIdOrUser) {
  // If a lazy-init interval is already running from getOrgContext(),
  // clear it and replace with this explicitly configured one.
  if (pollingIntervalId !== null) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }

  // Store orgId for use by the polling interval
  if (typeof orgIdOrUser === 'string') {
    currentOrgId = orgIdOrUser;
  } else if (orgIdOrUser?.user_metadata?.organization_id) {
    currentOrgId = orgIdOrUser.user_metadata.organization_id;
  }

  // Run immediately (fire-and-forget async)
  refreshContext();

  const id = setInterval(() => {
    refreshContext();
  }, intervalMs);

  pollingIntervalId = id;
  initialized = true;

  // Return cleanup
  return () => {
    clearInterval(id);
    pollingIntervalId = null;
    initialized = false;
    currentOrgId = null;
  };
}

/**
 * Check if the context system has been initialized.
 * @returns {boolean}
 */
export function isInitialized() {
  return initialized;
}
