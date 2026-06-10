# OptivianAI

OptivianAI is a desktop application built with React, Vite, Electron, Tailwind CSS, and Supabase. This repository contains the frontend and backend integration for the application, focusing on organization management, staff onboarding, and (upcoming) AI features.

## 🚀 Tech Stack

- **Frontend Framework:** React 19 (via Vite)
- **Desktop Environment:** Electron
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **Authentication & Backend:** Supabase
- **Icons:** Lucide React

---

## 🎯 Features

### ✅ What We Have Set Up (Implemented Features)

**1. Project Infrastructure**
- React + Vite foundation configured for rapid development.
- Electron integration for desktop deployment (`npm run dev:electron`).
- Tailwind CSS v4 setup for modern, responsive, and customizable styling.

**2. Authentication & Security (Supabase)**
- `AuthContext` for global state management of user sessions.
- `ProtectedRoute` components to secure authenticated routes.
- Fully configured Supabase client integration.

**3. Onboarding & Authentication Flows**
- **Landing/Onboarding Screen:** Directs users based on their role (Creator vs. Staff).
- **Create Organization:** A dedicated flow for new business owners to register their organization and set up their admin account.
- **Staff Sign In:** A flow tailored for employees joining an existing organization.
- **General Login:** Standard authentication portal for returning users.

**4. Dashboard & Layout**
- **Main Layout:** A persistent shell/layout for authenticated users.
- **Dashboard:** The initial landing page post-authentication, ready for widgets and data displays.

---

### 🚧 What Is Left (Pending Features & Roadmap)

**1. AI Integration (Core Feature)**
- [ ] Connect to AI models/APIs via OpenRouter (DeepSeek R1, Qwen VL).
- [ ] Wire up the AI Advisor send button to call the API.
- [ ] Implement core AI workflows: Business Advisor, Requirement Analyzer, Decision Simulation, etc.
- [ ] Social media live analysis.
- [ ] Future Lab / idea analysis.

**2. Organization & User Management**
- [x] Expanded Org Creation Flow — business details, social links, website.
- [x] Staff Directory — admin can view, create, remove staff members.
- [x] Role-Based Access Control (RBAC) — roles: admin, manager, staff.
- [x] Profile Settings page (stub — needs data persistence).
- [ ] Notification preferences.
- [ ] Security settings (password change).

**3. Dashboard Expansion**
- [x] Data Visualization — stat cards, activity feed, AI insights, module overview.
- [x] Quick Actions panel.
- [ ] Charts, risk heatmap, launch readiness score.
- [ ] Live data from backend vs sample data.

**4. Database & Backend**
- [x] Complete Supabase database schema (8 tables) with RLS policies.
- [x] SQL migration file created at `supabase/schema.sql`.**
- [x] Auto-profile creation trigger on user signup.
- [x] Staff credential management in dev mode (localStorage) + Supabase mode.
- [ ] Run SQL in Supabase dashboard to enable real backend.
- [ ] Set up storage buckets for file uploads.

**5. Internal Communication**
- [x] Chat UI with conversation list and message area (stub).
- [ ] Real-time messaging via Supabase Realtime.
- [ ] File upload support in chat.
- [ ] Group creation and DM functionality.

**6. Task Management**
- [x] Tasks page with filtering and status tracking (stub).
- [ ] Wire up to Supabase `tasks` table.
- [ ] Admin task assignment and user views.

**7. Desktop-Specific Features (Electron)**
- [x] Removed DevTools opening on startup.
- [x] Fixed Electron binary path resolution (path.txt CRLF bug).
- [ ] Custom window controls.
- [ ] Native system notifications.
- [ ] Auto-updater via `electron-builder`.

**\*\*To enable real Supabase backend, run `supabase/schema.sql` in your Supabase SQL Editor.**

I am building a desktop app using electron framework and supabase backend to organise a full structural details of staff member of a company + their resource and inventory management +its social platform and website statistics + AI future idea concept analysis of the company with the help of free AI modals  available through openrouter API 
AI Brain 
deepseek/deepseek-r1:free 
AI Workflow 
qwen/qwen2.5-vl-72b-instruct:free  (for image analysis)
+
deepseek/deepseek-r1:free 


Tech stack : tauri react tailwindcss javascript
The flow:
App opens as you to create a organisation or join it 
The company owner should first create an organisation with name type etc webs and social 
Then it will ask you to explain the business
platform info (insta twitter telegram etc)  

The UI should be a clean minimalist professional style light theme user react components 
Left panel should have buttons link users AI anylisies social stats web stats etc etc 
In the user panel the admin must create a id pass(temp) for staff of the orgainsations 
If the user clicks on join the user must entered the ID pass created by teh admin once logged in an imidiate popup should appear to chage the password 

Everything should get stored in the supabase backend 

Once the user signins the admin can provide them with roles and permission which will be visible in the profile 

AI will analysis socials live and tell new ideas to upload 
In the future tab the admin must give a idea and AI should anaylis everything and will response 

Core features of these platform include
No.
Feature
What it does
1
AI Business Advisor
Acts as a practical advisor through the complete product/program journey, not only at the idea stage.
2
Requirement Analyzer
Reads user input or documents and detects vague, incomplete, contradictory, or unrealistic requirements.
3
Missing Information Guide
Checks what details are missing and guides the user on how to provide or estimate them.
4
Decision Simulation Engine
Tests choices like timeline, budget, team size, feature cuts, and launch decisions before execution.
7
Risk Detection System
Identifies timeline, budget, workload, technical, requirement, and launch-related risks.
8
Risk Heatmap
Represents risk areas using visual levels so the team can quickly identify weak points.
9
Launch Readiness Score
Gives a clear score showing whether the product/program is ready for launch or needs improvement.
10
Project Journey Tracking
Maintains a track record of decisions, risks, changes, recommendations, and progress updates.
11
AI Recommendation System
Suggests next actions such as extending deadlines, reducing features, clarifying requirements, or improving plans.
12
Dashboard Analytics
Shows risk score, budget impact, timeline pressure, team workload, and launch readiness visually.
13
Document-Based Input
Allows users to upload or connect documents instead of entering every detail manually.
14
Google Tool Integration
Uses Google tools for design, workflow, coding, storage, AI, documents, and future scaling.
15
Final Report Generation
Creates a clear final report with risks, decisions, recommendations, and launch status.
16
AI Automated Workflow
Automatically moves users from idea input to missing-info guidance, analysis, simulation, tasks, tracking, and launch readiness.
17
Autonomous Manager Mode 
Autonomous Manager Mode allows Optivian AI to work like an intelligent project manager. Instead of depending completely on user-entered data, it understands the business goal, identifies missing requirements, retrieves relevant information from connected sources, creates a workflow, assigns next steps, tracks progress, and supports the user throughout the product or program launch journey. 

The members will have a chatting option to chat with anyone within the orgainsation by DM or by creating groups all file formates beside from just text msg are accepted 

One more tab where the admin assign tasks to the user and users can view it in the tasks tab

Its mostly admin orientate for every task but for members/staffs its more of collaboration and tasking


