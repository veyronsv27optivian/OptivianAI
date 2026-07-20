/**
 * ─── Org Analytics Engine ─────────────────────────────────────────
 * A proactive background service that uses DeepSeek (the primary AI)
 * to analyze everything happening in the organization and generate
 * real, context-aware analytics for the dashboard.
 *
 * Instead of computing fake metrics with arithmetic, this engine:
 *   1. Collects real org data (tasks, members, activity)
 *   2. Sends it to DeepSeek for analysis
 *   3. Caches the AI-generated insights
 *   4. Updates the dashboard with real data
 *
 * The engine runs on a configurable interval and is fire-and-forget
 * so it never blocks the UI.
 *
 * Architecture:
 *   - start() / stop() control the analysis loop
 *   - getLatestInsights() returns the most recent AI analysis
 *   - Events are emitted via a callback pattern so the Dashboard
 *     can subscribe to real-time updates
 */

import { generateText } from './ai/aiService';
import { AI_TOOL_TYPES } from './ai/config';
import { supabase } from './supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;
const INSIGHTS_CACHE_KEY = 'optivian_org_ai_insights';
const REFRESH_INTERVAL_MS = 60000; // Analyze every 60 seconds

// ─── Module-level state ─────────────────────────────────────────

/** @type {Array<Function>} */
const listeners = [];

/** @type {number|null} */
let intervalId = null;

/** @type {object|null} */
let cachedInsights = null;

/** @type {number} */
let lastAnalysisTime = 0;

// ─── Cache helpers (both modes) ─────────────────────────────────

/**
 * Load cached insights from localStorage.
 * Works in both DEV_MODE and production — the cache is always local.
 */
function loadCachedInsights() {
  try {
    return JSON.parse(localStorage.getItem(INSIGHTS_CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveCachedInsights(insights) {
  try {
    localStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify(insights));
  } catch {
    // localStorage may be unavailable (e.g. private browsing in some browsers)
  }
}

// ─── Org data collector ─────────────────────────────────────────

/**
 * Collects all available org data for AI analysis.
 * In DEV_MODE, reads from localStorage.
 * In production, queries from Supabase.
 *
 * @param {object} user - The current user from auth context
 * @param {object} profile - The current user's profile
 * @returns {Promise<object>} Collected org data
 */
async function collectOrgData(user, profile) {
  let tasks = [];
  let members = [];
  let conversations = [];
  let orgInfo = {};

  if (DEV_MODE) {
    try {
      const tasksRaw = JSON.parse(localStorage.getItem('optivian_dev_tasks') || '[]');
      tasks = tasksRaw;

      const profilesRaw = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
      members = profile?.organization_id
        ? profilesRaw.filter(p => p.organization_id === profile.organization_id)
        : profilesRaw;

      const convsRaw = JSON.parse(localStorage.getItem('optivian_dev_conversations') || '[]');
      conversations = convsRaw;

      const orgsRaw = JSON.parse(localStorage.getItem('optivian_dev_orgs') || '[]');
      orgInfo = orgsRaw.find(o => o.id === profile?.organization_id) || {};

    } catch {
      // Silently handle parse errors — return partial data
    }
  } else {
    // ── Production mode: query Supabase for real data ──
    const orgId = profile?.organization_id;
    if (orgId) {
      try {
        // Fetch tasks for this org
        const { data: fetchedTasks } = await supabase
          .from('tasks')
          .select('status, priority, due_date, created_at')
          .eq('organization_id', orgId);
        if (fetchedTasks) tasks = fetchedTasks;

        // Fetch members (profiles) for this org
        const { data: fetchedMembers } = await supabase
          .from('profiles')
          .select('role, is_active, is_suspended, last_seen')
          .eq('organization_id', orgId);
        if (fetchedMembers) members = fetchedMembers;

        // Fetch org info
        const { data: fetchedOrg } = await supabase
          .from('organizations')
          .select('name, type')
          .eq('id', orgId)
          .single();
        if (fetchedOrg) orgInfo = fetchedOrg;

        // Conversations are not stored in Supabase yet — leave empty
      } catch (e) {
        console.warn('[OrgAnalytics] Failed to fetch Supabase data:', e.message);
      }
    }
  }

  // Compute task stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress').length;
  const overdueTasks = tasks.filter(t =>
    t.due_date && new Date(t.due_date) < new Date() &&
    t.status !== 'done' && t.status !== 'completed'
  ).length;
  const urgentTasks = tasks.filter(t => t.priority === 'urgent').length;
  const highTasks = tasks.filter(t => t.priority === 'high').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Compute member stats
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.is_active && !m.is_suspended).length;
  const onlineMembers = members.filter(m => {
    if (!m.last_seen) return false;
    return Date.now() - new Date(m.last_seen).getTime() < 300000;
  }).length;

  // Count roles
  const roleDistribution = {};
  members.forEach(m => {
    const role = m.role || 'staff';
    roleDistribution[role] = (roleDistribution[role] || 0) + 1;
  });

  // Count task priorities
  const priorityDistribution = {
    urgent: urgentTasks,
    high: highTasks,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length,
  };

  return {
    orgName: orgInfo.name || 'My Organization',
    orgType: orgInfo.type || 'Not specified',
    organizationId: profile?.organization_id,
    timestamp: new Date().toISOString(),
    members: {
      total: totalMembers,
      active: activeMembers,
      online: onlineMembers,
      roleDistribution,
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      inProgress: inProgressTasks,
      overdue: overdueTasks,
      completionRate,
      priorityDistribution,
    },
    conversations: {
      total: conversations.length,
    },
  };
}

// ─── AI Analysis prompt builder ─────────────────────────────────

/**
 * Builds the analysis prompt for DeepSeek based on collected org data.
 *
 * @param {object} orgData - Collected organization data
 * @returns {string} The prompt to send to DeepSeek
 */
function buildAnalysisPrompt(orgData) {
  return `You are the AI executive analyst for "${orgData.orgName}". 
Analyze the following organizational data and provide strategic insights.

ORGANIZATION DATA:
- Type: ${orgData.orgType}
- Total Members: ${orgData.members.total}
- Active Members: ${orgData.members.active}
- Online Now: ${orgData.members.online}
- Role Distribution: ${JSON.stringify(orgData.members.roleDistribution)}

- Total Tasks: ${orgData.tasks.total}
- Completed Tasks: ${orgData.tasks.completed}
- Pending Tasks: ${orgData.tasks.pending}
- In Progress: ${orgData.tasks.inProgress}
- Overdue Tasks: ${orgData.tasks.overdue}
- Completion Rate: ${orgData.tasks.completionRate}%
- Urgent Tasks: ${orgData.tasks.priorityDistribution.urgent}
- High Priority Tasks: ${orgData.tasks.priorityDistribution.high}

- Conversations: ${orgData.conversations.total}

Based on this data, provide a comprehensive analysis in the following JSON format ONLY (no markdown, no backticks, pure JSON):

{
  "orgHealthScore": <0-100>,
  "riskScore": <0-100>,
  "productivityScore": <0-100>,
  "satisfactionScore": <0-100>,
  "launchReadiness": <0-100>,
  "summary": "<2-3 sentence executive summary of the organization's current state>",
  "keyInsights": [
    {
      "type": "<'opportunity' | 'risk' | 'insight' | 'success'>",
      "title": "<short title>",
      "description": "<detailed description>",
      "priority": "<'high' | 'medium' | 'low'>"
    }
  ],
  "topRisks": [
    {
      "title": "<risk title>",
      "description": "<what could go wrong>",
      "severity": "<'critical' | 'moderate' | 'low'>"
    }
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>",
    "<actionable recommendation 3>"
  ],
  "departmentHealth": {},
  "trendPrediction": "<1-2 sentence prediction of where the organization is heading based on current data>"
}

Be concise, factual, and specific to the data provided. Do NOT use generic advice. Every insight must be directly related to the numbers above.`;
}

// ─── Parse AI response ──────────────────────────────────────────

/**
 * Parse the AI response text into a structured insights object.
 * Falls back gracefully if parsing fails.
 *
 * @param {string} responseText - Raw text from DeepSeek
 * @returns {object} Parsed insights
 */
function parseAIResponse(responseText) {
  try {
    // Try direct JSON parse first
    return JSON.parse(responseText.trim());
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // Failed to parse extracted JSON
      }
    }
    // Try to find JSON-like object in the text
    const braceMatch = responseText.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        // Failed to parse
      }
    }
  }

  // Ultimate fallback — return a basic structure
  return null;
}

// ─── Core analysis function ─────────────────────────────────────

/**
 * Run one full analysis cycle: collect data → send to DeepSeek → parse → cache → notify listeners.
 *
 * @param {object} user - Current user
 * @param {object} profile - Current user's profile
 * @returns {Promise<object|null>} The analysis insights
 */
async function runAnalysis(user, profile) {
  try {
    const orgData = await collectOrgData(user, profile);

    // Skip if there's not enough data to analyze
    if (orgData.members.total === 0 && orgData.tasks.total === 0) {
      if (!cachedInsights || cachedInsights.isDefault) {
        cachedInsights = getDefaultInsights();
        notifyListeners(cachedInsights);
      }
      return cachedInsights;
    }

    // ── Step 1: Always compute & cache fallback from real data first ──
    // This ensures the dashboard gets meaningful data immediately,
    // even while the AI analysis is running.
    const fallbackInsights = computeFallbackInsights(orgData);
    if (!cachedInsights || cachedInsights.isDefault) {
      cachedInsights = { ...fallbackInsights, isFallback: true };
      lastAnalysisTime = Date.now();
      saveCachedInsights(cachedInsights);
      notifyListeners(cachedInsights);
    }

    // ── Step 2: Try DeepSeek AI analysis ───────────────────────────
    try {
      const prompt = buildAnalysisPrompt(orgData);

      const result = await generateText(
        AI_TOOL_TYPES.EXECUTIVE_INSIGHTS,
        prompt,
        {
          temperature: 0.3,
          maxTokens: 4096,
          useFallback: true,
          skipLogging: true,
        }
      );

      const parsed = parseAIResponse(result.text);

      if (parsed) {
        const insights = {
          ...parsed,
          analyzedAt: new Date().toISOString(),
          orgData,
        };
        cachedInsights = insights;
        lastAnalysisTime = Date.now();
        saveCachedInsights(insights);
        notifyListeners(insights);
        return insights;
      }
    } catch (aiErr) {
      console.warn('[OrgAnalytics] AI analysis failed:', aiErr.message);
      // Fall through — already have computed insights
    }

    // AI unavailable or parsing failed — use computed fallback
    if (!cachedInsights || cachedInsights.isDefault) {
      cachedInsights = { ...fallbackInsights, isFallback: true };
      saveCachedInsights(cachedInsights);
      notifyListeners(cachedInsights);
    }
    return cachedInsights;
  } catch (err) {
    console.warn('[OrgAnalytics] Analysis cycle failed:', err.message);
    if (!cachedInsights) {
      cachedInsights = getDefaultInsights();
      notifyListeners(cachedInsights);
    }
    return cachedInsights;
  }
}

// ─── Default insights (used when no data or first load) ────────

/**
 * Compute meaningful insights from collected org data as a fallback
 * when the AI analysis is unavailable or fails.
 *
 * @param {object} orgData - Collected organization data
 * @returns {object} Computed insights
 */
function computeFallbackInsights(orgData) {
  const { tasks, members } = orgData;
  const totalTasks = tasks.total || 0;
  const completedTasks = tasks.completed || 0;
  const overdueTasks = tasks.overdue || 0;
  const pendingTasks = tasks.pending || 0;
  const inProgressTasks = tasks.inProgress || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalMembers = members.total || 0;
  const activeMembers = members.active || 0;
  const onlineMembers = members.online || 0;

  // Compute health score from real data
  const taskHealth = completionRate * 0.4;
  const overduePenalty = totalTasks > 0 ? Math.min(25, (overdueTasks / totalTasks) * 50) : 0;
  const memberHealth = totalMembers > 0 ? (activeMembers / totalMembers) * 20 : 10;
  const onlineHealth = totalMembers > 0 ? (onlineMembers / totalMembers) * 15 : 0;
  const orgHealthScore = Math.round(Math.min(100, Math.max(0, taskHealth + memberHealth + onlineHealth + 10 - overduePenalty)));

  // Compute risk score
  const riskScore = Math.round(Math.min(100, overdueTasks * 8 + (totalTasks > 0 ? (1 - completionRate / 100) * 40 : 0)));

  // Compute productivity score
  const productivityScore = Math.round(Math.min(100, Math.max(0, completionRate * 0.6 + (totalMembers > 0 ? (onlineMembers / totalMembers) * 20 : 0) + 10)));

  // Compute satisfaction score (inverse of risk)
  const satisfactionScore = Math.round(Math.min(100, Math.max(0, 100 - riskScore * 0.6)));

  // Compute launch readiness
  const launchReadiness = Math.round(Math.min(100, Math.max(0, completionRate * 0.5 + (activeMembers / Math.max(1, totalMembers)) * 20 + (totalTasks > 0 ? 10 : 0))));

  // Build key insights from actual data
  const keyInsights = [];
  if (overdueTasks > 0) {
    keyInsights.push({
      type: 'risk',
      title: `${overdueTasks} Overdue Task${overdueTasks !== 1 ? 's' : ''} Need Attention`,
      description: `${overdueTasks} task${overdueTasks !== 1 ? 's are' : ' is'} past due. Review and reassign to keep projects on track.`,
      priority: overdueTasks > 5 ? 'high' : 'medium',
    });
  }
  if (completionRate > 70) {
    keyInsights.push({
      type: 'success',
      title: `Strong Completion Rate: ${completionRate}%`,
      description: `Your team has completed ${completedTasks} of ${totalTasks} tasks. Great progress!`,
      priority: 'low',
    });
  }
  if (inProgressTasks > 0) {
    keyInsights.push({
      type: 'insight',
      title: `${inProgressTasks} Task${inProgressTasks !== 1 ? 's' : ''} In Progress`,
      description: `Active work on ${inProgressTasks} task${inProgressTasks !== 1 ? 's' : ''}. Keep the momentum going.`,
      priority: 'medium',
    });
  }
  if (totalMembers > 0 && onlineMembers === 0) {
    keyInsights.push({
      type: 'insight',
      title: 'No Team Members Currently Online',
      description: `${totalMembers} team member${totalMembers !== 1 ? 's' : ''} — encourage async collaboration during off-hours.`,
      priority: 'low',
    });
  }
  if (pendingTasks > 5) {
    keyInsights.push({
      type: 'opportunity',
      title: `${pendingTasks} Pending Task${pendingTasks !== 1 ? 's' : ''} Ready for Assignment`,
      description: `Unassigned or pending tasks need attention. Review and delegate to balance workload.`,
      priority: 'medium',
    });
  }

  // Build top risks
  const topRisks = [];
  if (overdueTasks > 3) {
    topRisks.push({
      title: 'Delayed Project Deliverables',
      description: `${overdueTasks} overdue tasks may cascade into project delays and missed deadlines.`,
      severity: overdueTasks > 10 ? 'critical' : 'moderate',
    });
  }
  if (completionRate < 30 && totalTasks > 5) {
    topRisks.push({
      title: 'Low Task Completion Rate',
      description: `Only ${completionRate}% of tasks completed. Team may need additional support or priority realignment.`,
      severity: 'moderate',
    });
  }
  if (totalMembers > 0 && activeMembers < totalMembers * 0.5) {
    topRisks.push({
      title: 'Low Active Member Ratio',
      description: `Only ${activeMembers} of ${totalMembers} members are active. Review engagement and access.`,
      severity: 'moderate',
    });
  }

  // Build recommendations
  const recommendations = [];
  if (overdueTasks > 0) {
    recommendations.push(`Review and reprioritize ${overdueTasks} overdue task${overdueTasks !== 1 ? 's' : ''} to prevent further delays.`);
  }
  if (pendingTasks > 3) {
    recommendations.push(`Assign ${pendingTasks} pending task${pendingTasks !== 1 ? 's' : ''} to available team members.`);
  }
  if (totalTasks > 0 && completionRate < 50) {
    recommendations.push('Consider breaking large tasks into smaller, more manageable subtasks.');
  }
  if (totalMembers > 0 && onlineMembers < totalMembers * 0.3) {
    recommendations.push('Encourage team members to update their availability status for better coordination.');
  }
  if (recommendations.length < 3) {
    recommendations.push('Regular team check-ins help identify blockers early and improve productivity.');
  }

  // Trend prediction
  const trendPrediction = completionRate > 50
    ? `At current pace, the team is on track to maintain ${completionRate}%+ completion rate. Focus on clearing overdue tasks to sustain momentum.`
    : `Task completion at ${completionRate}% suggests bottlenecks. Strategic reprioritization could accelerate progress.`;

  // Build summary
  const summary = totalTasks > 0
    ? `${orgData.orgName} has ${totalMembers} member${totalMembers !== 1 ? 's' : ''} and ${totalTasks} task${totalTasks !== 1 ? 's' : ''}. Completion rate is ${completionRate}% with ${overdueTasks} overdue. ${onlineMembers} member${onlineMembers !== 1 ? 's are' : ' is'} currently online. Overall health score is ${orgHealthScore}%.`
    : `${orgData.orgName} has ${totalMembers} member${totalMembers !== 1 ? 's' : ''}. Add tasks to enable full analytics.`;

  return {
    orgHealthScore,
    riskScore,
    productivityScore,
    satisfactionScore,
    launchReadiness,
    summary,
    keyInsights: keyInsights.slice(0, 6),
    topRisks: topRisks.slice(0, 3),
    recommendations: recommendations.slice(0, 5),
    departmentHealth: {},
    trendPrediction,
    analyzedAt: new Date().toISOString(),
    isDefault: false,
  };
}

function getDefaultInsights() {
  return {
    orgHealthScore: 0,
    riskScore: 0,
    productivityScore: 0,
    satisfactionScore: 0,
    launchReadiness: 0,
    summary: 'Collecting data for initial analysis. Insights will appear shortly after DeepSeek processes your organization data.',
    keyInsights: [],
    topRisks: [],
    recommendations: ['Add tasks and team members to receive AI-powered organizational insights.'],
    departmentHealth: {},
    trendPrediction: 'Awaiting sufficient data to generate trend predictions.',
    analyzedAt: new Date().toISOString(),
    isDefault: true,
  };
}

// ─── Listener management ────────────────────────────────────────

/**
 * Subscribe to insight updates.
 * @param {Function} callback - Called with new insights whenever analysis completes
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
  listeners.push(callback);
  // Immediately deliver cached insights if available
  if (cachedInsights) {
    try { callback(cachedInsights); } catch {}
  }
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifyListeners(insights) {
  for (const cb of listeners) {
    try { cb(insights); } catch {}
  }
}

// ─── Lifecycle ──────────────────────────────────────────────────

/**
 * Start the proactive analysis engine.
 * Runs immediately on first call, then every REFRESH_INTERVAL_MS.
 *
 * @param {object} user - Current user
 * @param {object} profile - Current user's profile
 */
export function start(user, profile) {
  // Load cached insights from previous session
  if (!cachedInsights) {
    cachedInsights = loadCachedInsights() || getDefaultInsights();
    notifyListeners(cachedInsights);
  }

  // Run immediately
  if (user && profile) {
    runAnalysis(user, profile);
  }

  // Schedule periodic analysis
  if (intervalId === null) {
    intervalId = setInterval(() => {
      if (user && profile) {
        runAnalysis(user, profile);
      }
    }, REFRESH_INTERVAL_MS);
  }
}

/**
 * Stop the analysis engine.
 */
export function stop() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * Update user context (call when user or profile changes).
 * @param {object} user
 * @param {object} profile
 */
export function updateContext(user, profile) {
  if (user && profile) {
    // Run an immediate analysis when context changes
    runAnalysis(user, profile);
  }
}

/**
 * Get the latest cached insights immediately (synchronous).
 * @returns {object}
 */
export function getLatestInsights() {
  return cachedInsights || getDefaultInsights();
}

/**
 * Force an immediate analysis (async).
 * @param {object} user
 * @param {object} profile
 * @returns {Promise<object>}
 */
export async function refreshNow(user, profile) {
  if (!user || !profile) return cachedInsights || getDefaultInsights();
  return await runAnalysis(user, profile);
}
