# OptivianAI

**An AI-powered Business Operating System** — a desktop application built with React, Vite, Electron, Tailwind CSS, and Supabase. OptivianAI combines AI advisory capabilities with organization management, team collaboration, task management, internal communication, and advanced role-based access control — all in one unified platform.

> **By Team Veronyx** · **Domain:** Decision Intelligence

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Screenshots](#screenshots-placeholder)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Folder Structure](#folder-structure)
- [Database Schema](#database-schema)
- [Installation Guide](#installation-guide)
- [Environment Variables](#environment-variables)
- [How to Run](#how-to-run)
- [How to Deploy](#how-to-deploy)
- [API Keys Required](#api-keys-required)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Known Issues](#known-issues)

---

## Project Overview

OptivianAI is a **connected AI manager** in the **Decision Intelligence** domain. It helps individuals and teams launch products, programs, services, campaigns, events, businesses, platforms, online stores, digital products, or startup ideas — from a rough goal to a guided, measurable path toward **launch readiness**.

The user states a basic launch goal. OptivianAI asks permission to connect useful apps, retrieves relevant information, detects missing details, builds a roadmap, supports **group collaboration**, analyzes risks, tracks progress, and delivers final advisor recommendations.

The system operates in two modes:
- **Developer Mode** — Uses localStorage-based mock data for rapid development without a live Supabase backend.
- **Production Mode** — Connects to a live Supabase instance with full database, Edge Functions, and authentication.

---

## Features

### 🤖 AI Advisor & Business Intelligence

| Feature | Description |
|---------|-------------|
| **AI Business Advisor** | Acts as a practical advisor through the complete product/program journey |
| **Requirement Analyzer** | Reads user input or documents and detects vague, incomplete, contradictory, or unrealistic requirements |
| **Decision Simulation** | Tests choices like timeline, budget, team size, feature cuts, and launch decisions before execution |
| **Future Lab** | Analyzes business ideas and explores strategic possibilities with AI-driven insights |
| **SWOT Analysis** | Generates comprehensive Strengths, Weaknesses, Opportunities, and Threats analysis |
| **Marketing Strategy** | AI-powered marketing strategy recommendations based on business profile |
| **Competitor Analysis** | Deep competitive landscape analysis with actionable insights |
| **Financial Forecast** | Revenue projections, cost analysis, and financial modeling |
| **Launch Readiness** | Calculates a clear score showing whether the product is ready for launch |
| **Risk Assessment** | Identifies timeline, budget, workload, technical, requirement, and launch-related risks |
| **Report Generator** | Creates comprehensive final reports with risks, decisions, recommendations, and launch status |
| **Pitch Deck Assistant** | Helps structure and refine investor pitch decks |
| **Meeting Notes** | AI-assisted meeting summarization and action item extraction |
| **Document Analyzer** | Extracts insights from uploaded documents and connected sources |
| **Image & Logo Analysis** | Vision-based analysis using multimodal AI (Qwen VL, Gemini Vision) |
| **Social Media Analysis** | Analyzes social media presence and suggests new content strategies |

### 💬 Internal Communication

- **AI Chat** — Conversational AI interface powered by multi-provider support
- **Internal Chat** — Real-time messaging with direct messages and group conversations
- **File Sharing** — Upload and share files within conversations (images, documents, etc.)

### 📋 Task Management

- Task creation, assignment, and status tracking
- Multi-assignee support with per-assignee statuses
- Priority levels (low, medium, high, urgent)
- Status workflow (pending → in_progress → review → done → cancelled)

### 🏢 Organization Management

- Organization creation with business details, website, and social links
- Staff directory with role-based permissions
- Member invitation with temporary passwords
- Role-based access control with 22 predefined roles
- Activity and login history tracking

### 🔐 Advanced Role-Based Access Control (RBAC)

**22 Roles** with granular permission mapping across **13 resources**:

| Role | Level |
|------|-------|
| Super Admin, Owner | Unrestricted system-wide access |
| Administrator | Full access except billing |
| Director, Executive | Strategic management |
| Manager, Assistant Manager, Team Lead | Operational leadership |
| HR, Finance, Marketing, Sales, Operations | Department-specific |
| Developer, Designer, QA | Engineering & creative |
| Support, Staff, Intern | General employees |
| Client, Guest, Viewer | External / read-only |

**Permissions per resource:** View, Create, Edit, Delete, Manage
**Resources:** Users, Tasks, Chat, AI, Reports, Dashboard, Analytics, Organization, Billing, Settings, Documents, Notifications, Audit Logs

### 🔑 Authentication

- **Email + Password** with session persistence
- **Google Login** (OAuth)
- **GitHub Login** (OAuth)

- **Email-based Two-Factor Authentication** — 6-digit OTP sent to email
- **Password Reset** flow with email verification
- **Remember Me** support with extended session duration
- **Temp Password** flow for admin-created accounts
- **Logout Everywhere** (session-scoped sign-out)

### 📊 Notifications & Analytics

- Real-time notification system with read/unread tracking
- AI usage analytics with token and cost tracking
- Login history with IP, provider, device, and success/failure tracking
- Dashboard with stat cards, activity feed, and quick actions

### ⚙️ Supabase Backend

- Complete PostgreSQL schema with 15+ tables
- Row-Level Security (RLS) policies for all tables
- Realtime subscriptions for live updates
- Edge Functions for server-side logic
- Storage buckets for file uploads and avatars
- Automated profile creation on signup
- Login history with 90-day retention and automatic cleanup

### 🖥️ Electron Desktop App

- Desktop application built with Electron
- Native window management
- Cross-platform support (Windows, macOS, Linux)

### 🧠 Multi AI Providers

| Provider | Model | Capabilities |
|----------|-------|-------------|
| **Gemini** (Default) | `gemini-2.0-flash` | Text generation, streaming, vision |
| **DeepSeek** | `deepseek/deepseek-r1:free` (via OpenRouter) | Text generation, reasoning |
| **Qwen** | `qwen/qwen2.5-vl-72b-instruct:free` (via OpenRouter) | Vision, image analysis |
| **Future Provider Support** | Pluggable architecture | Add custom providers |

**AI Infrastructure Features:**
- Conversation Memory (session-based)
- Response Caching
- Real-time Streaming
- Token Tracking & Cost Estimation
- AI Analytics & Usage Logging
- Prompt Templates System
- Vision Support (image analysis)
- Document Processing
- Structured Logging
- Provider Fallback Chain
- Autonomous Manager Mode

---

## Screenshots (Placeholder)

*Screenshots will be added as the application matures. Key screens include:*

- Onboarding & Authentication Flow
- Login with OAuth providers
- Dashboard with analytics
- AI Advisor interface
- Chat & Messaging
- Task Management board
- Admin Dashboard for member management
- Settings (Profile, Security, 2FA, Organization, Login History)
- Users & Roles management
- Email templates (password reset, verification, magic link, invite)

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, React Router 7, Tailwind CSS 4 |
| **Desktop** | Electron 32 |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions) |
| **AI Providers** | Gemini API, OpenRouter (DeepSeek, Qwen) |
| **Icons** | Lucide React |
| **Languages** | JavaScript (ESM), TypeScript (Edge Functions), SQL, HTML/CSS |
| **Build Tools** | PostCSS, Autoprefixer |
| **Package Manager** | npm |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Electron Shell                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │                  React App (Vite)                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │  │
│  │  │ Auth UI  │ │ Dashboard│ │  Feature Pages    │  │  │
│  │  │ (Login,  │ │  (Stats, │ │  (Chat, Tasks,    │  │  │
│  │  │  SignUp) │ │  Graphs) │ │   AI, Settings)   │  │  │
│  │  └────┬─────┘ └────┬─────┘ └────────┬──────────┘  │  │
│  │       │             │                │              │  │
│  │  ┌────▼─────────────▼────────────────▼──────────┐  │  │
│  │  │           AuthContext (RBAC)                  │  │  │
│  │  │  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │  │  │
│  │  │  │ signIn  │ │ OAuth    │ │ Permissions  │  │  │  │
│  │  │  │ signUp  │ │ (Google, │ │ (13 resources│  │  │  │
│  │  │  │ signOut │ │  GitHub, │ │  × 5 actions)│  │  │  │
│  │  │  │ 2FA/MFA │ │  Micro.) │ │ 22 roles     │  │  │  │
│  │  │  └────┬─────┘ └────┬────┘ └──────────────┘  │  │  │
│  │  └───────┴────────────┴─────────────────────────┘  │  │
│  │              │              │                       │  │
│  │  ┌───────────▼──────────────▼──────────────────┐  │  │
│  │  │           Service Layer                       │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │  │  │
│  │  │  │ supabase │ │ AI       │ │ auth/       │  │  │  │
│  │  │  │ client   │ │ (Multi   │ │ (authService│  │  │  │
│  │  │  │          │ │  Prov.)  │ │  permissions│  │  │  │
│  │  │  │          │ │          │ │  roles)     │  │  │  │
│  │  │  └────┬─────┘ └────┬─────┘ └──────┬──────┘  │  │  │
│  │  └───────┴────────────┴──────────────┴─────────┘  │  │
│  └──────────────────┬─────────────────────────────────┘  │
│                     │                                     │
└─────────────────────┼─────────────────────────────────────┘
                      │
     ┌────────────────┼────────────────┐
     │                │                │
┌────▼────┐   ┌───────▼───────┐   ┌───▼────┐
│ Supabase│   │   Edge Funcs  │   │ AI API │
│ (DB,    │   │ (send-otp,   │   │(Gemini,│
│  Auth,  │   │  delete-user) │   │OpenRouter│
│ Storage)│   │               │   │        │
└─────────┘   └───────────────┘   └────────┘
```

---

## Folder Structure

```
optivian-app/
├── src/
│   ├── App.jsx                  # Root app with routing
│   ├── main.jsx                 # Vite entry point
│   ├── index.css                # Tailwind CSS imports
│   ├── layouts/
│   │   └── MainLayout.jsx       # Authenticated app shell
│   ├── pages/
│   │   ├── Auth/                # Login, SignUp, Onboarding,
│   │   │                        # CreateOrganization, ResetPassword, MfaVerify
│   │   ├── Dashboard/           # Dashboard with stats & analytics
│   │   ├── Chat/                # Internal messaging
│   │   ├── Tasks/               # Task management
│   │   ├── AI/                  # AI Advisor interface
│   │   ├── Users/               # User directory & role management
│   │   ├── Settings/            # Profile, password, 2FA, org, login history
│   │   └── Admin/               # Admin dashboard for member management
│   ├── services/
│   │   ├── auth/                # RBAC system (permissions, roles, authService)
│   │   ├── ai/                  # Multi-provider AI (providers, prompts, memory,
│   │   │                        #   templates, analytics, cache, logging, vision)
│   │   ├── supabase.js          # Supabase client
│   │   ├── AuthContext.jsx       # Global auth state & methods
│   │   ├── ProtectedRoute.jsx    # Route guard with RBAC
│   │   ├── emailOtpService.js   # Email-based 2FA OTP service
│   │   ├── loginHistoryService.js # Login history fetcher
│   │   ├── chatService.js       # Chat & messaging service
│   │   ├── notificationService.js # Notification service
│   │   ├── taskService.js       # Task management service
│   │   └── migrateTasks.js      # Task data migration helper
├── electron/
│   ├── main.cjs                 # Electron main process
│   └── preload.cjs              # Electron preload script
├── supabase/
│   ├── schema.sql               # Original database schema
│   ├── missing_tables.sql       # Missing tables patch
│   ├── migrations/
│   │   ├── add_auth_rbac.sql    # Auth & RBAC upgrade migration
│   │   ├── add_ai_infra_tables.sql # AI infrastructure tables
│   │   ├── add_mfa_email_otp.sql   # Email 2FA OTP tables
│   │   └── add_last_seen.sql    # Last seen tracking
│   ├── functions/
│   │   ├── send-otp/index.ts    # Edge Function for OTP email delivery
│   │   └── delete-user/index.ts # Edge Function for user deletion
│   └── email-templates/         # Custom email HTML templates
│       ├── confirmation.html    # Email confirmation
│       ├── reset-password.html  # Password reset
│       ├── magic-link.html      # Magic link login
│       ├── invite.html          # Team member invitation
│       └── change-email.html    # Email change verification
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── _env                         # Environment template
└── README.md
```

---

## Database Schema

The application uses a comprehensive PostgreSQL schema hosted on Supabase with the following tables:

### Core Tables
- **organizations** — Business entities with owner, type, website, social links
- **profiles** — Extended user profiles with roles, contact info, 2FA status
- **staff_credentials** — Admin-created temporary login credentials

### Communication
- **conversations** — Chat groups and direct messages
- **conversation_participants** — Many-to-many membership
- **messages** — Chat messages with reply, edit, and delete support

### Task Management
- **tasks** — Tasks with multi-assignee support, status, priority, and due dates

### AI & Analytics
- **ai_analyses** — AI analysis records with input/output data and scores
- **conversation_memory** — Session-based AI conversation history
- **ai_request_logs** — AI provider request logs with latency and token usage

### Auth & Security
- **user_sessions** — Active session tracking for "logout everywhere"
- **login_history** — Login attempt records with IP, provider, device
- **role_permissions** — Custom role permission overrides
- **mfa_otps** — SHA-256 hashed OTP codes for email-based 2FA

### Notifications
- **notifications** — User notification system with type and reference tracking

### Storage Buckets
- **avatars** — User profile avatar images
- **chat_files** — File uploads within conversations

**To apply the schema:**
1. Run `supabase/schema.sql` first
2. Run `supabase/migrations/add_auth_rbac.sql` for RBAC upgrade
3. Run `supabase/migrations/add_ai_infra_tables.sql` for AI infrastructure
4. Run `supabase/migrations/add_mfa_email_otp.sql` for 2FA support

---

## Installation Guide

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- **Git**
- **Supabase account** (for production mode) — [Create one free](https://supabase.com)
- **API keys** for AI providers (Gemini, OpenRouter)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/optivian-app.git
   cd optivian-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the template and fill in your values:

   ```bash
   cp _env .env
   ```

   See [Environment Variables](#environment-variables) below.

4. **Run in development mode**

   ```bash
   npm run dev
   ```

   This starts the Vite dev server. The app operates in **Developer Mode** using localStorage-based mock data if no Supabase credentials are configured.

5. **Run with Electron**

   ```bash
   npm run dev:electron
   ```

6. **Deploy Supabase Edge Functions** (for production 2FA)

   ```bash
   npx supabase functions deploy send-otp
   npx supabase functions deploy delete-user
   ```

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# ── Supabase (Required for Production Mode) ──────────────────────
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# ── AI Default Provider ──────────────────────────────────────────
VITE_AI_DEFAULT_PROVIDER=gemini

# ── Gemini API (Default Provider) ────────────────────────────────
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_GEMINI_MODEL=gemini-2.0-flash

# ── DeepSeek via OpenRouter ──────────────────────────────────────
VITE_DEEPSEEK_API_KEY=sk-or-v1-your-openrouter-key
VITE_DEEPSEEK_MODEL=deepseek/deepseek-r1:free

# ── Qwen VL via OpenRouter ──────────────────────────────────────
VITE_QWEN_API_KEY=sk-or-v1-your-openrouter-key
VITE_QWEN_MODEL=qwen/qwen2.5-vl-72b-instruct:free
```

> **Note:** If `VITE_SUPABASE_URL` is empty or missing, the app runs in **Developer Mode** with localStorage-based mock data and no real API calls.

---

## API Keys Required

| Service | Key | Required For |
|---------|-----|-------------|
| **Supabase** | Supabase URL + Anon Key | Database, Auth, Storage, Realtime |
| **Gemini** | Gemini API Key | Primary AI provider (text, vision, streaming) |
| **OpenRouter** | OpenRouter API Key | DeepSeek (text) and Qwen (vision) fallback providers |
| **Resend** | Resend API Key | Email delivery for 2FA OTP codes (Edge Function) |

Get free API keys:
- [Gemini API Key](https://aistudio.google.com/apikey)
- [OpenRouter API Key](https://openrouter.ai/keys)
- [Resend API Key](https://resend.com/api-keys)
- [Supabase Project](https://supabase.com)

---

## How to Run

### Development Mode (No Backend Required)

```bash
npm run dev
```

Opens at `http://localhost:5173`. Uses mock data stored in `localStorage`. All features work including auth, chat, tasks, and AI (requires API key).

### Production Mode (With Supabase)

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
2. Run all SQL migrations in Supabase SQL Editor
3. Run `npm run dev`

### Electron Desktop App

```bash
npm run dev:electron
```

Builds the Vite app and launches it inside an Electron window.

### Production Build

```bash
npm run build
```

Outputs:
- `dist/` — Web build (Vite output)
- `release/` — Electron installer (platform-specific)

---

## How to Deploy

### Web (Vite)

1. Build the app:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, etc.)

### Desktop (Electron)

1. Build and package:
   ```bash
   npm run build
   ```
2. Find the installer in `release/`

### Supabase Edge Functions

```bash
npx supabase functions deploy send-otp --project-ref your-project-ref
npx supabase functions deploy delete-user --project-ref your-project-ref
```

Set secrets:
```bash
npx supabase secrets set RESEND_API_KEY=re_xxx --project-ref your-project-ref
npx supabase secrets set SMTP_FROM=noreply@optivian.app --project-ref your-project-ref
```

### Apply Database Migrations

Run the SQL files in your Supabase SQL Editor in order:
1. `supabase/schema.sql`
2. `supabase/migrations/add_auth_rbac.sql`
3. `supabase/migrations/add_ai_infra_tables.sql`
4. `supabase/migrations/add_mfa_email_otp.sql`

### Configure Email Templates

Custom HTML email templates are in `supabase/email-templates/`. Paste these into the [Supabase Auth Email Templates](https://supabase.com/dashboard/project/_/auth/templates) settings.

---

## Roadmap

### ✅ Implemented

- [x] Project infrastructure (React, Vite, Tailwind, Electron)
- [x] Complete Supabase database schema with RLS policies
- [x] Authentication (Email + Password, Google, GitHub)
- [x] Email-based Two-Factor Authentication
- [x] RBAC with 22 roles and 13 resources
- [x] Organization creation with business details
- [x] Staff directory with admin management
- [x] Real-time messaging (chat with DMs and groups)
- [x] Task management with multi-assignee
- [x] AI Advisor with multi-provider support (Gemini, DeepSeek, Qwen)
- [x] AI Vision & Document Processing
- [x] AI Conversation Memory & Caching
- [x] AI Token Tracking & Cost Estimation
- [x] AI Analytics & Usage Logging
- [x] Prompt Templates System
- [x] Notifications with real-time updates
- [x] Login History page
- [x] Settings (Profile, Password, 2FA, Organization)
- [x] Admin Dashboard for member management
- [x] Email templates (confirmation, password reset, magic link, invite)
- [x] Supabase Edge Functions (send-otp, delete-user)
- [x] Developer Mode (localStorage mock data)
- [x] Avatar upload

### 🚧 In Progress

- [ ] AI prompts for Business Advisor, Requirement Analyzer, Decision Simulation
- [ ] Social media live analysis integration
- [ ] Risk heatmap visualization
- [ ] Launch Readiness Score widget
- [ ] Charts and data visualizations on Dashboard

### 🔮 Future Features

- **Vision Analysis** — AI image and logo analysis using Qwen VL and Gemini Vision
- **Social Media Analysis** — Live analysis and content strategy suggestions
- **Decision Simulation Engine** — Interactive "what-if" scenario testing
- **Launch Readiness Score** — Comprehensive readiness assessment
- **Autonomous Manager Mode** — AI that works like an intelligent project manager
- **Custom Window Controls** — Native Electron titlebar
- **Native System Notifications** — Desktop notification integration
- **Auto-Updater** — via `electron-builder`
- **Group Projects** — Team collaboration on shared goals
- **Google Tool Integration** — Drive, Docs, Sheets connectivity

---

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Development Guidelines

- Follow existing code patterns and conventions
- Use the project's RBAC system for access control
- Test in both Developer Mode and Production Mode
- Update SQL migrations when modifying the database schema
- Update email templates when adding auth-related email notifications
- Run `npm run dev` to verify the build compiles without errors

---

## License

This project is proprietary software. All rights reserved.

**Team Veronyx** · **Domain:** Decision Intelligence · **Project:** OptivianAI

---

## Known Issues

### Current Limitations

1. **Developer Mode Constraints**
   - OAuth providers (Google, GitHub) are unavailable
   - AI calls require API keys even in Developer Mode
   - Edge Functions (send-otp, delete-user) require a live Supabase instance

2. **AI Provider Free Tiers**
   - DeepSeek R1 and Qwen VL via OpenRouter free tier have rate limits
   - Gemini free tier has requests-per-minute limitations

3. **Electron**
   - Requires Git for Windows bash to be installed for terminal commands
   - No auto-updater configured yet

4. **Database**
   - Migrations must be run sequentially in order
   - Existing `admin` role profiles need manual mapping to `administrator`

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `profiles_role_check constraint violated` | Add `'admin'` to the CHECK constraint or run `UPDATE profiles SET role = 'administrator' WHERE role = 'admin'` |
| Supabase Edge Function returns 401 | Ensure `SUPABASE_SERVICE_ROLE_KEY` secret is set for the function |
| 2FA OTP not sending | Check `RESEND_API_KEY` secret is set on the Edge Function, or use Developer Mode to see the code |
| App runs in Dev Mode unexpectedly | Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` |

---

*Last updated: July 2026*
