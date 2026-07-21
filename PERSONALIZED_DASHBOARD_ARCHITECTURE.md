# Personalized, Role-Aware Dashboard System for OptivianAI

> **Document Status:** Initial Audit Complete
> **Target:** Transform the current identical-for-all dashboard into a personalized, role-aware, permission-gated workspace with role-specific AI feature access.
> **Last Updated:** July 21, 2026

---

## Table of Contents

1. [Current Dashboard Architecture](#1-current-dashboard-architecture)
2. [Why the Dashboard Is Currently Identical](#2-why-the-dashboard-is-currently-identical)
3. [Existing User/Role/Permission Structure](#3-existing-userrolepermission-structure)
4. [Existing Data Available for Personalization](#4-existing-data-available-for-personalization)
5. [Existing AI Feature Exposure Model](#5-existing-ai-feature-exposure-model)
6. [Which Roles Should Not Have AI Access](#6-which-roles-should-not-have-ai-access)
7. [Required Database Changes](#7-required-database-changes)
8. [Required Frontend Changes](#8-required-frontend-changes)
9. [Sidebar AI Behavior](#9-sidebar-ai-behavior)
10. [Security Implications](#10-security-implications)
11. [Implementation Phases](#11-implementation-phases)

---

## 1. Current Dashboard Architecture

### File Structure

```
src/pages/Dashboard/
├── Dashboard.jsx              ← Main dashboard (single component for all users)
├── DashboardCharts.jsx        ← Chart utilities
├── DashboardCustomizer.jsx    ← Widget visibility toggles
├── Skeleton.jsx               ← Loading skeletons
├── AnimatedCounter.jsx        ← Number animation utility
├── ExecutiveStats.jsx         ← KPI cards (all users see same)
├── ExecutiveCommandCenter.jsx ← Admin/executive command center
├── DepartmentCommandCenter.jsx← Department-level view
├── AdvancedAnalytics.jsx      ← Charts & analytics
├── AIPanel.jsx                ← AI Executive Advisor insights
├── AIDashboard.jsx            ← AI tool shortcuts
├── OrgOverview.jsx            ← Organization summary
├── StaffOverview.jsx          ← Staff activity cards
├── TaskCenter.jsx             ← Task summary
├── NotificationCenter.jsx     ← Notification list
├── QuickActions.jsx           ← Role-agnostic action buttons
├── CalendarWidget.jsx         ← Upcoming deadlines
├── DynamicWidgetEngine.jsx    ← Widget engine (Phase C4)
├── AutonomousAIManager.jsx    ← AI management (admin)
└── NotificationPreferences.jsx← Notification settings
```

### How the Dashboard Currently Works

The main `Dashboard.jsx` component uses a `dashboardConfig` memo that categorizes users into three coarse buckets:

```javascript
const dashboardConfig = useMemo(() => {
  const isAdmin = ['super_admin', 'owner', 'administrator'].includes(userRole);
  const isExecutive = ['executive', 'director', 'manager'].includes(userRole) || isAdmin;
  const isStaff = ['staff', 'intern', 'support'].includes(userRole);

  if (isExecutive || isAdmin) {
    return { showExecutiveStats: true, showAdvancedAnalytics: true, showOrgOverview: true, showStaffOverview: true, showTaskCenter: true, showCalendar: true, showNotifications: true, showAIDashboard: true, showAIPanel: true, showQuickActions: true };
  }
  if (isStaff) {
    return { showExecutiveStats: true, showAdvancedAnalytics: false, showOrgOverview: true, showStaffOverview: false, showTaskCenter: true, showCalendar: true, showNotifications: true, showAIDashboard: true, showAIPanel: false, showQuickActions: true };
  }
  return { ... similar generic config ... };
}, [userRole, roleInfo]);
```

**Key observations:**
- Only 3 role categories (admin, executive, staff) — no differentiation for designer, developer, analyst, hr, finance, sales, marketing, qa, etc.
- No user-specific task assignment filtering — all tasks are fetched for the entire org
- No department/team-aware data filtering
- AI Panel and AI Dashboard are shown or hidden based on coarse role category — same AI tools for everyone
- No personalized greeting based on time of day, workload, or user name
- The DashboardCustomizer allows hiding widgets but doesn't filter by role
- No "My Tasks" filtering — shows org-wide task stats, not user-specific work
- `StaffOverview` is shown to executive/admin but not to staff members themselves

### Data Fetching Pattern

```
1. Dashboard mounts
2. Fetch ALL tasks for the org (getTasks(user))
3. Fetch ALL notifications for the user
4. Fetch ALL AI analytics
5. Fetch ALL provider info
6. Fetch ALL staff members
7. Fetch online staff count
8. Everything is computed client-side from the full org dataset
```

**Problems:**
- Fetches all org tasks even for staff who only need their own tasks
- No pagination or lazy loading
- 8+ parallel requests on every mount
- Refetches everything every 30 seconds
- Safety timers (8-12s) to prevent infinite loading suggest the system struggles with scale

### Current Layout Structure

```
MainLayout.jsx (persistent shell)
├── Sidebar (role-filtered nav items)
│   ├── Home (/app)
│   ├── Users & Roles (/app/users) [if permission: users:view]
│   ├── Tasks (/app/tasks) [if permission: tasks:view]
│   ├── Chat (/app/chat) [if permission: chat:view]
│   ├── Organization (/app/org) [if permission: organization:view]
│   │   ├── Org Settings
│   │   ├── Analytics
│   │   ├── Structure
│   │   └── Activity
│   ├── Files (/app/files) [if permission: documents:view]
│   └── AI Platform (/app/ai) [if permission: ai:view]
│       ├── AI Settings
│       ├── History
│       ├── Providers
│       ├── AI Manager
│       └── Journey Map 3D
├── Top Bar (search, notifications, health badge, user avatar)
└── <Outlet /> → Dashboard.jsx (or other pages)
```

---

## 2. Why the Dashboard Is Currently Identical

### Root Causes

1. **Single Dashboard Component** — `Dashboard.jsx` renders the same layout for every user. Role differentiation is limited to show/hide of a few sections.

2. **Coarse Role Categorization** — Only 3 categories: admin, executive, staff. Roles like `designer`, `developer`, `analyst`, `finance`, `hr`, `marketing`, `sales`, `operations`, `qa`, `support`, `intern`, `client`, `guest`, `viewer` all fall into "staff" or "other" and see identical content.

3. **No Role-Specific Module Composition** — There is no module registry or composition layer that maps roles to specific dashboard modules. All modules are hardcoded in the JSX.

4. **No User-Specific Data Filtering** — Tasks are fetched for the entire organization, not filtered to the current user's assigned work. Department/team filtering is absent.

5. **No Personalized Greeting** — The dashboard shows a generic title like "Executive Dashboard" without a personalized, time-aware, workload-aware greeting.

6. **No AI Tool Filtering** — The AI Platform page (`AI.jsx`) shows ALL tools to ANY user who can access it. There is no restriction on which AI tools a designer vs developer vs manager should see.

7. **Identical AI Sidebar Navigation** — The sidebar AI section is just hidden or shown based on the `ai:view` permission. When shown, it's the same for everyone.

8. **Activity Tracking Not Used for Dashboard** — While `organization_activity_logs` table exists and tracks events, the dashboard doesn't use activity data to prioritize content.

---

## 3. Existing User/Role/Permission Structure

### Role Hierarchy (23 roles defined)

Source: `src/services/auth/roles.js`

| Rank | Role ID            | Role Hierarchy     |
|------|--------------------|--------------------|
| 100  | `super_admin`      | Unrestricted access|
| 95   | `owner`            | Full ownership     |
| 85   | `administrator`    | Full except billing|
| 75   | `director`         | Strategic teams    |
| 70   | `executive`        | Strategic oversight|
| 60   | `manager`          | Operational lead   |
| 55   | `assistant_manager`| Supports mgmt     |
| 50   | `team_lead`        | Team task mgmt     |
| 45   | `hr`               | People operations  |
| 45   | `finance`          | Financial mgmt     |
| 40   | `marketing`        | Marketing/content  |
| 40   | `sales`            | Sales/CRM          |
| 40   | `operations`       | Workflow mgmt      |
| 35   | `developer`        | Engineering        |
| 35   | `designer`         | Design/creative    |
| 35   | `qa`               | Quality assurance  |
| 30   | `support`          | Customer support   |
| 25   | `staff`            | Regular employee   |
| 20   | `intern`           | Temporary member   |
| 15   | `client`           | External client    |
| 10   | `guest`            | Limited guest      |
| 5    | `viewer`           | Read-only          |

### Permission System

Source: `src/services/auth/permissions.js`

Resources: `users`, `tasks`, `chat`, `ai`, `reports`, `dashboard`, `analytics`, `organization`, `billing`, `settings`, `documents`, `notifications`, `audit_logs`

Actions per resource: `view`, `create`, `edit`, `delete`, `manage` (manage implies all lower actions)

**AI Resource Permissions (key findings):**

| Role       | AI Permission    |
|------------|------------------|
| super_admin| `manage`         |
| owner      | `manage`         |
| administrator| `manage`       |
| director   | `view`, `create` |
| executive  | `view`, `create` |
| manager    | `view`, `create` |
| asst_mgr   | `view`           |
| team_lead  | `view`           |
| hr         | `view`           |
| finance    | `view`           |
| marketing  | `view`, `create` |
| sales      | `view`           |
| operations | `view`           |
| developer  | `view`, `create` |
| designer   | `view`, `create` |
| qa         | `view`           |
| support    | `view`           |
| staff      | `view`           |
| intern     | `view`           |
| **client** | **NO ACCESS**    |
| **guest**  | **NO ACCESS**    |
| **viewer** | `view`           |

### Role Aliases

```javascript
const ROLE_ALIASES = { admin: 'administrator' };
```

### Helper Functions

- `hasPermission(role, resource, action)` — Check single permission
- `hasAnyPermission(role, resource, ...actions)` — Check any
- `hasAllPermissions(role, resource, ...actions)` — Check all
- `getPermissions(role)` — Get full permission object
- `getRolesWithPermission(resource, action)` — Get roles with a permission
- `getRoleInfo(roleId)` — Get display info (label, color, rank)

### Where Roles Are Stored

- **Primary:** `profiles.role` column in Supabase (set on user creation via trigger)
- **Fallback:** `user.user_metadata.role` in the auth session
- **Default:** `'staff'` if no role is set

---

## 4. Existing Data Available for Personalization

### User Identity Data

| Table/Field               | Description                          |
|---------------------------|--------------------------------------|
| `profiles.id`             | Unique profile ID                    |
| `profiles.user_id`        | Links to `auth.users.id`            |
| `profiles.email`          | User email                           |
| `profiles.full_name`      | Display name                         |
| `profiles.avatar_url`     | Profile picture                      |
| `profiles.role`           | Current role (string-based)          |
| `profiles.organization_id`| Belongs-to organization              |
| `profiles.department_id`  | Department assignment                |
| `profiles.team_id`        | Team assignment                      |
| `profiles.phone`          | Contact number                       |
| `profiles.designation`    | Job title                            |
| `profiles.skills`         | JSON array of skills                 |
| `profiles.preferences`    | JSONB — currently stores UI prefs    |
| `profiles.last_seen`      | Last activity timestamp              |
| `profiles.last_login`     | Last login timestamp                 |
| `profiles.is_suspended`   | Suspension flag                      |
| `profiles.is_active`      | Active status                        |
| `profiles.employment_type`| full_time, part_time, contract, etc.|
| `profiles.performance_score`| Numeric performance metric         |
| `profiles.employee_id`    | Company employee identifier          |
| `profiles.joining_date`   | Start date                           |

### Organization Data

| Table                    | Description                          |
|--------------------------|--------------------------------------|
| `organizations.id`       | Unique org ID                        |
| `organizations.name`     | Organization name                    |
| `organizations.industry` | Industry classification              |
| `organizations.company_size`| Number of employees              |
| `organizations.settings` | JSONB — configurable org settings    |
| `organizations.timezone` | Org timezone                         |
| `organization_branches`  | Branch offices (multi-location)      |
| `organization_departments`| Departments with hierarchy          |
| `organization_teams`     | Teams within departments             |

### Task & Project Data

| Table/Field               | Description                          |
|---------------------------|--------------------------------------|
| `tasks.id`                | Unique task ID                       |
| `tasks.organization_id`   | Org ownership                         |
| `tasks.assignee`          | User assigned (profile ID)           |
| `tasks.status`            | pending, in_progress, done, etc.     |
| `tasks.priority`          | urgent, high, medium, low            |
| `tasks.due_date`          | Deadline                             |
| `tasks.created_by`        | Creator profile ID                   |
| `tasks.project_id`        | Optional project association          |
| `tasks.title`             | Task title                           |
| `tasks.description`       | Task body                            |

### Activity Data

| Table                        | Description                          |
|------------------------------|--------------------------------------|
| `organization_activity_logs` | Org-wide event log                   |
| `organization_activity_logs.actor_id` | Who performed the action      |
| `organization_activity_logs.action` | Action type (e.g. TASK_CREATED)|
| `organization_activity_logs.resource_type`| What was affected       |
| `organization_activity_logs.resource_id`  | Specific item ID         |
| `organization_activity_logs.details` | JSONB with context                |
| `organization_activity_logs.severity` | info, warning, error, critical  |

### AI Usage Data

| Table                        | Description                          |
|------------------------------|--------------------------------------|
| `ai_request_logs`            | Every AI request logged              |
| `ai_request_logs.feature`    | Which AI tool was used               |
| `ai_request_logs.user_id`    | Which user made the request          |
| `ai_request_logs.organization_id` | Org context                     |
| `ai_request_logs.provider`   | Which provider was used              |
| `ai_request_logs.model`      | Which model was used                 |
| `ai_request_logs.token_usage`| Token consumption                    |
| `conversation_memory`        | Session-based conversation history   |
| `conversation_memory.profile_id` | User profile ID                |
| `ai_analyses`                | Saved analysis results               |
| `ai_analyses.type`           | Analysis type (tool type)            |
| `ai_analyses.created_by`     | Who created the analysis             |

### Existing Data Summary

**The system already has rich data for personalization:**
- ✅ Full user profiles with roles, departments, teams
- ✅ Organizations with branches, departments, teams hierarchy
- ✅ Tasks with assignees, statuses, priorities, deadlines
- ✅ Activity tracking (org activity logs)
- ✅ AI usage tracking (feature-level)
- ✅ User preferences (JSONB field)
- ✅ Role-based permissions (RBAC)
- ✅ Role hierarchy with ranking

**Missing for full personalization:**
- ❌ Organization-level AI support toggle (enable/disable AI for specific roles)
- ❌ Per-role AI feature mapping (which tools each role should see)
- ❌ User-specific dashboard preferences persistence (beyond widget visibility)
- ❌ Activity-based dashboard priority scoring
- ❌ "My Tasks" filter vs "All Tasks" filter
- ❌ Department/team-aware task views

---

## 5. Existing AI Feature Exposure Model

### Current Architecture

```
AI.jsx (accessible via /app/ai)
├── 9 tool categories (all shown to all users)
│   ├── Advisory & Strategy (5 tools)
│   ├── Analysis & Research (6 tools)
│   ├── Planning & Forecasting (4 tools)
│   ├── Business Functions (6 tools)
│   ├── Content Creation (7 tools)
│   ├── Document & File Analysis (8 tools)
│   ├── Web & Media Analysis (3 tools)
│   ├── Role-Specific AI (9 tools)
│   └── AI Orchestration (6 tools)
├── 10 subpages (Settings, History, Providers, etc.)
└── Tool view with streaming chat UI
```

### Key Problems

1. **No role-based tool filtering** — A designer sees SWOT analysis, financial forecast, contract analyzer, and all other tools. A developer sees marketing strategy tools.

2. **All categories always expanded** — Users see the full tool library regardless of relevance.

3. **Role-Specific AI category exists but is not enforced** — Tools like "Executive AI", "Manager AI", "Employee AI", "Finance AI", "HR AI", "Marketing AI", "Sales AI", "Operations AI", "Technical AI" are labeled as role-specific but are exposed to ALL users regardless of their role.

4. **No AI support toggle per role** — Currently the only gate is the `ai` resource permission in the RBAC system: Client and Guest have no AI access; Viewer has view-only; all others have view+create. There is no organization-level configuration to enable/disable AI for specific roles like Intern, Support, or QA.

5. **Sidebar AI is a main nav item** — AI Platform appears as a primary navigation item with a submenu for Settings, History, Providers, etc. There is no concept of "hidden AI" for users without AI support, and no sidebar-only dropdown pattern.

6. **Dashboard AI Panel is role-agnostic** — The AIPanel and AIDashboard components show the same AI tools and insights regardless of whether the user is a designer, developer, manager, or analyst.

### AI Tool Registry

Source: `src/services/ai/config.js`

The `AI_TOOL_REGISTRY` object defines each tool with:
- `id` — Tool type identifier
- `label` — Display name
- `description` — Short explanation
- `requiredCapabilities` — ['text'] and/or ['vision']

### Role-Specific AI Tools Already Defined

These tools exist but are NOT currently gated by role:
- `EXECUTIVE_AI` → Should only be available to super_admin, owner, administrator, executive, director
- `MANAGER_AI` → Should only be available to manager, assistant_manager, team_lead
- `EMPLOYEE_AI` → Available to most roles
- `FINANCE_AI` → Should only be available to finance, administrator
- `HR_SPECIFIC_AI` → Should only be available to hr, administrator
- `MARKETING_SPECIFIC_AI` → Should only be available to marketing, administrator
- `SALES_SPECIFIC_AI` → Should only be available to sales, administrator
- `OPERATIONS_AI` → Should only be available to operations, administrator
- `TECHNICAL_AI` → Should only be available to developer, administrator

---

## 6. Which Roles Should Not Have AI Access

### Current State vs Desired State

| Role       | Current AI Access | Desired Default AI Access | Notes                          |
|------------|-------------------|---------------------------|--------------------------------|
| super_admin| ✅ Full           | ✅ Full                   |                                 |
| owner      | ✅ Full           | ✅ Full                   |                                 |
| administrator| ✅ Full         | ✅ Full                   |                                 |
| director   | ✅ View+Create    | ✅ View+Create            |                                 |
| executive  | ✅ View+Create    | ✅ View+Create            |                                 |
| manager    | ✅ View+Create    | ✅ View+Create            |                                 |
| asst_mgr   | ✅ View           | ✅ View                   |                                 |
| team_lead  | ✅ View           | ✅ View                   |                                 |
| hr         | ✅ View           | ✅ View                   |                                 |
| finance    | ✅ View           | ✅ View                   |                                 |
| marketing  | ✅ View+Create    | ✅ View+Create            |                                 |
| sales      | ✅ View           | ✅ View                   |                                 |
| operations | ✅ View           | ✅ View                   |                                 |
| developer  | ✅ View+Create    | ✅ View+Create            |                                 |
| designer   | ✅ View+Create    | ✅ View+Create            |                                 |
| **qa**     | ✅ View           | ❌ Disabled by default    | Org must explicitly enable      |
| **support**| ✅ View           | ❌ Disabled by default    | Org must explicitly enable      |
| staff      | ✅ View           | ✅ View (basic only)      | Limited tool set                |
| **intern** | ✅ View           | ❌ Disabled by default    | Org must explicitly enable      |
| **client** | ❌ No access       | ❌ Disabled by default    | No AI access                    |
| **guest**  | ❌ No access       | ❌ Disabled by default    | No AI access                    |
| **viewer** | ✅ View           | ❌ Disabled by default    | Read-only, no AI needed         |

### Rules for AI Access

1. **Guest, Client, Viewer** — No AI access by default. AI sidebar hidden. All AI tools hidden.
2. **Intern, Support, QA** — No AI access by default. AI sidebar hidden. AI tools hidden. Organization can explicitly enable AI support.
3. **Staff** — Basic AI access (view only, limited tool set relevant to general employees like Employee AI, Document Analyzer, Meeting Notes).
4. **All other roles** — AI access enabled with role-specific tool filtering.

### Organization-Level AI Support Toggle

A new column `ai_enabled_roles` or `ai_settings` should be added to `organizations.settings` JSONB to allow organization administrators to:

1. Enable AI for roles that are disabled by default (intern, support, qa)
2. Select which AI tools are available for each role
3. Override default tool sets

---

## 7. Required Database Changes

### 7.1 Organization AI Settings

Add AI configuration to `organizations.settings` JSONB:

```json
{
  "ai": {
    "enable_for_roles": {
      "intern": false,
      "support": false,
      "qa": false,
      "viewer": false,
      "client": false,
      "guest": false
    },
    "role_tool_overrides": {
      "intern": ["employee_ai", "document_analyzer", "meeting_notes"],
      "support": ["employee_ai", "document_analyzer", "meeting_notes", "email_generator"]
    },
    "default_enabled": true,
    "max_requests_per_user_per_day": 100
  }
}
```

**No new table needed** — the existing `organizations.settings` JSONB field can store this.

### 7.2 AI Feature Catalog (Optional, for granular control)

If per-tool role/permission control is needed beyond the existing RBAC, create:

```sql
CREATE TABLE IF NOT EXISTS ai_feature_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL,                    -- AI_TOOL_TYPES value
  allowed_roles TEXT[] NOT NULL DEFAULT '{}',   -- Roles that can see this tool
  required_permissions TEXT[] DEFAULT '{}',     -- Additional permission checks
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, feature_id)
);
```

**Alternatively**, this mapping can live in application code (see Phase 7).

### 7.3 User Dashboard Preferences

Extend `profiles.preferences` JSONB to store:

```json
{
  "dashboard": {
    "hidden_modules": [],
    "module_order": [],
    "compact_view": false,
    "default_view": "my_tasks"
  },
  "ai": {
    "hidden_tools": [],
    "tool_order": [],
    "sidebar_expanded": true
  }
}
```

No new columns needed — `profiles.preferences` already exists as JSONB.

### 7.4 Index for "My Tasks" Filtering

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
```

---

## 8. Required Frontend Changes

### 8.1 New Files to Create

```
src/
├── services/
│   └── dashboard/
│       ├── index.js                    ← Barrel export
│       ├── dashboardComposer.js        ← Module composition logic
│       ├── dashboardQueries.js         ← Data fetching with filtering
│       ├── aiFeatureAccess.js          ← AI tool filtering by role
│       └── personalizedGreeting.js     ← Time/name/workload-aware greeting
├── components/
│   ├── dashboard/
│   │   ├── GreetingBanner.jsx         ← Personalized greeting
│   │   ├── RoleDashboardFactory.jsx   ← Role-aware dashboard selector
│   │   ├── PrioritySummary.jsx        ← Urgent/overdue/blocked tasks
│   │   ├── MyTasksWidget.jsx          ← User-specific task view
│   │   ├── MyProjectsWidget.jsx       ← User's active projects
│   │   ├── TeamWorkloadWidget.jsx     ← Manager/team-lead view
│   │   ├── ApprovalsWidget.jsx        ← Pending approvals
│   │   ├── ActivityFeedWidget.jsx     ← Recent meaningful activity
│   │   └── RoleSpecificAITools.jsx    ← Role-filtered AI tool panel
│   └── ai/
│       └── AISidebarDropdown.jsx      ← Sidebar-only AI dropdown
├── layouts/
│   └── MainLayout.jsx                 ← MODIFIED: Sidebar AI behavior
└── pages/
    └── Dashboard/
        └── Dashboard.jsx              ← MODIFIED: Personalized version
```

### 8.2 Module Composition Layer

Create a dashboard module registry that maps roles to modules:

```javascript
const DASHBOARD_MODULES = {
  // Module ID → { allowedRoles, requiredPermissions, dataSource, priority, AI features }
  greeting_banner: {
    allowedRoles: '*',  // All authenticated users
    requiredPermissions: { resource: 'dashboard', action: 'view' },
    priority: 100,
  },
  my_tasks: {
    allowedRoles: ['staff', 'intern', 'developer', 'designer', 'manager', 'team_lead', 'support', 'qa', 'hr', 'finance', 'marketing', 'sales', 'operations'],
    requiredPermissions: { resource: 'tasks', action: 'view' },
    dataSource: 'my_assigned_tasks',  // Filtered by current user
    priority: 90,
    allowedAIFeatures: ['employee_ai', 'task_summary'],
  },
  team_workload: {
    allowedRoles: ['manager', 'team_lead', 'director', 'administrator'],
    requiredPermissions: { resource: 'tasks', action: 'view' },
    dataSource: 'team_tasks',
    priority: 80,
    allowedAIFeatures: ['manager_ai', 'workload_analysis'],
  },
  org_health: {
    allowedRoles: ['administrator', 'owner', 'director', 'executive'],
    requiredPermissions: { resource: 'analytics', action: 'view' },
    dataSource: 'org_analytics',
    priority: 70,
    allowedAIFeatures: ['executive_insights', 'org_health_engine'],
  },
  approvals: {
    allowedRoles: ['manager', 'team_lead', 'director', 'administrator'],
    requiredPermissions: { resource: 'tasks', action: 'manage' },
    priority: 60,
  },
  // ... more modules
};
```

### 8.3 Dashboard Data Queries

Create role-aware query functions:

```javascript
// Instead of: getTasks(user) → fetches ALL org tasks
// Use:
getMyTasks(user)              // Tasks where assignee = user
getTeamTasks(user)            // Tasks where team_id = user's team
getDepartmentTasks(user)      // Tasks where department_id = user's dept
getOrgTasks(user)             // All org tasks (admin only)
getOverdueTasks(user)         // Urgent/overdue tasks
getPendingApprovals(user)     // Tasks waiting for user's approval
```

### 8.4 Personalized Greeting Engine

```javascript
function generateGreeting(user, profile, tasks, time) {
  const hour = time.getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = profile?.full_name || user?.email?.split('@')[0] || 'there';
  const dueToday = tasks.filter(t => t.due_date === today && t.status !== 'done');
  const overdue = tasks.filter(t => t.due_date < today && t.status !== 'done');
  const completed = tasks.filter(t => t.status === 'done' && t.completed_at === today);
  const roleLabel = getRoleInfo(profile?.role)?.label;

  // Combine into natural greeting
  let message = `${timeGreeting}, ${name}.`;
  if (dueToday.length > 0) message += ` You have ${dueToday.length} task${dueToday.length > 1 ? 's' : ''} due today.`;
  if (overdue.length > 0) message += ` ${overdue.length} task${overdue.length > 1 ? 's' : ''} ${overdue.length > 1 ? 'are' : 'is'} overdue.`;
  if (completed.length > 0) message += ` You completed ${completed.length} task${completed.length > 1 ? 's' : ''} today.`;
  // ... more context

  return { greeting: timeGreeting, name, message, roleLabel };
}
```

### 8.5 QuickActions Role-Awareness

Modify `QuickActions.jsx` to filter actions based on role:

```javascript
const actionGroups = [
  {
    label: 'Management',
    requiredRole: ['super_admin', 'owner', 'administrator', 'manager', 'director'],
    actions: [ ... ],
  },
  {
    label: 'Tasks & Projects',
    requiredRole: '*',  // All authenticated users
    actions: [ ... ],
  },
  {
    label: 'AI & Analytics',
    requiredPermission: { resource: 'ai', action: 'view' },
    actions: [ ... ],
  },
  // Role-specific action groups
  {
    label: 'Development',
    requiredRole: ['developer'],
    actions: [
      { icon: Code, label: 'My PRs', ... },
      { icon: Bug, label: 'Report Bug', ... },
    ],
  },
  {
    label: 'Design',
    requiredRole: ['designer'],
    actions: [
      { icon: Palette, label: 'My Designs', ... },
      { icon: MessageSquare, label: 'Review Feedback', ... },
    ],
  },
];
```

### 8.6 Dashboard.jsx Architecture Change

The new `Dashboard.jsx` should:

1. **Compose modules** based on user role, permissions, and preferences
2. **Fetch data** specific to the user (not org-wide)
3. **Render modules** in priority order
4. **Display personalized greeting** at the top
5. **Show AI features** only if the user has AI access and the tools are relevant
6. **Fall back gracefully** if no modules match (e.g., guest role → show minimal view)

```javascript
export default function Dashboard() {
  const { user, profile, can } = useAuth();
  const userRole = profile?.role || 'staff';

  // Step 1: Determine available modules
  const availableModules = getModulesForRole(userRole, profile, can);

  // Step 2: Fetch user-specific data efficiently
  const { myTasks, teamTasks, approvals, ...etc } = useDashboardData(userRole);

  // Step 3: Generate personalized greeting
  const greeting = generateGreeting(user, profile, myTasks, new Date());

  // Step 4: Filter AI tools for this user
  const allowedAITools = getAIToolsForRole(userRole, profile);

  return (
    <div>
      <GreetingBanner greeting={greeting} />
      <PrioritySummary tasks={myTasks} />
      {availableModules.map(module => (
        <DashboardModule key={module.id} module={module} data={moduleData[module.id]} />
      ))}
    </div>
  );
}
```

---

## 9. Sidebar AI Behavior

### Current Behavior

```
Sidebar Navigation:
├── Home
├── Users & Roles       [if users:view]
├── Tasks               [if tasks:view]
├── Chat                [if chat:view]
├── Organization        [if organization:view]
│   ├── Org Settings
│   ├── Analytics
│   ├── Structure
│   └── Activity
├── Files               [if documents:view]
├── AI Platform         [if ai:view]             ← Main nav item
│   ├── AI Settings
│   ├── History
│   ├── Providers
│   ├── AI Manager
│   └── Journey Map 3D
↓
Settings (always visible)
Sign Out (always visible)
```

### Desired Behavior

```
Sidebar Navigation:
├── Home
├── My Work             [if tasks:view or projects:view]
├── Users & Roles       [if users:view]
├── Tasks               [if tasks:view]
├── Chat                [if chat:view]
├── Organization        [if organization:view]
├── Files               [if documents:view]
├── AI Assistant        [ONLY if user has AI support]  ← Gated, sidebar-only dropdown
│   ├── (Role-specific tool 1)
│   ├── (Role-specific tool 2)
│   ├── ...
│   ├── AI Settings     [only if user can access]
│   └── AI Providers    [only if user can access]
↓
Settings
AI Settings & AI Providers (NOT as separate top-level items — only inside the AI sidebar dropdown)
Sign Out
```

### Sidebar AI Rules

| Condition                                            | Behavior                                              |
|------------------------------------------------------|-------------------------------------------------------|
| User has NO AI support (guest, client, viewer, intern, support, qa — unless enabled) | AI button hidden entirely                             |
| User has AI support, role has `ai:view` permission   | Show "AI Assistant" button in sidebar                 |
| Click on "AI Assistant" button                       | Expand sidebar dropdown with available tools          |
| User has `ai:view` but NOT `ai:create`               | Show only view-only AI tools                          |
| User has `ai:manage` permission                      | Show all available tools + settings + providers       |

### Sidebar Dropdown Content

The dropdown should be determined by:

1. **User role** → Filter to role-specific tools
2. **User permissions** → Filter by allowed actions
3. **Organization AI config** → Override if org has enabled/disabled specific features
4. **User preferences** → Apply hide/show/ordering preferences

Example for a Developer with AI support:

```
AI Assistant ▼
├── Technical AI          ← Developer-specific tool
├── Code Explanation      ← Developer-specific tool
├── Bug Triage            ← Developer-specific tool
├── Employee AI           ← General tool (available to all)
├── Document Analyzer     ← General tool (available to all)
├── Meeting Notes         ← General tool (available to all)
├── ─────────
├── AI Settings           ← Available to developer (settings:view,edit)
└── AI Providers          ← Available to developer
```

Example for a Designer with AI support:

```
AI Assistant ▼
├── Design Critique       ← Designer-specific tool
├── Creative Brainstorming← Designer-specific tool
├── Copy Refinement       ← Designer-specific tool
├── Brand Analysis        ← Designer-relevant tool
├── AI Brainstorm         ← General tool
├── Meeting Notes         ← General tool
├── ─────────
├── AI Settings           ← Available to designer (settings:view)
└── AI Providers          ← NOT visible (designer can't manage providers)
```

Example for a Guest/Client/Viewer (no AI support):

```
(No AI button in sidebar)
```

### Implementation Considerations

1. The AI sidebar should be a lazy-loaded component to avoid unnecessary rendering
2. The dropdown should NOT appear as a separate page — it should be an inline sidebar expansion
3. When the dropdown is expanded and the page is navigated to `/app/ai`, the full AI page should render with the selected tool pre-loaded
4. AI Settings and AI Providers should NOT be separate top-level sidebar nav items — they only appear inside the AI sidebar dropdown

---

## 10. Security Implications

### Critical Security Principles

1. **Frontend is NOT a security boundary** — The role-based dashboard and AI tool filtering is UX, not security. Row Level Security (RLS) in Supabase remains the actual data access boundary.

2. **AI must never bypass authorization** — The AI may only process data the user is already authorized to access. The AI must not be used to circumvent RLS or access controls.

3. **Role-based AI tool visibility** — Hiding AI tools from certain roles is a UX concern. The real security is in the backend provider calls and data access patterns.

4. **Audit trail** — All AI feature access attempts should be logged in `ai_request_logs` for auditability. The `aiRequestLogs` table already captures: user_id, organization_id, feature, provider, model, success, timestamp.

### RLS Policy Considerations

| Table                    | Current RLS Status                     | Notes                                   |
|--------------------------|----------------------------------------|-----------------------------------------|
| `profiles`               | User sees own, org sees members        | ✅ Adequate for personalization         |
| `tasks`                  | Org-scoped RLS needed                  | Need policy to filter by assignee       |
| `organizations`          | Org members can view                   | ✅ Adequate                             |
| `organization_activity_logs`| Org members can view               | ✅ Adequate                             |
| `ai_request_logs`        | Org members can view                   | ✅ Adequate                             |
| `ai_analyses`            | Org-scoped access                      | ✅ Adequate                             |

### What Currently Prevents Unauthorized Access

1. **Supabase RLS** — All tables have org-scoped RLS policies
2. **Permission system** — `hasPermission()` checks in components and ProtectedRoute
3. **ProtectedRoute** — Guards routes by role and permission
4. **AuthProvider** — Manages session, user, and profile state

### Additional Security Measures Needed

1. **Task access by assignee** — The dashboard must use RLS-compatible queries (filter by `assignee = current_profile_id`) to ensure the user only sees their own tasks, not all org tasks.
2. **AI tool access audit** — Log which AI features each user attempted to access, even if denied.
3. **Organization AI settings** — Ensure the organization-level AI enable/disable configuration cannot be overridden by individual users.

---

## 11. Implementation Phases

### Phase 1: Architecture Audit & Planning (CURRENT)

- ✅ Audit existing dashboard architecture
- ✅ Document roles, permissions, and data sources
- ✅ Identify gaps in current implementation
- ✅ Create this architecture document
- ⬜ Identify exact files to modify/create

**Files to create:** `PERSONALIZED_DASHBOARD_ARCHITECTURE.md` ✅

### Phase 2: Dashboard Composition Model

**Goal:** Create the module registry and composition layer without changing the UI yet.

**Files to create:**
- `src/services/dashboard/dashboardComposer.js` — Module registry and role-aware composition
- `src/services/dashboard/index.js` — Barrel export

**Key deliverables:**
- DASHBOARD_MODULES registry with role/permission mappings
- `getModulesForRole(userRole, permissions)` function
- Module priority sorting
- Module visibility rules

**Estimated effort:** Small (1-2 files, ~200 lines)

### Phase 3: Role & Permission Filtering

**Goal:** Ensure every part of the dashboard respects role and permission boundaries.

**Files to modify:**
- `src/pages/Dashboard/Dashboard.jsx` — Use module composition instead of hardcoded sections
- `src/pages/Dashboard/QuickActions.jsx` — Role-filtered action groups
- `src/components/ui/RecommendationsPanel.jsx` — Role-aware recommendations

**Key deliverables:**
- Dashboard renders only role-authorized modules
- QuickActions filtered by role
- Recommendations respect permission boundaries

**Estimated effort:** Medium (3 files to modify)

### Phase 4: User-Specific Work Modules

**Goal:** Create widgets that show the actual user's work, not org-wide stats.

**Files to create:**
- `src/services/dashboard/dashboardQueries.js` — Filtered data fetching
- `src/components/dashboard/GreetingBanner.jsx` — Personalized greeting
- `src/components/dashboard/PrioritySummary.jsx` — Urgent/overdue tasks
- `src/components/dashboard/MyTasksWidget.jsx` — User's assigned tasks
- `src/components/dashboard/MyProjectsWidget.jsx` — User's projects

**Files to modify:**
- `src/pages/Dashboard/Dashboard.jsx` — Integrate new widgets
- `src/services/taskService.js` — Add `getMyTasks(user)` function

**Key deliverables:**
- Greeting changes per user, time, and workload
- "My Tasks" shows only tasks assigned to the current user
- Priority section shows urgent/overdue items

**Estimated effort:** Large (5 new files, 2 modified)

### Phase 5: Activity-Based Prioritization

**Goal:** Use existing activity tracking to prioritize dashboard content.

**Files to create:**
- `src/services/dashboard/activityPriority.js` — Activity scoring logic

**Files to modify:**
- `src/pages/Dashboard/Dashboard.jsx` — Integrate priority scoring

**Key deliverables:**
- Frequently active projects appear higher
- Recently modified items prioritized
- No personalization from mouse-move or meaningless clicks

**Estimated effort:** Small (1 new file)

### Phase 6: User Preferences Persistence

**Goal:** Allow users to personalize their dashboard layout and have it persist.

**Files to modify:**
- `src/pages/Dashboard/DashboardCustomizer.jsx` — Add preference persistence
- `src/services/AuthContext.jsx` — Expose preferences from profile
- `src/services/organizationService.js` — Preference save/load helpers

**Key deliverables:**
- `profiles.preferences.dashboard` saved on changes
- Module visibility persists across sessions
- Module ordering persists across sessions
- Preferences cannot override security

**Estimated effort:** Medium

### Phase 7: AI Feature Access & Tool Filtering

**Goal:** Define which AI tools each role can access and filter the AI page accordingly.

**Files to create:**
- `src/services/dashboard/aiFeatureAccess.js` — Role-to-tool mapping

**Files to modify:**
- `src/pages/AI/AI.jsx` — Filter tools by role
- `src/services/ai/config.js` — Add role requirements to tool registry
- `src/pages/Dashboard/AIPanel.jsx` — Show role-relevant AI tools
- `src/pages/Dashboard/AIDashboard.jsx` — Show role-relevant AI tools
- `src/pages/Dashboard/QuickActions.jsx` — Show role-relevant AI actions

**Key deliverable:** `AI_FEATURE_ACCESS_MAP`:

```javascript
const AI_FEATURE_ACCESS_MAP = {
  // Tool type → allowed roles
  executive_ai: ['super_admin', 'owner', 'administrator', 'director', 'executive'],
  manager_ai: ['manager', 'assistant_manager', 'team_lead'],
  employee_ai: ['*'],  // All roles with AI access
  finance_ai: ['finance', 'administrator'],
  hr_specific_ai: ['hr', 'administrator'],
  marketing_ai: ['marketing', 'administrator'],
  sales_ai: ['sales', 'administrator'],
  operations_ai: ['operations', 'administrator'],
  technical_ai: ['developer', 'administrator'],
  business_advisor: ['super_admin', 'owner', 'administrator', 'director', 'executive', 'manager'],
  swot_analysis: ['super_admin', 'owner', 'administrator', 'director', 'executive', 'manager', 'marketing'],
  competitor_analysis: ['super_admin', 'owner', 'administrator', 'director', 'executive', 'manager', 'marketing', 'sales'],
  // General tools — available to most roles with AI access
  meeting_notes: ['*'],
  document_analyzer: ['*'],
  email_generator: ['*'],
  resume_analyzer: ['hr', 'administrator'],
  contract_analyzer: ['administrator', 'owner'],
  // ... more categories
};
```

**Roles without AI access by default:**
- `guest` → no tools
- `client` → no tools
- `viewer` → no tools
- `intern` → no tools (unless org enables)
- `support` → no tools (unless org enables)
- `qa` → no tools (unless org enables)

**Tool filtering rules:**
1. If user role has no AI access → all tools hidden, AI sidebar hidden
2. If user role has AI access → show only tools where role is in `allowedRoles`
3. If `allowedRoles` includes `'*'` → tool is available to all roles with AI access
4. Organization-level overrides can add/remove tools for specific roles
5. User preferences can hide but NOT enable tools they don't have access to

**Estimated effort:** Large (1 new file, 4 modified)

### Phase 8: Sidebar AI Visibility & Dropdown

**Goal:** Implement sidebar-only AI dropdown with role-filtered tools.

**Files to create:**
- `src/components/ai/AISidebarDropdown.jsx` — Sidebar AI dropdown component

**Files to modify:**
- `src/layouts/MainLayout.jsx` — Replace AI main nav item with AI sidebar dropdown

**Key deliverables:**
- AI button hidden for users without AI support
- AI button shows sidebar-only dropdown with role-filtered tools
- AI Settings and AI Providers only inside the dropdown
- No empty AI sections
- No disabled-looking AI sections

**Estimated effort:** Large (1 new file, 1 modified)

### Phase 9: Workspace UI & Performance

**Goal:** Optimize dashboard performance and improve the workspace feel.

**Files to modify:**
- `src/pages/Dashboard/Dashboard.jsx` — Add lazy loading, memoization, caching
- `src/layouts/MainLayout.jsx` — Sidebar performance improvements

**Key deliverables:**
- Parallel data fetching with proper caching
- Request deduplication
- Lazy loading for dashboard modules
- No unnecessary re-renders
- No infinite loading states

**Estimated effort:** Medium

### Phase 10: Testing & Regression

**Goal:** Verify all scenarios work correctly.

**Test scenarios:**

| # | Scenario                                              | Expected Result                                         |
|---|-------------------------------------------------------|----------------------------------------------------------|
| 1 | Admin logs in                                         | Sees org health, member management, analytics, admin AI |
| 2 | Manager logs in                                       | Sees team workload, approvals, team AI tools             |
| 3 | Staff logs in                                         | Sees my tasks, deadlines, personal progress, Employee AI |
| 4 | Designer logs in                                      | Sees design tasks, creative AI tools only                |
| 5 | Analyst logs in                                       | Sees reports, analysis AI tools only                     |
| 6 | Developer logs in                                     | Sees tickets, technical AI tools only                    |
| 7 | Guest logs in                                         | No AI in sidebar, limited dashboard                      |
| 8 | Client logs in                                        | No AI in sidebar, limited dashboard                      |
| 9 | Viewer logs in                                        | No AI in sidebar, read-only dashboard                    |
| 10| Intern logs in                                        | No AI in sidebar unless org enables                      |
| 11| Support logs in                                       | No AI in sidebar unless org enables                      |
| 12| QA logs in                                            | No AI in sidebar unless org enables                      |
| 13| Two different users on same system                    | Different dashboards for different roles                 |
| 14| User A cannot see User B's data                       | RLS prevents unauthorized access                         |
| 15| User sees only authorized modules                     | No unauthorized data displayed                           |
| 16| User sees only authorized AI features                 | AI tools filtered by role and permission                 |
| 17| AI button appears only for users with AI support      | Guest/Client/Viewer have no AI button                    |
| 18| AI dropdown shows only available tools                | Role-filtered tool list                                  |
| 19| AI settings inside sidebar dropdown                   | Not separate top-level items                             |
| 20| Changing role changes dashboard                       | Dynamic update on role change                            |
| 21| Changing tasks updates dashboard content              | Real-time task updates                                   |
| 22| Completing task updates state                         | Dashboard reflects completion                            |
| 23| Overdue tasks appear correctly                        | Priority section shows overdue items                     |
| 24| User preferences persist                              | Hidden modules stay hidden across sessions               |
| 25| AI priorities do not expose unauthorized data         | No private data in AI suggestions                        |
| 26| AI tools do not expose unauthorized data              | No private data in AI outputs                            |
| 27| Logout works correctly                                | Session cleared, redirect to login                       |
| 28| Login as second user works correctly                  | New session, new dashboard                               |
| 29| Dashboard does not slow down after navigation         | Performance maintained                                    |
| 30| No duplicate API requests                             | Request deduplication works                              |
| 31| No infinite loading states                            | Loading timeout safety                                   |

**Estimated effort:** Large

---

## Summary of Changes

### Files to Create (10-12 new files)

| File                                              | Phase | Purpose                              |
|---------------------------------------------------|-------|--------------------------------------|
| `src/services/dashboard/index.js`                 | 2     | Barrel export                        |
| `src/services/dashboard/dashboardComposer.js`     | 2     | Module registry & composition        |
| `src/services/dashboard/dashboardQueries.js`      | 4     | Filtered data fetching               |
| `src/services/dashboard/activityPriority.js`      | 5     | Activity scoring                     |
| `src/services/dashboard/aiFeatureAccess.js`       | 7     | AI tool role mapping                 |
| `src/components/dashboard/GreetingBanner.jsx`     | 4     | Personalized greeting                |
| `src/components/dashboard/PrioritySummary.jsx`    | 4     | Urgent/overdue tasks                 |
| `src/components/dashboard/MyTasksWidget.jsx`      | 4     | User's assigned tasks                |
| `src/components/dashboard/MyProjectsWidget.jsx`   | 4     | User's projects                      |
| `src/components/dashboard/TeamWorkloadWidget.jsx` | 4     | Manager/dept view                    |
| `src/components/dashboard/ApprovalsWidget.jsx`    | 4     | Pending approvals                    |
| `src/components/dashboard/ActivityFeedWidget.jsx` | 4     | Recent activity                      |
| `src/components/ai/AISidebarDropdown.jsx`         | 8     | Sidebar AI dropdown                  |

### Files to Modify (10-12 existing files)

| File                                              | Phase | Changes                              |
|---------------------------------------------------|-------|--------------------------------------|
| `src/pages/Dashboard/Dashboard.jsx`               | 3,4,5,6,7,9 | Major refactor to module composition|
| `src/pages/Dashboard/QuickActions.jsx`            | 3,7   | Role-filtered actions                |
| `src/pages/Dashboard/AIPanel.jsx`                 | 7     | Role-filtered AI insights            |
| `src/pages/Dashboard/AIDashboard.jsx`             | 7     | Role-filtered AI tools               |
| `src/pages/AI/AI.jsx`                             | 7     | Role-filtered tool categories        |
| `src/services/ai/config.js`                       | 7     | Add role requirements to tools       |
| `src/services/taskService.js`                     | 4     | Add getMyTasks, getTeamTasks         |
| `src/layouts/MainLayout.jsx`                      | 8     | Sidebar AI dropdown instead of nav   |
| `src/components/ui/RecommendationsPanel.jsx`      | 3     | Role-aware recommendations           |
| `src/services/AuthContext.jsx`                    | 6     | Expose preferences                   |

### Database Changes

| Change                                              | Phase | Type        |
|-----------------------------------------------------|-------|-------------|
| Add AI config to `organizations.settings` JSONB     | 7     | Data only   |
| `ai_feature_access` table (optional)                | 7     | Schema      |
| `idx_tasks_assignee` index                          | 4     | Index       |

---

## Appendix A: Role-Specific Dashboard Module Allocation

| Dashboard Module              | Admin/Owner | Manager | Staff | Designer | Developer | Analyst | Finance | HR | Sales | Marketing | Support | Guest | Client | Viewer | QA | Intern |
|-------------------------------|:-----------:|:-------:|:-----:|:--------:|:---------:|:-------:|:------:|:--:|:-----:|:---------:|:-------:|:-----:|:------:|:------:|:--:|:------:|
| Greeting Banner               | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅      | ✅    | ✅     | ✅     | ✅ | ✅     |
| My Tasks                      |             |         | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅      |       |        |        | ✅ | ✅     |
| Today's Priorities            | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅      |       |        |        | ✅ | ✅     |
| Overdue Tasks                 | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅      |       |        |        | ✅ | ✅     |
| Team Workload                 | ✅          | ✅      |       |          |           |         |        |    |       |           |         |       |        |        |    |        |
| Pending Approvals             | ✅          | ✅      |       |          |           |         |        | ✅ |       |           |         |       |        |        |    |        |
| Org Health                    | ✅          |         |       |          |           |         |        |    |       |           |         |       |        |        |    |        |
| Member Management             | ✅          |         |       |          |           |         |        | ✅ |       |           |         |       |        |        |    |        |
| Security Alerts               | ✅          |         |       |          |           |         |        |    |       |           |         |       |        |        |    |        |
| Usage Analytics               | ✅          |         |       |          |           | ✅      | ✅     |    |       | ✅        |         |       |        |        |    |        |
| Project Status                | ✅          | ✅      |       |          |           |         |        |    |       | ✅        |         |       |        |        |    |        |
| Quick Actions (filtered)      | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅      | ✅    | ✅     | ✅     | ✅ | ✅     |
| AI Executive Advisor          | ✅          | ✅      |       |          |           |         | ✅     |    |       | ✅        |         |       |        |        |    |        |
| AI Strategy Tools             | ✅          | ✅      |       |          |           | ✅      | ✅     |    | ✅    | ✅        |         |       |        |        |    |        |
| Role-Specific AI Tools        | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        |         |       |        |        |    |        |
| Notification Center           | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅      | ✅    | ✅     | ✅     | ✅ | ✅     |
| Calendar/Deadlines            | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅      |       |        |        | ✅ | ✅     |
| Recent Activity               | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅      |       |        |        | ✅ | ✅     |
| Department Overview           | ✅          | ✅      |       |          |           |         |        | ✅ |       |           |         |       |        |        |    |        |

## Appendix B: AI Feature Access by Role

| AI Tool                      | Admin/Owner | Manager | Staff | Designer | Developer | Analyst | Finance | HR | Sales | Marketing | Q/A/Sup/Int | Guest/Client/Viewer |
|------------------------------|:-----------:|:-------:|:-----:|:--------:|:---------:|:-------:|:------:|:--:|:-----:|:---------:|:-----------:|:-------------------:|
| Business Advisor             | ✅          | ✅      |       |          |           | ✅      | ✅     |    | ✅    | ✅        |             |                     |
| SWOT Analysis                | ✅          | ✅      |       |          |           | ✅      | ✅     |    | ✅    | ✅        |             |                     |
| Decision Simulator           | ✅          | ✅      |       |          |           | ✅      | ✅     |    | ✅    | ✅        |             |                     |
| Launch Readiness             | ✅          | ✅      |       |          |           |         |       |    |       | ✅        |             |                     |
| Risk Assessment              | ✅          | ✅      |       |          |           | ✅      | ✅     |    |       |           |             |                     |
| Requirement Analyzer         | ✅          | ✅      |       | ✅       | ✅        |         |       |    |       |           |             |                     |
| Competitor Analysis          | ✅          | ✅      |       |          |           | ✅      |       |    | ✅    | ✅        |             |                     |
| Market Research              | ✅          | ✅      |       |          |           | ✅      |       |    | ✅    | ✅        |             |                     |
| Product Analyzer             | ✅          |          |       | ✅       | ✅        |         |       |    |       |           |             |                     |
| Social Media Analysis        | ✅          |          |       | ✅       |           |         |       |    |       | ✅        |             |                     |
| SEO Analysis                 | ✅          |          |       |          |           |         |       |    |       | ✅        |             |                     |
| Financial Forecast           | ✅          | ✅      |       |          |           | ✅      | ✅     |    |       |           |             |                     |
| Business Plan Generator      | ✅          | ✅      |       |          |           | ✅      | ✅     |    | ✅    |           |             |                     |
| Future Lab                   | ✅          | ✅      |       |          |           | ✅      |       |    |       | ✅        |             |                     |
| Startup Validator            | ✅          |          |       |          |           |         |       |    |       |           |             |                     |
| Marketing Strategy           | ✅          |          |       |          |           |         |       |    |       | ✅        |             |                     |
| Sales Advisor                | ✅          |          |       |          |           |         |       |    | ✅    |           |             |                     |
| Financial Advisor            | ✅          |          |       |          |           |         | ✅     |    |       |           |             |                     |
| HR Advisor                   | ✅          |          |       |          |           |         |       | ✅ |       |           |             |                     |
| Customer Persona             | ✅          | ✅      |       |          |           | ✅      |       |    | ✅    | ✅        |             |                     |
| Brand Analysis               | ✅          |          |       | ✅       |           |         |       |    |       | ✅        |             |                     |
| Email Generator              | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅*         |                     |
| Proposal Generator           | ✅          | ✅      |       |          |           |         |       |    | ✅    |           |             |                     |
| Presentation Generator       | ✅          | ✅      |       | ✅       |           |         |       |    | ✅    | ✅        |             |                     |
| Report Generator             | ✅          | ✅      |       |          |           | ✅      | ✅     | ✅ |       | ✅        |             |                     |
| Pitch Deck Assistant         | ✅          |          |       | ✅       |           |         |       |    |       |           |             |                     |
| AI Brainstorm                | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅*         |                     |
| Meeting Notes                | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅*         |                     |
| Document Analyzer            | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅*         |                     |
| Resume Analyzer              | ✅          | ✅      |       |          |           |         |       | ✅ |       |           |             |                     |
| Contract Analyzer            | ✅          |          |       |          |           |         |       |    |       |           |             |                     |
| Website Analyzer             | ✅          | ✅      |       | ✅       | ✅        | ✅      |       |    |       | ✅        |             |                     |
| YouTube Analyzer             | ✅          | ✅      |       | ✅       |           |         |       |    |       | ✅        |             |                     |
| Executive AI                 | ✅          |          |       |          |           |         |       |    |       |           |             |                     |
| Manager AI                   |             | ✅      |       |          |           |         |       |    |       |           |             |                     |
| Employee AI                  | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅*         |                     |
| Finance AI                   | ✅          |          |       |          |           |         | ✅     |    |       |           |             |                     |
| HR AI                        | ✅          |          |       |          |           |         |       | ✅ |       |           |             |                     |
| Marketing AI                 | ✅          |          |       |          |           |         |       |    |       | ✅        |             |                     |
| Sales AI                     | ✅          |          |       |          |           |         |       |    | ✅    |           |             |                     |
| Operations AI                | ✅          | ✅      |       |          |           |         |       |    |       |           |             |                     |
| Technical AI                 | ✅          |          |       |          | ✅        |         |       |    |       |           |             |                     |
| Org Health Engine            | ✅          | ✅      |       |          |           |         |       |    |       |           |             |                     |
| Cross-Dept Intelligence      | ✅          | ✅      |       |          |           |         |       |    |       |           |             |                     |
| Intelligent Delegation       | ✅          | ✅      |       |          |           |         |       |    |       |           |             |                     |
| Custom Assistant             | ✅          | ✅      | ✅    | ✅       | ✅        | ✅      | ✅     | ✅ | ✅    | ✅        | ✅*         |                     |

> ✅* = Available only if organization explicitly enables AI support for that role.
> Empty cells: The tool is hidden from that role.
> Guest/Client/Viewer: No AI access by default regardless of cell content.

---

## Appendix C: Key Architecture Diagram

```
USER
 │
 ├─ AuthContext (user, session, profile)
 │   │
 │   ├─ profile.role ───────────────────→ RoleInfo (label, rank, color)
 │   ├─ profile.organization_id ─────────→ Org settings & hierarchy
 │   ├─ profile.department_id ───────────→ Department context
 │   ├─ profile.team_id ─────────────────→ Team context
 │   ├─ profile.preferences ─────────────→ User preferences
 │   │
 │   ├─ hasPermission(resource, action) ─→ Permission check
 │
 ├─ Dashboard Composer ──────────────────→ Module list for this user
 │   ├─ DASHBOARD_MODULES registry
 │   ├─ getModulesForRole(role, perms)
 │   └─ Module priority sorting
 │
 ├─ AI Feature Access ───────────────────→ Tool list for this user
 │   ├─ AI_FEATURE_ACCESS_MAP
 │   ├─ getAIToolsForRole(role, perms)
 │   ├─ Org-level AI settings
 │   └─ User AI preferences
 │
 ├─ Dashboard Queries ───────────────────→ Filtered data fetching
 │   ├─ getMyTasks(user)
 │   ├─ getTeamTasks(user)
 │   ├─ getPendingApprovals(user)
 │   └─ getRecentActivity(user)
 │
 ├─ Personalized Greeting ──────────────→ Time + Name + Workload
 │
 ├─ Sidebar AI Dropdown ────────────────→ AI button + role-filtered tools
 │   ├─ Hidden if no AI support
 │   ├─ Dropdown with available tools
 │   └─ AI Settings/Providers inside dropdown only
 │
 └─ RENDERED DASHBOARD
     ├─ Greeting Banner
     ├─ Priority Summary
     ├─ Role-specific modules (ordered by priority)
     ├─ AI Suggestions (if AI support enabled)
     └─ Quick Actions (role-filtered)
```
