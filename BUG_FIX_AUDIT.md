# BUG_FIX_AUDIT.md — OptivianAI Sprint

## PHASE 1: Full System Audit Results

### 1. Authentication Architecture
- **Status**: Solid dual-mode architecture (DEV_MODE/localStorage + Supabase)
- **Provider**: Supabase Auth (email/password)
- **Files**: `src/services/AuthContext.jsx`, `src/services/auth/authService.js`
- **Issues**: None critical — session management, login history logging via RPC all present

### 2. Supabase Client Configuration
- **Status**: Functional
- **File**: `src/services/supabase.js`
- **Issues**: DEV_MODE fallback works when VITE_SUPABASE_URL is empty

### 3. Database Tables (from schema.sql)
- **Tables**: organizations, profiles, tasks, ai_analyses, staff_credentials, conversations, messages, conversation_participants
- **Additional**: audit_log, login_history, mfa_otps, organization_branches, organization_departments, organization_teams, organization_activity_logs, organization_analytics_snapshots, role_permissions, role_permission_overrides, user_sessions, announcements, conversation_memory, ai_request_logs

### 4. RLS Policies
- **Status**: Comprehensive RLS policies exist across all tables
- **Files**: `supabase/schema.sql`, `supabase/migrations/*.sql`
- **Issues**: Need to verify RLS allows read for org members on profiles table

### 5. Roles & Permissions
- **Roles**: 20+ roles defined with hierarchy (super_admin → viewer)
- **Files**: `src/services/auth/roles.js`, `src/services/auth/permissions.js`
- **Status**: Comprehensive permission map with resource + action granularity
- **Issues**: `isAdmin()` function includes `manager` role, which is broader than expected

### 6. Proactivity System
- **Status**: Real monitoring engine exists in `monitoring.js`
- **Tracks**: Overdue tasks, due-soon tasks, stale tasks, user activity
- **Health Score**: Computed from actual data (average of check scores)
- **Issues**: `RecommendationsPanel` defaults healthScore to 100

---

## PHASE 2: Transparent UI Elements

### Issue: Search Bar Transparency (Dark Mode)
- **Root Cause**: `dark:bg-white/[0.04]` — only 4% opacity white on dark background
- **File**: `src/layouts/MainLayout.jsx` line ~380
- **Fix**: Change to `dark:bg-slate-800/90` matching other inputs in the app

### Issue: Notification Bar/Dropdown
- **Root Cause**: Uses `dropdown-premium` class — needs to check CSS
- **Status**: Needs CSS inspection

---

## PHASE 3: Proactivity System
- **Status**: Functional — real monitoring engine tracks overdue tasks, activity
- **Issues**: None critical — system is event-driven and actually works

---

## PHASE 4: User/Role Data Integrity

### Issue: Newly Added Member Not Visible
- **Root Cause (DEV_MODE)**: `createStaffMember()` creates user + profile correctly in localStorage
- **Issue**: The member list query in `Users.jsx` depends on `useEffect` with `[user?.id, profile?.organization_id]` — after adding, the component needs to re-fetch
- **Fix needed**: After `createStaffMember` succeeds, re-fetch members list

### Issue: Roles with Excessive Access
- **Root Cause**: `isAdmin()` includes `manager`, `director` which may see too much
- **Frontend**: Already using `hasPermission()` for fine-grained control
- **Supabase RLS**: Needs verification for profiles table access

---

## PHASE 5: Administrator Role & AI Insights
- **Status**: Administrator has full access via permissions.js
- **AI Context**: Org context builder works with real data
- **DeepSeek**: Configured via OpenRouter with fallback chain

---

## PHASE 6: Health Score Default

### Issue: Health Score Shows 100 When No Data
- **Root Cause**: `RecommendationsPanel.jsx` initializes `healthScore` to 100
- **Root Cause**: `monitoringEngine.runOnce()` returns `healthScore: 100` when no user
- **Fix**: Change defaults to `null` and show "—" or loading state

---

## PHASE 7: Organization Management

### Issue: Create Department Button Not Working
- **Root Cause**: Need to inspect `OrganizationStructure.jsx` for the button handler
- **Files**: `src/pages/Organization/OrganizationStructure.jsx`

### Issue: Delete User Button Not Working
- **Root Cause**: Need to inspect `Users.jsx` for remove member flow

### Issue: Organization Activity Button Not Working
- **Root Cause**: Need to inspect `OrganizationProfile.jsx`

---

## PHASE 8: Chat File Uploads
- **Status**: File upload flow exists via `uploadFile()` in chatService
- **Chat rendering**: Images/files rendered correctly in message bubbles
- **Issues**: Not tested end-to-end

---

## PHASE 9: Sample Data
- **Search results**: No mock/fake data found in production code paths
- **Status**: Acceptable empty states exist throughout the app

---

## PHASE 10: Login History
- **Status**: Login history is logged via `supabase.rpc('log_login_attempt', ...)` in AuthContext
- **Tables**: `login_history` table exists with RLS
- **Issues**: Needs front-end verification

---

## PHASE 11: Two-Factor Authentication
- **Status**: Email OTP service exists
- **Files**: `src/services/emailOtpService.js`, `src/services/mfaService.js`
- **Issues**: Needs code-level verification

---

## PHASE 12: Emails Not Arriving
- **Status**: Supabase email configuration is external — requires Supabase dashboard SMTP setup
- **Issues**: Cannot fix from code alone

---

## PHASE 13: AI Sidebar Navigation
- **Current behavior**: Clicking "AI Platform" opens submenu with "AI Settings" as first item
- **Expected**: Clicking "AI Platform" should open the main AI Tools Center
- **Fix**: Make the main AI button navigate to `/app/ai` directly, while submenu items provide access to settings

---

## PHASE 14: Role-Based AI Tools
- **Status**: Permission system exists in permissions.js with granular AI permissions
- **Issues**: AI tools visibility needs to be gated by permissions in the AI.jsx page

---

## PHASE 15: Purple UI Tint
- **Design Tokens**: CSS custom properties in `index.css` define background colors
- **Approach**: Add a subtle purple hue to `--bg-primary`, `--bg-secondary`

---

## PHASE 16: Verification
- **Build**: Vite build
- **Tests**: Run existing tests
- **Browser**: Manual verification
