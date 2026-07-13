# 🏆 OPTIVIANAI — COMPLETE MASTER WORKFLOW

## Current State → Improved Advisory → Autonomous Execution

---

## 📋 HOW TO READ THIS DOCUMENT

### 3 Sorting Criteria Per Item

| Badge | Necessity | AI Alone? | Current Resource? |
|-------|-----------|-----------|-------------------|
| 🔴 | **Critical** — app is broken or missing without this | 🤖 **AI Alone** — I can do 100% solo | ✅ **Exists** — code/package/service already in project |
| 🟡 | **Important** — significantly improves experience | 🤖+🧑 **Hybrid** — I code it, you do one external step | ⚡ **Needs Install** — need npm package first |
| 🟢 | **Polish** — nice-to-have, makes it shine | 🧑 **Manual** — needs your design input | 🏗️ **Needs Build** — doesn't exist yet, must be created from scratch |
| ⚪ | **Future** — cool idea, not needed yet | | 🔌 **Needs API** — requires external API key/service |

### Workflow Status Legend
| Icon | Meaning |
|------|---------|
| ✅ | Ready — can start immediately |
| ⏳ | Needs prerequisite — must wait for something above it |
| 🧩 | Needs human input — pause for design decision |
| 🔗 | Needs external — requires API key, account, or npm install |

---

# 🗺️ THE MASTER ROADMAP: 4 TRACKS RUNNING IN PARALLEL

```
TIME ────────────────────────────────────────────────────────────────►
│
├── TRACK A: FOUNDATION (Advisory Layer)
│   ├── Phase A1: Critical Fixes .............. 7 items  │ Week 1
│   ├── Phase A2: UI Polish .................. 20 items  │ Week 1-2
│   ├── Phase A3: AI Output Enhancements ..... 9 items   │ Week 2-3
│   └── Phase A4: File Uploads ............... 6 items   │ Week 3-4
│
├── TRACK B: INFRASTRUCTURE (Execution Layer)
│   ├── Phase B1: Action Registry ............ 1 item    │ Week 2
│   ├── Phase B2: Execution Engine ........... 1 item    │ Week 2-3
│   ├── Phase B3: Permission System .......... 1 item    │ Week 3
│   └── Phase B4: Approval Workflows ......... 1 item    │ Week 3-4
│
├── TRACK C: AUTONOMOUS ACTIONS
│   ├── Phase C1: Task Actions ............... 5 items   │ Week 3-4
│   ├── Phase C2: Communication Actions ...... 4 items   │ Week 4-5
│   ├── Phase C3: Admin Actions .............. 3 items   │ Week 5-6
│   └── Phase C4: Proactive Monitoring ....... 3 items   │ Week 6-8
│
└── TRACK D: ENHANCEMENTS & VISION
    ├── Phase D1: Housekeeping ............... 4 items    │ Week 1
    ├── Phase D2: Larger Features ............ 11 items   │ Week 4-6
    ├── Phase D3: Admin/Auth/Security ........ 5 items    │ Week 4-6
    └── Phase D4: Future Vision .............. 12 items   │ Month 3+
```

---

# ⚡ TRACK A: FOUNDATION — Advisory Layer Improvements

## Phase A1: Critical Fixes (Start: Now | Est: ~1 day)

Fix bugs and missing pieces. Everything here blocks user trust in the AI.

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| A1.1 | **Custom Assistant prompt module missing** — tool has UI button but no prompt file → AI gets zero system prompt | 🔴 Critical | 🤖 AI Alone | ✅ Exists | ✅ Ready | Create file `prompts/customAssistant.js` with dynamic system prompt builder. Import already wired in `aiService.js` |
| A1.2 | **Pitch Deck Assistant missing from UI** — prompt & tool class exist but no button in AI.jsx | 🔴 Critical | 🤖 AI Alone | ✅ Exists | ✅ Ready | Add button entry in `AI.jsx` tool grid for Content Creation category |
| A1.3 | **PDF Analyzer — no file upload** — user must paste text manually | 🔴 Critical | 🤖+🧑 Hybrid | ⚡ Needs Install | ⏳ Needs `pdfjs-dist` npm install | User runs `npm install pdfjs-dist` → I code the upload + parsing UI + integration |
| A1.4 | **Word Analyzer — no file upload** | 🔴 Critical | 🤖+🧑 Hybrid | ⚡ Needs Install | ⏳ Needs `mammoth` npm install | Same pattern — install pkg → I build upload + parse |
| A1.5 | **Excel Analyzer — no file upload** | 🔴 Critical | 🤖+🧑 Hybrid | ⚡ Needs Install | ⏳ Needs `xlsx` npm install | Same pattern |
| A1.6 | **CSV Analyzer — no file upload** | 🔴 Critical | 🤖+🧑 Hybrid | ⚡ Needs Install | ⏳ Needs `papaparse` npm install | Same pattern |
| A1.7 | **PowerPoint Analyzer — no file upload** | 🔴 Critical | 🤖+🧑 Hybrid | ⚡ Needs Install | ⏳ Needs `pptxjs` npm install | Same pattern |

### Workflow for Fixing File Analyzers (A1.3 - A1.7)
```
User installs npm package ──► I create UploadFile component ──► I update tool to use 
    (1 terminal cmd)           Shared UI for all 5 tools     real parser instead of textarea
                                    │
                                    ▼
                            Existing aiService.js handles 
                            the AI prompt + response
```

---

## Phase A2: UI Polish (Start: Now | Est: ~2 days)

Make the app feel premium. All doable with what we already have.

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| A2.1 | **Toast notification system** — no feedback after saves/actions | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Create `Toast.jsx` component. Wire into `Settings.jsx`, `Tasks.jsx`, `Chat.jsx` |
| A2.2 | **Loading skeletons on Dashboard** — OrgOverview, CalendarWidget show nothing while loading | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Add Skeleton components to Dashboard sub-components. Skeleton.jsx already exists! |
| A2.3 | **Card hover effects** — subtle lift/shadow on hover | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | Add Tailwind `hover:-translate-y-1 hover:shadow-lg transition-all` to Card.jsx |
| A2.4 | **Smooth sidebar collapse animation** — framer-motion already installed | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | Wrap sidebar in `<AnimatePresence>` + `<motion.div>` |
| A2.5 | **Page transitions** — framer-motion AnimatePresence between routes | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | Wrap `<Routes>` in `<AnimatePresence>` in App.jsx |
| A2.6 | **Dashboard micro-interactions** — button ripples, stat counter animations | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | AnimatedCounter.jsx already exists — expand usage |
| A2.7 | **Executive Stats links** — KPI cards don't link to detail pages | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Add `onClick` + `useNavigate` to KPI cards |
| A2.8 | **Quick Actions expand** — only 3 items, add more | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | Add entries: Create Task, New Chat, AI Analysis, View Reports |
| A2.9 | **Task Center shows updated-at times** — shows created date only | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | Add `updated_at` display alongside `created_at` |
| A2.10 | **Settings save feedback** — no confirmation after profile/password save | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Wire toast on successful save in Settings.jsx |
| A2.11 | **Chat — message reactions (emoji)** | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Add reaction picker on message hover + store in DB/memory |
| A2.12 | **Chat — unread count per conversation** | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Already partially done — badge exists, just polish |
| A2.13 | **Chat — conversation search** — filter by name | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Add search input above conversation list with client-side filter |
| A2.14 | **Chat — message search** — within a conversation | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | Add search bar above messages |
| A2.15 | **Dashboard — clean up whitespace & card shadows** | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | CSS/Tailwind adjustments |
| A2.16 | **Org Overview loading state** — shows nothing while loading | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Add Skeleton loading |
| A2.17 | **Calendar Widget persistence** — resets on page refresh | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Save to localStorage or Supabase |
| A2.18 | **Dashboard — real data charts** — uses Math.random() dummy data | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Query Supabase for real data — recharts already installed |
| A2.19 | **Dark mode toggle** — Tailwind dark: variants ready | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | Add toggle component, persist to localStorage, add dark: variants |
| A2.20 | **Premium font (Inter/Satoshi)** | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | Add `@import` in `index.css` for Google Fonts |

### Workflow for UI Polish
```
For each item:
  Identify affected component(s) ──► Apply Tailwind/framer-motion changes ──► Done
    
Example (Dark Mode):
  Create ThemeContext.jsx ──► Add dark: classes to all components ──► Toggle in Settings
  (reuses existing Tailwind config)
```

---

## Phase A3: AI Output Enhancements (Start: Week 2 | Est: ~3 days)

Make AI tools produce structured visual outputs instead of plain markdown. This is what builds trust before autonomous execution.

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| A3.1 | **SWOT Analysis — Render 4-quadrant grid** | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Create `SwotGrid.jsx` component. Parse AI output for Strengths/Weaknesses/Opportunities/Threats. Render as 2×2 grid |
| A3.2 | **Risk Assessment — Heatmap matrix** (Probability × Impact) | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Create `RiskHeatmap.jsx`. Parse AI JSON output with risk items. Render as color-coded matrix |
| A3.3 | **Launch Readiness — Radar chart** of 7 dimensions | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Use existing recharts `<RadarChart>`. Parse AI scores for each dimension |
| A3.4 | **Financial Forecast — Visual charts** (cash flow gauge, revenue area chart, P&L bar) | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Use recharts `<AreaChart>`, `<BarChart>`. Create `<Gauge>` component |
| A3.5 | **Decision Simulator — Scenario comparison table** | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Create `ScenarioTable.jsx`. Parse AI scenarios with probability/impact/timeline |
| A3.6 | **Business Advisor — Structured input form** (industry, size, stage, goals) | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Add modal form before chat interface. Pass structured data as prompt context |
| A3.7 | **Competitor Analysis — Comparison table rendering** | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | Create `CompetitorTable.jsx`. Parse AI output for structured competitor data |
| A3.8 | **AI tool usage analytics dashboard** — visualize token costs, popular tools | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | AnalyticsTracker + UsageTracker already track everything. Create a dashboard page |
| A3.9 | **Export AI conversations as PDF** | 🟢 Polish | 🤖 AI Alone | ⚡ Needs Install | ⏳ Needs `html2pdf.js` or `jspdf` | Install pkg → I build export button |

### Workflow for Structured AI Output
```
Tool executes ──► AI returns markdown ──► I add JSON structured output to prompt
                                        ──► Frontend parses JSON ──► Renders visual component

Example (SWOT):
  Prompt instructs AI to return JSON:
  { "strengths": [...], "weaknesses": [...], "opportunities": [...], "threats": [...] }
  
  AIToolView.jsx detects JSON in response ──► SwotGrid.jsx renders 4-quadrant grid
  
  Existing: aiService.js handles the AI call
  Existing: recharts for chart rendering
  New: Visual components per tool (SwotGrid, RiskHeatmap, etc.)
```

---

## Phase A4: File Uploads for Analyzers (Start: Week 3 | Est: ~2 days)

Unblock the 5 file analyzers. These need npm packages installed first.

| # | Item | Necessity | AI Alone? | Resource | Install Step | Status |
|---|------|-----------|-----------|----------|-------------|--------|
| A4.1 | **File upload UI component** — shared across all 5 analyzers | 🟡 Important | 🤖 AI Alone | 🏗️ Needs Build | None | ⏳ Need file analyzer tools working first |
| A4.2 | **PDF Analyzer with pdfjs-dist** | 🔴 Critical | 🤖+🧑 Hybrid | ⚡ Needs Install | `npm install pdfjs-dist` | ⏳ You install → I integrate |
| A4.3 | **Word Analyzer with mammoth** | 🔴 Critical | 🤖+🧑 Hybrid | ⚡ Needs Install | `npm install mammoth` | ⏳ You install → I integrate |
| A4.4 | **Excel Analyzer with xlsx** | 🔴 Critical | 🤖+🧑 Hybrid | ⚡ Needs Install | `npm install xlsx` | ⏳ You install → I integrate |
| A4.5 | **CSV Analyzer with papaparse** | 🔴 Critical | 🤖+🧑 Hybrid | ⚡ Needs Install | `npm install papaparse` | ⏳ You install → I integrate |
| A4.6 | **PowerPoint Analyzer with pptxjs** | 🔴 Critical | 🤖+🧑 Hybrid | ⚡ Needs Install | `npm install pptxjs` | ⏳ You install → I integrate |

### Workflow for File Upload
```
                    ┌─► PDF Analyzer (pdfjs-dist)
                    ├─► Word Analyzer (mammoth)
FileDrop.jsx ──► ──┼─► Excel Analyzer (xlsx)
  (shared UI)      ├─► CSV Analyzer (papaparse)
                    └─► PowerPoint Analyzer (pptxjs)
                            │
                            ▼
                    Extract text content ──► Pass to existing AI tool prompt
                            │
                            ▼
                    Existing aiService.js handles the AI call
```

---

# 🏗️ TRACK B: INFRASTRUCTURE — Execution Layer

This is the new architecture needed for autonomous AI execution. These components don't exist yet and must be built.

## Phase B1: Action Registry (Start: Week 2 | Est: ~4 hours)

A registry that maps tool types to executable actions. This is the bridge between "AI says" and "AI does."

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| B1.1 | **Action Registry module** — new file `src/services/ai/actions/actionRegistry.js` | 🟡 Important | 🤖 AI Alone | 🏗️ Needs Build | ✅ Ready | Define schema: `{ toolType, actionName, handler, requiresApproval, rollbackHandler, description }` |

### Workflow
```
New file: src/services/ai/actions/actionRegistry.js

Schema per action:
{
  toolType: 'swot_analysis',       // Which AI tool can trigger this
  actionName: 'create_task',        // What the action is called
  label: 'Create task from findings', // Display text
  handler: createTaskFromSWOT,      // The function that executes
  requiresApproval: true,           // Does user need to approve?
  rollbackHandler: deleteTask,      // How to undo this action
  description: 'Creates a task for each weakness identified in SWOT',
  safetyLevel: 'low'                // 'low' | 'medium' | 'high' | 'critical'
}

Export: { registerAction, getActionsForTool, executeAction }
```

---

## Phase B2: Execution Engine (Start: Week 2 | Est: ~1 day)

The core engine that receives AI intents, validates them, executes them, and reports back.

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| B2.1 | **Execution Engine** — new file `src/services/ai/actions/executionEngine.js` | 🟡 Important | 🤖 AI Alone | 🏗️ Needs Build | ✅ Ready | Orchestrates: intent parsing → validation → permission check → approval → execute → log → report |

### Workflow
```
AI generates text response ──► Execution Engine parses intent
                                      │
                                      ▼
                            Action Registry lookup
                                      │
                          ┌───────────┴───────────┐
                          ▼                       ▼
                    Requires Approval?      Auto-execute allowed?
                          │                       │
                    ┌─────┴─────┐           ┌─────┴─────┐
                    ▼           ▼           ▼           ▼
              Send to user   Reject     Execute     Reject
              for approval                       
                    │                             │
                    ▼                             ▼
              User approves ─────────► Execute Action
                                          │
                                          ▼
                                    Result logged
                                          │
                                          ▼
                                    Rollback available
                                    (one-click undo)
```

---

## Phase B3: AI Permission System (Start: Week 3 | Est: ~4 hours)

Extension of the existing RBAC for AI-specific actions.

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| B3.1 | **AI Permission System** — new file `src/services/ai/actions/aiPermissions.js` | 🟡 Important | 🤖 AI Alone | 🏗️ Needs Build | ✅ Ready | Extends existing `permissions.js` with AI-specific rules |

### Workflow
```
Existing permissions.js ──► New aiPermissions.js
  (human RBAC)                  │
                                ├── Which roles can grant AI which actions
                                ├── Per-action approval requirements
                                ├── Dollar/value limits on financial actions
                                └── Time-based restrictions (e.g., no actions after hours)

Reuses: existing permission check functions (hasPermission, hasAnyPermission)
Reuses: existing role hierarchy (roles.js)
```

---

## Phase B4: Approval Workflow Engine (Start: Week 3 | Est: ~1 day)

State machine that manages the lifecycle of AI-proposed actions.

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| B4.1 | **Approval Workflow** — new files in `src/services/ai/actions/` | 🟡 Important | 🤖 AI Alone | 🏗️ Needs Build | ✅ Ready | State machine: `proposed → pending_approval → approved → executing → completed` |
| B4.2 | **Approval UI components** — notification with approve/reject buttons | 🟡 Important | 🤖 AI Alone | 🏗️ Needs Build | ✅ Ready | New components: `ApprovalNotification.jsx`, `PendingActionsPanel.jsx` |

### Workflow
```
AI proposes: "I found 3 strategic weaknesses. Create tasks for each?"

                    ┌─────────────────────┐
                    │  Pending Actions    │
                    │  ┌───────────────┐  │
                    │  │ SWOT Analysis │  │
                    │  │ → Create 3    │  │
                    │  │   tasks       │  │
                    │  │ [Approve] [X] │  │
                    │  └───────────────┘  │
                    └─────────────────────┘
                              │
                    User clicks Approve ──► Execution Engine runs action
                              │
                              ▼
                    Tasks created ──► Notification: "3 tasks created"
                              │
                              ▼
                    [Undo] available for 30 seconds
```

---

# 🤖 TRACK C: AUTONOMOUS ACTIONS

These are the actual actions the AI can execute. Each one builds on the infrastructure from Track B.

## Phase C1: Task Actions (Start: Week 3 | Est: ~2 days)

The safest, most reversible actions. Tasks can be created, assigned, updated, and deleted.

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| C1.1 | **Create task from AI recommendation** — AI analyzes, then offers to create tasks | 🟡 Important | 🤖 AI Alone | ✅ Exists | ⏳ Needs B1-B4 | `taskService.createTask()` already exists. Just wire to action registry |
| C1.2 | **Assign task to team member** — AI suggests assignee based on skills/workload | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ⏳ Needs B1-B4 | AI reads org chart, suggests best assignee |
| C1.3 | **Update task priority/status** — AI re-prioritizes based on deadlines | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ⏳ Needs B1-B4 | `taskService.updateTask()` already exists |
| C1.4 | **Task deadline monitoring** — AI checks all tasks daily, alerts about approaching deadlines | 🟡 Important | 🤖 AI Alone | ✅ Exists | ⏳ Needs B1-B4 | Scheduled check → notification to assignee |
| C1.5 | **Task completion verification** — AI checks if task output matches requirements | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ⏳ Needs B1-B4 | AI reads task description, compares to completion notes |

### Workflow for Task Actions
```
                           ┌─► Create task ──► taskService.createTask()
                           │
AI identifies action ──► actionRegistry ──┼─► Update task ──► taskService.updateTask()
(Analyzes weaknesses)                     │
                           └─► Assign ──► taskService.updateTask(assignee)

All reuse existing taskService.js
```

---

## Phase C2: Communication Actions (Start: Week 4 | Est: ~2 days)

AI sends messages, notifications, and updates on behalf of users.

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| C2.1 | **Send chat message** — AI sends a message to a conversation | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ⏳ Needs B1-B4 | `chatService.sendMessage()` already exists |
| C2.2 | **Send notification** — AI notifies a user about something | 🟡 Important | 🤖 AI Alone | ✅ Exists | ⏳ Needs B1-B4 | `notificationService.createNotification()` already exists |
| C2.3 | **Share AI analysis result** — AI posts its analysis to a channel/conversation | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ⏳ Needs B1-B4 | Reuses chat service + AI history |
| C2.4 | **Schedule meeting/reminder** — AI creates a calendar entry | ⚪ Future | 🤖+🧑 Hybrid | 🏗️ Needs Build | ⏳ Needs calendar infra | Needs calendar system first |

### Workflow for Communication Actions
```
AI finishes analysis ──► "Should I share this with the team?"
                              │
                      User: "Yes, send to #strategy channel"
                              │
                              ▼
                    chatService.sendMessage(convId, result)
                    notificationService.createNotification(userId, ...)
                    
                    All reuse existing services
```

---

## Phase C3: Admin Actions (Start: Week 5 | Est: ~2 days)

AI handles administrative tasks — carefully gated.

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| C3.1 | **Generate and send report** — AI creates report, emails or shares it | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ⏳ Needs B1-B4 | Reuses report generation tools + chat service |
| C3.2 | **User provisioning suggestions** — AI notices team gaps, suggests new roles | ⚪ Future | 🤖 AI Alone | ✅ Exists | ⏳ Needs B1-B4 | AI analyzes workload, suggests hiring needs |
| C3.3 | **Data cleanup automation** — AI archives old tasks, cleans up stale conversations | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ⏳ Needs B1-B4 | Scheduled cleanup using existing services |

---

## Phase C4: Proactive Monitoring (Start: Week 6 | Est: ~3 days)

The AI doesn't wait to be asked — it watches and acts.

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| C4.1 | **Scheduled health checks** — AI runs daily checks on task completion rates, deadlines, bottlenecks | 🟡 Important | 🤖 AI Alone | 🏗️ Needs Build | ⏳ Needs B1-B4 | New: `src/services/ai/actions/monitoring.js` — scheduled checks using setTimeout or Supabase cron |
| C4.2 | **Proactive recommendations** — AI pushes recommendations based on monitoring | 🟡 Important | 🤖 AI Alone | ✅ Exists | ⏳ Needs C4.1 | Reuses notificationService + existing AI tools |
| C4.3 | **Auto-escalation** — AI escalates overdue tasks to managers | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ⏳ Needs C4.1 | `notificationService.createNotification()` to managers |

### Workflow for Proactive Monitoring
```
┌─────────────────────────────────────────────────────┐
│  Monitoring Engine (runs every X hours)             │
│                                                     │
│  1. Query taskService for overdue tasks              │
│  2. Query analytics for unusual patterns             │
│  3. Run AI analysis on findings                      │
│  4. Generate recommendations                         │
│  5. Push notifications to relevant users             │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  User sees:      │
              │  "3 tasks are    │
              │  overdue.        │
              │  Reassign them?  │
              │  [Yes] [No]      │
              └─────────────────┘
```

---

# 🧹 TRACK D: ENHANCEMENTS & VISION

## Phase D1: Housekeeping (Start: Now | Est: ~2 hours)

Quick cleanup tasks.

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| D1.1 | **Clean up unused config entries** — 7 tool types registered but never built | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | Review config.js, either build or remove |
| D1.2 | **Task migration cleanup** — remove dev-mode migration code | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | Check migrateTasks.js |
| D1.3 | **Consolidate duplicate tool types** — `generate_report` overlaps with `report_generation` | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | Review config.js type definitions |
| D1.4 | **Add missing loading/error states** — some pages lack proper states | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | Audit all pages |

---

## Phase D2: Larger Features (Start: Week 4 | Est: ~4 days)

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| D2.1 | **Template Library for AI prompts** — save & reuse custom prompts | 🟢 Polish | 🤖 AI Alone | 🏗️ Needs Build | ✅ Ready | New Supabase table `prompt_templates` + UI |
| D2.2 | **AI prompt versioning** — track changes to prompts | ⚪ Future | 🤖 AI Alone | 🏗️ Needs Build | ✅ Ready | Version history in DB |
| D2.3 | **AI model comparison** — run same prompt on multiple models side-by-side | ⚪ Future | 🤖 AI Alone | ✅ Exists | ✅ Ready | New UI component + existing provider manager |
| D2.4 | **AI response streaming** — stream tokens with progress | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | `generateStream()` already exists — wire to UI |
| D2.5 | **AI cached response management** — view/clear cache | 🟢 Polish | 🤖 AI Alone | ✅ Exists | ✅ Ready | New admin page — `AiCache.getStats()` exists |
| D2.6 | **Batch document analysis** — upload multiple docs | ⚪ Future | 🤖+🧑 Hybrid | ⏳ Needs A4 | ⏳ Needs file upload first | Needs Phase A4 complete |
| D2.7 | **Custom persona presets for Business Advisor** | 🟢 Polish | 🤖 AI Alone | 🏗️ Needs Build | ✅ Ready | Save persona configs in DB |
| D2.8 | **Website Analyzer — URL fetching** | 🟡 Important | 🤖+🧑 Hybrid | 🔌 Needs API | ⏳ Needs CORS proxy | Need a backend endpoint or CORS proxy |
| D2.9 | **YouTube Analyzer — YouTube API** | 🟡 Important | 🤖+🧑 Hybrid | 🔌 Needs API | ⏳ Needs API key | Need YouTube Data API key |
| D2.10 | **Email notification integration** | 🟡 Important | 🤖+🧑 Hybrid | 🔌 Needs Service | ⏳ Needs SendGrid/Resend | Need email service setup |
| D2.11 | **Social Media Analysis — live API** | ⚪ Future | 🧑 Manual | 🔌 Needs API | ⏳ Needs social API keys | Instagram/Twitter/LinkedIn API approval |

---

## Phase D3: Admin/Auth/Security (Start: Week 4 | Est: ~3 days)

| # | Item | Necessity | AI Alone? | Resource | Status | Workflow |
|---|------|-----------|-----------|----------|--------|----------|
| D3.1 | **Activity / Audit log for admin** | 🟡 Important | 🤖 AI Alone | ✅ Exists | ✅ Ready | `audit_logs` in schema — just populate and build UI |
| D3.2 | **Session timeout / auto-logout** | 🟡 Important | 🤖 AI Alone | 🏗️ Needs Build | ✅ Ready | Configurable timeout in AuthContext |
| D3.3 | **Sessions page** — show active sessions, remote logout | 🟡 Important | 🤖+🧑 Hybrid | 🏗️ Needs Build | ⏳ Needs `sessions` table | New Supabase table + UI |
| D3.4 | **Rate limiting on auth endpoints** | 🟡 Important | 🤖+🧑 Hybrid | 🏗️ Needs Build | ⏳ Needs Supabase | Supabase RLS or edge function |
| D3.5 | **Device fingerprinting for 2FA** | ⚪ Future | 🤖+🧑 Hybrid | 🏗️ Needs Build | ⏳ Needs fingerprint lib | Need fingerprinting library |

---

## Phase D4: Future Vision (Start: Month 3+)

| # | Item | Necessity | AI Alone? | Resource | Status |
|---|------|-----------|-----------|----------|--------|
| D4.1 | **PWA support (offline mode)** | ⚪ Future | 🤖 AI Alone | 🏗️ Needs Build | ⏳ Service worker + manifest |
| D4.2 | **Full-text search across app** | ⚪ Future | 🤖+🧑 Hybrid | 🔌 Needs Service | ⏳ Needs Meilisearch/Elastic |
| D4.3 | **i18n / internationalization** | ⚪ Future | 🧑 Manual | 🏗️ Needs Build | ⏳ Needs language decisions |
| D4.4 | **Accessibility audit (a11y)** | ⚪ Future | 🧑 Manual | 🏗️ Needs Build | ⏳ Needs requirements |
| D4.5 | **Mobile responsive improvements** | 🟢 Polish | 🧑 Manual | 🏗️ Needs Build | ⏳ Needs breakpoint decisions |
| D4.6 | **WebSocket real-time for all updates** | ⚪ Future | 🤖 AI Alone | 🏗️ Needs Build | ⏳ Upgrade from polling |
| D4.7 | **3D journey viewer** (from Plan.md) | ⚪ Future | 🧑 Manual | 🏗️ Needs Build | ⏳ Three.js dev |
| D4.8 | **Google tools integration** | ⚪ Future | 🧑 Manual | 🔌 Needs API | ⏳ Google API setup |
| D4.9 | **Autonomous AI manager** (from Plan.md) | ⚪ Future | 🧑 Manual | 🏗️ Needs Build | ⏳ Needs Tracks B+C first |
| D4.10 | **AI avatar with voice** | ⚪ Future | 🧑 Manual | 🏗️ Needs Build | ⏳ Voice synthesis |
| D4.11 | **Daily digest email** | ⚪ Future | 🤖+🧑 Hybrid | 🔌 Needs Service | ⏳ Needs email service |
| D4.12 | **Task comments / activity log per task** | 🟢 Polish | 🧑 Manual | 🏗️ Needs Build | ⏳ Need design decision |

---

# 🔀 COMPLETE WORKFLOW MAP: ADVISORY → EXECUTION

## How an AI Tool Works Today (Advisory Only)

```
User: "Analyze my business strategy"
        │
        ▼
AIToolView.jsx ──► BusinessAdvisorTool.execute({ context })
        │
        ▼
businessAdvisorTool.buildPrompt() ──► prompt + systemPrompt
        │
        ▼
aiService.generateText('business_advisor', prompt, { systemPrompt })
        │
        ▼
providerManager.withFallback(provider.generateText)
        │
        ▼
AI Provider (Gemini / DeepSeek / Qwen) ──► Text response
        │
        ▼
Result displayed as markdown in chat ──► User reads and... does nothing else
```

## How It Would Work With Execution Layer

```
User: "Analyze my business strategy"
        │
        ▼
AIToolView.jsx ──► BusinessAdvisorTool.execute({ context })
        │
        ├──► aiService.generateText() ──► AI Provider ──► Text response (advisory)
        │
        └──► executionEngine.parseIntent(response)
                    │
                    ▼
          "I found 3 weaknesses. Shall I create tasks?"
                    │
                    ▼
          ┌────────────────────────────────────────┐
          │  UI shows: Analysis + "Create tasks?" │
          │  [Approve] [Modify] [Dismiss]         │
          └────────────────────────────────────────┘
                    │
          User clicks "Approve" ──► executionEngine.execute()
                    │
                    ▼
          actionRegistry.getActionsForTool('swot_analysis')
                    │
                    ├──► action: 'create_task'
                    │       ├── handler: taskService.createTask()
                    │       ├── rollback: taskService.deleteTask()
                    │       └── approval: auto (user already approved)
                    │
                    ▼
          Tasks created ──► notification sent ──► audit logged
                    │
                    ▼
          "3 tasks created. [Undo all]"
```

## Full Data Flow Diagram

```
USER INTERFACE                    SERVICE LAYER                     EXTERNAL
─────────────────                ──────────────                    ────────

┌──────────────┐    execute()    ┌──────────────┐    generateText   ┌──────────┐
│ AIToolView   │ ──────────────► │ BaseTool     │ ────────────────► │ Gemini   │
│ (Chat UI)    │                 │ (subclass)   │                   │ DeepSeek │
└──────┬───────┘                 └──────┬───────┘                   │ Qwen     │
       │                               │                           └──────────┘
       │ executeAction()               │ buildPrompt()
       ▼                               ▼
┌──────────────┐               ┌──────────────┐
│ Execution    │ ◄──────────── │ Action       │
│ Engine       │   lookup      │ Registry     │
└──────┬───────┘               └──────────────┘
       │
       ├──► permission check ──► aiPermissions.js (extends permissions.js)
       ├──► approval check  ──► ApprovalWorkflow (if needed)
       ├──► safety check    ──► safetyConstraints.js
       │
       ▼
┌─────────────────────────────────────────────────┐
│              ACTION HANDLER                      │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ taskService   │  │ chatService  │              │
│  │ .createTask() │  │ .sendMsg()   │              │
│  └──────────────┘  └──────────────┘              │
│                                                  │
│  ┌──────────────┐  ┌──────────────────┐          │
│  │ notification │  │ auditTrail       │          │
│  │ .create()    │  │ .log()           │          │
│  └──────────────┘  └──────────────────┘          │
└─────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│ Result       │
│ "3 tasks     │
│  created"    │
└──────────────┘
```

---

# 📊 CAPABILITIES MATRIX — What Exists vs What's Needed

## Already In Project (Can Reuse Immediately) ✅

| Capability | Where It Lives | What It Does |
|-----------|---------------|--------------|
| AI Text Generation | `aiService.js` | Core generateText with provider fallback |
| Streaming | `aiService.js` → `generateStream()` | Token-by-token streaming |
| Provider Management | `providerManager.js` | 4 providers, auto-fallback |
| Prompt System | `prompts/` (37 modules) | System prompts for every tool |
| Tool Architecture | `tools/_BaseTool.js` | Abstract tool class with execute/executeStream |
| Conversation Memory | `memory/conversationMemory.js` | Session-aware chat history |
| Response Caching | `cache/aiCache.js` | Configurable TTL, LRU eviction |
| Token/Cost Tracking | `usage/usageTracker.js` + `pricing.js` | Usage analytics per model |
| Analytics | `analytics/analyticsTracker.js` | Success/failure tracking |
| Task CRUD | `taskService.js` | Create, read, update, delete, assign |
| Chat Service | `chatService.js` | Send messages, create conversations |
| Notifications | `notificationService.js` | Create, read, mark read |
| RBAC | `permissions.js` | 22 roles × 13 resources × 5 actions |
| Role Hierarchy | `roles.js` | Ranked roles with display info |
| UI Components | `Badge.jsx`, `Card.jsx`, `ProgressBar.jsx`, `Tooltip.jsx` | Reusable UI primitives |
| Charts | recharts (installed) | BarChart, RadarChart, AreaChart, PieChart |
| Animations | framer-motion (installed) | AnimatePresence, motion components |

## Must Be Built (No Existing Code) 🏗️

| Component | Why It Doesn't Exist | Priority |
|-----------|---------------------|----------|
| Action Registry | New concept — maps AI intents to executable functions | High |
| Execution Engine | New concept — orchestrates the execution lifecycle | High |
| AI Permission System | Current RBAC is for humans only | High |
| Approval Workflow | State machine for propose→approve→execute flow | High |
| File Upload Component | Shared UI for file type detection + upload + extraction | High |
| Visual Output Components (SWOT grid, risk heatmap, etc.) | Tool-specific rendering | Medium |
| Monitoring Engine | Scheduled checks for proactive AI | Medium |
| Safety Constraints | Limits on AI actions (rate, scope, cost) | Medium |
| Audit Trail UI | View AI action history | Medium |

## Needs External Setup (API Keys / Accounts) 🔌

| Component | What's Needed | Effort |
|-----------|--------------|--------|
| Website Analyzer — URL fetch | CORS proxy or backend endpoint | Low |
| YouTube Analyzer | YouTube Data API v3 key | Low |
| Email Notifications | SendGrid / Resend account | Medium |
| Social Media Analysis | Instagram/Twitter/LinkedIn API approval | High |
| Full-Text Search | Meilisearch / Elasticsearch / Supabase full-text | Medium |

---

# 🚀 EXECUTION ORDER — WHAT TO DO AND IN WHAT SEQUENCE

## Week 1: Foundation (I can do all of this solo)
```
Phase A1 (Critical Fixes): 
  A1.1 Custom Assistant prompt ──► 20 min
  A1.2 Pitch Deck in UI ──► 10 min

Phase A2 (UI Polish): 
  A2.1-A2.20 All 20 items ──► ~2 days
  (Toast, skeletons, hover effects, sidebar, page transitions, dark mode, etc.)

Phase D1 (Housekeeping): 
  D1.1-D1.4 Clean up config, migrations, states ──► ~2 hours
```

## Week 2: AI Improvements + Execution Infrastructure (I can do all of this solo)
```
Phase A3 (AI Output Enhancements): 
  A3.1 SWOT grid ──► 2 hrs
  A3.2 Risk heatmap ──► 2 hrs
  A3.3 Radar chart ──► 2 hrs
  A3.4 Financial charts ──► 2.5 hrs
  A3.5 Scenario table ──► 1.5 hrs
  A3.6 Business Advisor form ──► 2 hrs
  A3.7-A3.9 Competitor table + analytics dashboard + export ──► 4 hrs

Phase B1 (Action Registry): 
  B1.1 Action registry module ──► 4 hrs

Phase B2 (Execution Engine): 
  B2.1 Execution engine ──► 1 day
```

## Week 3: Permissions + Approvals + Task Actions (I can do all of this solo)
```
Phase B3 (AI Permissions): 
  B3.1 AI permission system ──► 4 hrs

Phase B4 (Approval Workflow): 
  B4.1 Approval state machine ──► 4 hrs
  B4.2 Approval UI components ──► 4 hrs

Phase C1 (Task Actions): 
  C1.1 Create task from recommendation ──► 2 hrs
  C1.2-C1.5 Assign, update, monitor, verify ──► 1 day
```

## Week 4: Communication Actions + File Uploads (Needs you for installs)
```
Phase A4 (File Uploads): 
  You install: pdfjs-dist, mammoth, xlsx, papaparse, pptxjs
  I code: A4.1 FileDrop component + A4.2-A4.6 integrations ──► 2 days

Phase C2 (Communication Actions): 
  C2.1 Send chat message ──► 2 hrs
  C2.2 Send notification ──► 1 hr
  C2.3 Share analysis result ──► 2 hrs

Phase D3 (Admin/Auth): 
  D3.1 Activity audit log ──► 4 hrs
  D3.2 Session timeout ──► 2 hrs
```

## Week 5-6: Proactive Monitoring + Larger Features
```
Phase C4 (Monitoring): 
  C4.1-C4.3 Health checks, proactive recommendations, auto-escalation ──► 3 days

Phase D2 (Larger Features): 
  D2.1 Template library ──► 4 hrs
  D2.4 Response streaming ──► 4 hrs
  D2.5 Cache management UI ──► 2 hrs
  D2.7 Custom persona presets ──► 2 hrs
```

## Month 3+: Vision Features
```
Phase D4: PWA, i18n, mobile, accessibility, 3D viewer, Google tools, etc.
(Only if the core product is solid and users are demanding these)
```

---

# ✅ READY-TO-START CHECKLIST

## Items I Can Start Right Now (No Prerequisites)

| Phase | Items | Est. Time |
|-------|-------|-----------|
| **A1** | Custom Assistant prompt + Pitch Deck UI fix | 30 min |
| **A2** | 20 UI polish items (toast, skeletons, dark mode, hover effects, etc.) | 2 days |
| **A3** | 9 AI output visual enhancements (SWOT grid, heatmap, radar, etc.) | 3 days |
| **B1** | Action Registry | 4 hrs |
| **B2** | Execution Engine | 1 day |
| **B3** | AI Permission System | 4 hrs |
| **B4** | Approval Workflow | 1 day |
| **C1** | Task Actions (create, assign, update, monitor, verify) | 2 days |
| **C2** | Communication Actions (send message, notify, share results) | 1 day |
| **D1** | Housekeeping (cleanup, consolidate, add states) | 2 hrs |
| **D2.1-7** | Template library, streaming, cache UI, persona presets | 2 days |
| **D3.1-2** | Audit log UI, session timeout | 1 day |

**Total: ~14 days of solo work**

## Items That Need You First

| Phase | Items | What I Need From You |
|-------|-------|---------------------|
| **A1.3-7** | File uploads for 5 analyzers | Run `npm install pdfjs-dist mammoth xlsx papaparse pptxjs` (5 commands) |
| **D2.8-9** | Website + YouTube analyzers | CORS proxy URL + YouTube API key |
| **D2.10** | Email notifications | SendGrid/Resend account and API key |
| **A3.9** | PDF export | Run `npm install jspdf html2canvas` |
| **D3.3-4** | Sessions page + rate limiting | Supabase table creation + edge function setup |

---

*This is your complete master workflow. Want me to start on any specific phase?*

---

# 🏢 ENTERPRISE ROLE-BASED OPERATING SYSTEM

## Status: 🔮 Future Vision — Not Yet Implemented

---

## 🎯 Vision

OptivianAI is **not** a chatbot. It is an AI-powered Enterprise Business Operating System where AI acts as an intelligent executive partner capable of managing organizations, assisting leadership, coordinating teams, automating workflows, and supporting employees.

The platform should feel like a unified combination of:

| Product | Role in OptivianAI |
|---------|-------------------|
| **Microsoft Copilot** | AI-powered productivity across all tools |
| **Slack / Microsoft Teams** | Real-time communication & collaboration |
| **ClickUp / Monday.com** | Project & task management |
| **Notion AI** | Knowledge management with AI assistance |
| **Jira** | Issue tracking & development workflows |
| **Salesforce** | CRM & customer intelligence |
| **SAP** | Enterprise resource planning |

Every authenticated user should experience a **completely personalized workspace** depending on their role inside the organization. The application should never feel like one dashboard with hidden widgets. Instead, every role should feel like its own professional software designed specifically for that job.

Changing roles should completely transform:

| Aspect | Transformation |
|--------|---------------|
| Dashboard | Role-specific KPIs, widgets, and data |
| Sidebar / Navigation | Relevant sections only |
| Homepage | Personalized landing experience |
| Quick Actions | Role-appropriate shortcuts |
| AI Assistant | Specialized domain expertise |
| Analytics & Reports | Relevant metrics and views |
| Notifications | Role-scoped alerts |
| Activity Feed | Team/department scope |
| Permissions | Automatic access control |
| Workspace | Layout and tools tailored to role |
| Search | Scoped to relevant data |

---

## 👥 Planned Organization Roles

| # | Role | Domain |
|---|------|--------|
| 1 | **CEO** | Strategy, Leadership, Execution |
| 2 | **COO** | Operations, Process, Coordination |
| 3 | **CFO** | Finance, Budget, Forecasting |
| 4 | **CTO** | Technology, Infrastructure, Security |
| 5 | **CIO** | Information Systems, IT Strategy |
| 6 | **CMO** | Marketing, Brand, Growth |
| 7 | **CHRO** | Human Resources, Culture |
| 8 | **Board Member** | Governance, Oversight |
| 9 | **Founder** | Vision, Product, Strategy |
| 10 | **Director** | Department Leadership |
| 11 | **General Manager** | Business Unit Operations |
| 12 | **Department Manager** | Team Management |
| 13 | **Project Manager** | Project Delivery, Milestones |
| 14 | **Team Lead** | Task Coordination, Reviews |
| 15 | **HR Manager** | Recruitment, Attendance |
| 16 | **Finance Manager** | Expense, Revenue Reporting |
| 17 | **Marketing Manager** | Campaigns, Content |
| 18 | **Sales Manager** | Pipeline, Revenue Targets |
| 19 | **Operations Manager** | Workflow, Resource Allocation |
| 20 | **Customer Support Manager** | Tickets, Satisfaction |
| 21 | **Employee** | Tasks, Productivity, Collaboration |
| 22 | **Intern** | Learning, Assigned Work |
| 23 | **Admin** | Users, Permissions, System |
| 24 | **Super Admin** | Full System Control |

---

## 👔 Role Experiences

### CEO Experience

The CEO should feel like they are running an entire company. Dashboard focuses on **strategy instead of operations**.

**Planned Widgets:**

| Category | Widgets |
|----------|---------|
| Welcome & Summary | Executive Welcome, AI Executive Summary |
| Health Scores | Business Health Score, Company Growth Score |
| Financial | Revenue Overview, Profit Trends, Cash Flow Snapshot |
| Organization | Organization Performance, Department Performance |
| Projects | Active Projects, Critical Projects, Delayed Projects |
| Calendar | Executive Calendar, Upcoming Meetings |
| Risk & Opportunities | Risk Heatmap, Business Opportunities, Market Trends |
| AI Intelligence | AI Strategic Recommendations, Competitor Monitoring, Launch Readiness |
| Activity | Organization Activity, Pending Executive Approvals |
| People | Employee Satisfaction |
| AI Tools | AI Decision Simulator, Business Advisor, Future Lab, Requirement Analyzer |
| Notifications & KPIs | Executive Notifications, Weekly/Monthly/Quarterly KPIs |

**Quick Actions:**
- Launch New Project
- Assign Organization Goal
- Generate Executive Report
- Analyze Business
- Generate Strategy
- View Organization
- View Departments
- AI Consultation

**AI Role:** Virtual Chief Executive Advisor — understands strategy, market dynamics, and organizational health.

---

### COO Experience

**Focus:** Operations, Process Efficiency, Team Coordination, Workflow Bottlenecks, Resource Allocation, Delivery Status, Department Synchronization

**AI Role:** Operations Strategist — identifies bottlenecks, optimizes workflows, coordinates cross-department resources.

Planned widgets include: Operations Dashboard, Process Efficiency Score, Resource Allocation Map, Delivery Timeline, Workflow Visualization, Team Workload Heatmap, Department Sync Status.

---

### CFO Experience

**Focus:** Revenue, Expenses, Budgets, Cash Flow, Financial Forecasting, Cost Optimization, Profit Analysis, Investment Insights, Financial Reports

**AI Role:** AI Financial Advisor — analyzes financial data, forecasts trends, recommends cost optimizations.

Planned widgets include: Revenue vs Expenses Chart, Budget Tracking, Cash Flow Projection, Profit Margin Analysis, Cost Breakdown, Investment Portfolio, Financial Health Score, AI Financial Advisor chat.

---

### CTO Experience

**Focus:** Infrastructure, Security, AI Providers, System Health, API Status, Storage, Databases, Deployment, Performance, Monitoring, Error Logs

**AI Role:** Technical Architect — monitors system health, recommends infrastructure improvements, analyzes security threats.

Planned widgets include: System Health Dashboard, API Latency Monitor, Provider Usage/Status, Error Log Viewer, Deployment Pipeline Status, Database Performance, Storage Usage, Security Alerts.

---

### CMO Experience

**Focus:** Marketing Campaigns, Website Traffic, Social Analytics, Brand Health, Competitor Analysis, Marketing KPIs, AI Content Strategy, Audience Insights

**AI Role:** Marketing Strategist — analyzes campaign performance, recommends content strategies, tracks brand sentiment.

Planned widgets include: Campaign Performance Dashboard, Traffic Analytics, Social Media Metrics, Brand Health Score, Competitor Analysis, Content Calendar, Audience Demographics, SEO Performance.

---

### CHRO / HR Manager Experience

**Focus:** Recruitment, Attendance, Leaves, Employee Directory, Performance Reviews, Hiring Pipeline, Documents, Employee Satisfaction

**AI Role:** HR Assistant — screens candidates, analyzes satisfaction surveys, recommends retention strategies.

Planned widgets include: Recruitment Pipeline, Open Positions, Employee Directory, Attendance Tracker, Leave Balances, Performance Review Status, Satisfaction Survey Results, Document Repository.

---

### Sales Manager Experience

**Focus:** Sales Funnel, Leads, Opportunities, Customers, Revenue Targets, Forecasts, Sales Analytics

**AI Role:** Sales Assistant — scores leads, predicts closings, recommends upsell opportunities.

Planned widgets include: Sales Funnel Visualization, Lead List with Scoring, Opportunity Pipeline, Revenue vs Target, Sales Forecast, Team Performance, Customer Insights, AI Sales Coach.

---

### Project Manager Experience

**Focus:** Projects, Sprint Progress, Milestones, Risks, Dependencies, Team Capacity, Delivery Timeline

**AI Role:** Project Assistant — predicts delays, suggests resource reallocation, automates status reports.

Planned widgets include: Project Portfolio, Sprint Board, Milestone Tracker, Risk Register, Dependency Map, Team Capacity Gauge, Burndown Chart, Timeline View, AI Project Recommendations.

---

### Team Lead Experience

**Focus:** Team Tasks, Workload, Productivity, Meetings, Pending Reviews, Approvals

**AI Role:** Team Coach — suggests task assignments, monitors workload balance, recommends productivity improvements.

Planned widgets include: Team Task Board, Workload Distribution, Productivity Metrics, Pending Reviews, Meeting Schedule, Team Availability, AI Suggestions, Quick Approvals.

---

### Employee Experience

Employees should have a **clean productivity workspace** — never show executive business analytics.

**Dashboard Contains:**
- Today's Tasks
- My Projects
- My Meetings
- Calendar
- Notifications & Messages
- Files & Announcements
- Learning & Personal Progress
- Productivity Score
- Deadlines & Leave Status
- Assigned Goals
- Recent Activity

**Quick Actions:**
- Ask AI
- Complete Task
- Join Meeting
- Upload File
- Send Message
- View Calendar

**AI Role:** Personal Workplace Assistant — helps with tasks, schedules, documents, and collaboration.

---

### Admin Experience

**Focus:** User Management, Roles, Organizations, Permissions, AI Providers, Infrastructure, Security, Logs, API Keys, Database Health, System Monitoring

Developer information should only exist here. Regular employees should never see admin UI.

---

## 🧩 Role-Based User Experience Principles

Every role must have:

| Feature | Per-Role Implementation |
|---------|------------------------|
| Homepage | Completely different landing page |
| Navigation | Sidebar shows only relevant sections |
| Dashboard | Role-specific widgets, charts, KPIs |
| Quick Actions | Tailored shortcuts |
| Reports | Role-appropriate analytics |
| AI Assistant | Specialized domain expertise |
| Notifications | Scoped alerts and updates |
| Permissions | Automatic, role-enforced access control |

The interface should **automatically adapt after login**. No role should accidentally access another role's workspace.

---

## 🤖 AI Role Specialization

| AI Assistant | Specialization |
|-------------|----------------|
| **Executive AI** | Strategy, business health, competitive analysis |
| **Finance AI** | Budgets, forecasts, cost optimization |
| **HR AI** | Recruitment, performance, satisfaction |
| **Marketing AI** | Campaigns, brand, content strategy |
| **Sales AI** | Pipeline, forecasting, lead scoring |
| **Operations AI** | Workflows, resource allocation, processes |
| **Technical AI** | Infrastructure, security, monitoring |
| **Legal AI** | Contracts, compliance, risk |
| **Employee AI** | Tasks, productivity, daily assistance |

Every assistant should understand only the responsibilities of its role.

---

## 🔄 AI Executive Workflow (Future State)

```
CEO sets strategic objective
        │
        ▼
AI Executive understands objective
        │
        ▼
AI analyzes business (current state, resources, risks)
        │
        ▼
AI creates project plan with milestones
        │
        ▼
AI identifies departments involved
        │
        ▼
AI generates tasks with dependencies
        │
        ▼
AI assigns managers & roles
        │
        ▼
Managers review and approve
        │
        ▼
Tasks auto-assigned to employees
        │
        ▼
Employees execute with AI assistance
        │
        ▼
AI monitors progress in real-time
        │
        ▼
AI predicts delays and bottlenecks
        │
        ▼
AI reallocates resources (approval when required)
        │
        ▼
Executive receives automated reports
        │
        ▼
AI generates business insights & recommendations
        │
        ▼
Continuous optimization loop
```

---

## 🧹 Dashboard Cleanup — Remove Technical AI Metrics from Business Dashboards

Business dashboards (CEO, Manager, Employee, HR, Finance, Marketing, Sales, Operations) should **NOT** display developer-focused AI infrastructure metrics.

### ❌ Remove These from Business Dashboards

| Metric | Why Remove |
|--------|-----------|
| AI Tokens / Token Usage | Implementation detail — irrelevant to business outcomes |
| AI Costs | Infrastructure cost — belongs in admin console |
| Response Time / Latency | Technical performance metric — no business value |
| Provider Status / Model Usage | Infrastructure concern — not actionable for business users |
| API Usage / Request Count | Developer metric — clutters business view |
| AI Infrastructure Health | Operations concern — belongs in admin panel |
| AI Logs / Debug Information | Developer tooling — never in business dashboards |

### ✅ Business Dashboards Should Show

| Category | Examples |
|----------|---------|
| Health & Performance | Business Health Score, Organization Health, Employee Productivity |
| Financial | Revenue, Profit, Growth, Costs |
| Projects | Active Projects, Delayed Projects, Department Performance |
| AI Intelligence | Executive AI Summary, AI Recommendations, Risks & Opportunities |
| Strategy | Weekly Goals, Strategic KPIs, Upcoming Decisions |
| Customers | Customer Satisfaction, Retention, Acquisition |

### 🏗️ Infrastructure Console (Role-Restricted)

Technical AI metrics exist **only** in an Infrastructure / Admin Console accessible to:

- **Super Admin** — Full system visibility
- **CTO** — Technical infrastructure oversight
- **Platform Administrator** — Day-to-day operations

These roles see: AI Tokens, AI Cost, Provider Status, AI Models, API Keys, Logs, Request Analytics, Response Time, Latency, Usage Statistics, AI Infrastructure Health, Debug Tools.

---

## ✨ Premium Dashboard Experience (UI Goals)

| Design Element | Goal |
|----------------|------|
| Glassmorphism | Frosted glass cards with backdrop blur |
| Premium SaaS Design | Enterprise-grade visual polish |
| Smooth Animations | framer-motion powered transitions |
| Beautiful Gradients | Premium color schemes |
| Animated Counters | Number roll-up animations |
| Interactive Charts | Recharts with hover/tooltip |
| Heatmaps | Visual data density representation |
| KPI Cards | Animated, clickable metrics |
| Skeleton Loading | Graceful content loading |
| Empty State Illustrations | Contextual empty states |
| Hover Effects | Subtle micro-interactions |
| Responsive Layout | Mobile + desktop adaptive design |
| Dark Mode | Full dark theme support |
| Light Mode | Clean light theme |
| Accessibility | WCAG-compliant design |

---

> **Status:** 🔮 Future Vision — Planned, Not Yet Implemented
> 
> This section represents the long-term enterprise architecture for OptivianAI. 
> It will be built incrementally after the core advisory and execution layers are stable.
