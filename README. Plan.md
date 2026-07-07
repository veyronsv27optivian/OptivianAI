# Optivian AI
**By Team Veronyx**

---

## Short Description

**Optivian AI** is a **Google-powered connected AI manager** in the **Decision Intelligence** domain. It helps individuals and teams launch products, programs, services, campaigns, events, businesses, platforms, online stores, digital products, or startup ideas—from a rough goal to a guided, measurable path toward **launch readiness**.

The user states a basic launch goal. Optivian asks permission to connect useful apps, retrieves relevant information, detects missing details, builds a roadmap, supports **group collaboration**, analyzes risks, tracks progress, displays a **3D / 360° journey**, and delivers final advisor recommendations.

**Project type:** Connected AI Manager / AI-powered launch advisor platform

---

## Problem Statement

Users and teams often struggle when launching something new:

- **Scattered information** across docs, sheets, email, and chat  
- **Missing details** that block good decisions  
- **Unclear planning** without a structured roadmap  
- **Hidden launch risks** discovered too late  
- **Weak progress tracking** across milestones  
- **Poor team coordination** when multiple people own pieces of the launch  
- **Decisions made without proper guidance**—guesswork instead of intelligence  

---

## Solution

Optivian AI acts as an **autonomous connected AI manager**—not just a chatbot. It orchestrates **18 professional AI agents** that analyze, score, recommend, and report on the launch journey.

Instead of dumping generic advice, Optivian:

1. Understands your goal  
2. Connects only the apps you allow  
3. Surfaces what it found and what is still missing  
4. Builds a roadmap and assigns team work where needed  
5. Scores risk and launch readiness  
6. Shows progress on a premium scroll-based website—including a 3D journey view  
7. Delivers a clear final recommendation for you and your team  

---

## Core Website Experience

The Optivian website is a **premium scroll-based interactive experience**—not a normal static site or a basic admin dashboard. As the user scrolls, they see how Optivian works end to end.

```text
Landing page
  → Start journey
  → Group project setup
  → Connect apps
  → AI discovery
  → Missing information
  → Roadmap
  → Dashboard
  → 3D journey
  → Final recommendation
```

See [docs/frontend-plan.md](docs/frontend-plan.md) for the full UI plan.

---

## Key Features

Optivian AI includes **18 features**:

| # | Feature |
|---|---------|
| 1 | AI Business Advisor |
| 2 | Requirement Analyzer |
| 3 | Missing Information Guide |
| 4 | Decision Simulation Engine |
| 5 | Interactive GUI |
| 6 | 3D / 360° Visual Viewer |
| 7 | Risk Detection System |
| 8 | Risk Heatmap |
| 9 | Launch Readiness Score |
| 10 | Project Journey Tracking |
| 11 | AI Recommendation System |
| 12 | Dashboard Analytics |
| 13 | Document-Based Input |
| 14 | Google Tool Integration |
| 15 | Final Report Generation |
| 16 | AI Automated Workflow |
| 17 | Autonomous Connected Manager Mode |
| 18 | **Group Projects & Team Collaboration** |

Details: [docs/features.md](docs/features.md)

---

## 18-Agent Architecture

Each feature is handled by a **professional specialized agent**. The **Chief Manager Agent** coordinates all agents and presents a unified experience to the user.

| Agent | Role (summary) |
|-------|----------------|
| Chief Manager Agent | Orchestrates the full launch journey |
| Business Strategy Agent | Market, GTM, and strategy |
| Requirement Analyst Agent | Requirements and scope |
| Information Gap Agent | Missing information detection |
| Decision Simulation Agent | Scenario and trade-off analysis |
| Interface Intelligence Agent | Dashboard UX structure |
| Spatial Visualization Agent | 3D / 360° journey mapping |
| Risk Intelligence Agent | Risk identification and scoring |
| Risk Mapping Agent | Risk heatmaps and visual maps |
| Launch Readiness Agent | Launch Readiness Score (0–100) |
| Journey Operations Agent | Roadmap and milestone tracking |
| Recommendation Strategist Agent | Prioritized recommendations |
| Analytics Intelligence Agent | KPIs and dashboard analytics |
| Document Intelligence Agent | Insights from connected documents |
| Integration Agent | App connections and data sync |
| Executive Report Agent | Stakeholder-ready reports |
| Workflow Automation Agent | Automated agent pipelines |
| **Team Collaboration Agent** | Group projects, roles, tasks, team progress |

Prompts: [ai-prompts/](ai-prompts/) · Registry: [ai-prompts/agents-list.md](ai-prompts/agents-list.md)

---

## Group Projects & Team Collaboration

**Feature 18** lets users work as a team on one launch:

- Create **group projects** and invite members  
- Assign **roles** (e.g. Founder, Designer, Developer, Marketing Lead)  
- Distribute **tasks** and track completion  
- View **team progress** and **activity logs**  
- Receive **AI recommendations** for the whole team—not just one user  

Backed by Supabase tables: `project_members`, `team_tasks`, `team_activity_logs`. See [supabase/schema-plan.md](supabase/schema-plan.md).

---

## Google-First Tool Ecosystem

| Tool | Role in Optivian |
|------|------------------|
| **Google AI Studio** | Primary place to test agents and prepare **Gemini** behavior |
| **Gemini API** | Main AI brain for agent reasoning |
| **Google Stitch** | UI design for the scroll-based website |
| **Google Opal** | AI workflow prototyping |
| **Google Colab** | Risk / readiness logic testing and experiments |
| **Firebase** | Google backend, hosting, and storage—**future** production path |
| **Vertex AI** | **Future** enterprise scaling and governed deployment |
| **Google Drive / Workspace APIs** | Permission-based document and sheet retrieval |
| **Google Antigravity** | AI-assisted coding and agent development support |

Details: [docs/google-ecosystem.md](docs/google-ecosystem.md)

---

## Supporting Tools

**Frontend / UI:** React · Tailwind CSS · Recharts · Spline Free · Three.js  

**Backend / data:** Supabase (MVP database)  

**Collaboration & docs:** GitHub · GitHub Desktop · Google Docs · Google Slides · diagrams.net  

**Development:** Cursor · Freebuff  

Full list: [docs/tools-used.md](docs/tools-used.md)

---

## MVP Flow

```text
User gives launch goal
  → Group project can be created
  → Team members can be added
  → Optivian asks permission to connect apps
  → Useful data is retrieved
  → Missing information is detected
  → Roadmap is created
  → Tasks can be assigned
  → Risks and launch readiness are calculated
  → Dashboard and 3D/360° journey are displayed
  → Final AI recommendation is generated
```

**MVP approach:** The first version uses **sample / mock data** and a **clickable scroll prototype**. Real **Supabase**, **Gemini API**, and **Google Workspace** integrations will be connected in later phases—not everything is fully built yet.

Data flow: [docs/backend-flow.md](docs/backend-flow.md)

---

## Repository Structure

| Folder | Purpose |
|--------|---------|
| `docs/` | Project documentation (features, Google ecosystem, frontend plan, backend flow) |
| `ai-prompts/` | Professional agent prompts (18 agents) |
| `supabase/` | Database schema plan and future sample data |
| `ui-designs/` | UI prototypes and screenshots |
| `frontend/` | Future React + Tailwind scroll-based website |
| `assets/` | Logos, visuals, and 3D-related assets |

---

## Current Status

Optivian AI is in the **planning and foundation phase**:

- Documentation (features, tools, Google ecosystem, frontend plan, backend flow)  
- Supabase schema plan (11 tables, including team collaboration)  
- 18 professional agent prompts  
- Group collaboration feature planning  
- UI prototype planning (Google Stitch → React)  

The **interactive website prototype** and **live API integrations** are next. This repository documents the architecture and prepares the build—it does not yet represent a finished production product.

---

## Team

**Team Veronyx** · **Domain:** Decision Intelligence · **Project:** Optivian AI
