# PLAYWRIGHT PHASE 1 AUDIT — OptivianAI

**Date:** 2026-07-18
**Mode:** READ-ONLY browser audit (no source changes, no DB mutations, no fabricated data)
**App under test:** `http://localhost:5173/` (Vite dev server, PID background `bhn144cby`)
**Supabase project:** `hajvxegsjcjdeoukkkag` (region `ap-southeast-2`, status `ACTIVE_HEALTHY`)

---

## ⛔ EXECUTIVE SUMMARY — WHAT WAS AND WASN'T TESTED

| Area | Status | Why |
|------|--------|-----|
| A. Application startup (build/serve) | ✅ **VERIFIED** (build-level) | Vite served HTTP 200, compiled clean. No runtime JS execution captured (see B.1). |
| B. Authentication — invalid creds / route guards | 🟡 **PARTIAL** (source-verified, not runtime) | Route-guard logic read from source; runtime click-through blocked (no browser). |
| B/C/E/F/G/H/I/J — authenticated workflows | ⛔ **BLOCKED** | App runs in **production mode** (Supabase URL is set). All these flows require a logged-in session. |
| Multi-user session testing | ⛔ **BLOCKED** | Requires ≥2 real accounts (see Blockers). Also fundamentally limited by single-session architecture. |
| AI features (OpenAI/Gemini/DeepSeek/Qwen) | 🟡 **PARTIAL (config-verified)** | OpenAI key absent; DeepSeek/Qwen use `:free` model slugs; Gemini key validity unverifiable without exposing it. |
| K/L. Performance & UI/UX of private screens | ⛔ **BLOCKED** | Behind auth. |

**Two hard blockers:**
1. **No Playwright browser is installed** — `browser_navigate` hung >120s and was backgrounded; no `ms-playwright` cache exists and no download was attempted. No runtime DOM/console/network capture was possible.
2. **No test credentials + a no-DB-mutation rule** — the app is in production mode, so login/dashboard/tasks/AI all require authentication. Creating accounts via signup would write to `auth.users`/`profiles` (a DB mutation), which this audit forbids. I will not guess passwords.

> Per the audit brief ("If credentials are needed, stop and tell me exactly what is required"), interactive testing stops here. The remainder of this document records (a) everything verified read-only, (b) source-level root-cause analysis of the reported bugs, and (c) the exact inputs required to finish the gated sections.

---

## 1. ENVIRONMENT & CONFIGURATION FINDINGS (read-only recon)

`.env` is present and **has `VITE_SUPABASE_URL` set**, so `DEV_MODE` is **false** (`src/services/AuthContext.jsx:15`). The app talks to the real Supabase project — there is **no mock/localStorage fallback in use**.

| Variable | Present? | Note |
|----------|----------|------|
| `VITE_SUPABASE_URL` | ✅ (40 chars) | `https://hajvxegsjcjdeoukkkag.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ (208 chars) | Anon key only (safe to expose by design; not printed) |
| `VITE_AI_DEFAULT_PROVIDER` | ✅ (`gemini`) | — |
| `VITE_GEMINI_API_KEY` | ✅ (56 chars, `AIza…` format) | Reported **invalid** — cannot confirm without exposing it |
| `VITE_GEMINI_MODEL` | ✅ (`gemini-2.0-flash`) | — |
| `VITE_DEEPSEEK_API_KEY` | ✅ (73 chars, OpenRouter `sk-or-v1…` format) | — |
| `VITE_DEEPSEEK_MODEL` | ✅ (`deepseek/deepseek-r1:free`) | ⚠️ `:free` slug |
| `VITE_QWEN_API_KEY` | ✅ (73 chars, OpenRouter format) | — |
| `VITE_QWEN_MODEL` | ✅ (`qwen/qwen2.5-vl-72b-instruct:free`) | ⚠️ `:free` slug |
| `VITE_OPENROUTER_API_KEY` | ❌ **ABSENT** | **Required by the OpenAI-via-OpenRouter provider** |
| `VITE_RESEND_API_KEY` / email | ❌ not in `.env` | MFA OTP email delivery depends on this Edge-Function secret |

**Key implication:** OpenAI will never be available in the current config because `PROVIDER_CONFIGS[OPENAI_VIA_OPENROUTER].envKey` is `VITE_OPENROUTER_API_KEY` (`src/services/ai/config.js:152-162`), which is unset → `isAvailable()` returns false.

---

## 2. APPLICATION STARTUP (A)

| Check | Result |
|-------|--------|
| Dev server boot | ✅ `VITE v7.3.6 ready in 812 ms` (no compile errors in `vite.log`) |
| HTTP response | ✅ `http://localhost:5173/` → `200` |
| Broken assets on load | ⚠️ Not runtime-verified (no browser). `index.html`, `vite.config.js` exist. |
| Runtime exceptions / console errors | ⚠️ Not captured — Playwright browser unavailable. **This is the single biggest gap in A.** |
| Supabase connect on boot | Expected: `supabase.auth.getSession()` + `onAuthStateChange` fire on mount (`AuthContext.jsx:278-334`). Could not observe network. |

**Action to close gap:** run a browser, capture `browser_console_messages` (level=error) and `browser_network_requests` on first load.

---

## 3. AUTHENTICATION (B) — SOURCE-VERIFIED, RUNTIME BLOCKED

`ProtectedRoute.jsx` (read):
- Unauthenticated → `<Navigate to="/onboarding" replace />` (line 35).
- Missing RBAC permission → `<Navigate to="/app" replace />` (line 48).
- While `loading` is true it shows a spinner (lines 23-32). A forced `setLoading(false)` after 4s exists as a safety net (`AuthContext.jsx:86-89`).

`signOut` (`AuthContext.jsx:505-531`) always clears local React state **immediately**, then calls `supabase.auth.signOut({ scope })` (default `'local'`). This is safe, but see §6 for why logout can still feel unreliable.

**What could be tested read-only once a browser exists (no account needed):**
- Invalid-credentials path: type garbage → `signInWithPassword` → error surfaced. (Safe — no row created.)
- Direct nav to `#/app/users`, `#/app/admin` → expect redirect to `/onboarding` (unauth) or `/app` (auth-but-no-permission).
- Refresh on `/onboarding` → OAuth guard in `App.jsx:218-245` watches `window.location.hash` for `access_token=`; 8s safety timeout.

---

## 4. MULTI-USER SESSION TESTING (C) — BLOCKED + ARCHITECTURAL FINDING

**This is the most important structural finding of the audit, and it is verifiable from source without a browser.**

`src/services/supabase.js:9` creates the client with **default `persistSession: true`** → Supabase stores the session in **one `localStorage` key** (`sb-<ref>-auth-token`) **per browser/origin**. There is no account-switching UI and no separate storage per user.

Consequence (directly explains the reported "cannot reliably log in with two different accounts on the same browser/system"):
- Logging in as **User B overwrites User A's session slot** in the same browser.
- `signOut({ scope: 'local' })` clears only the local copy; combined with the single shared slot, repeated login/logout cycles interleave and the "current user" becomes ambiguous, especially across tabs.
- True isolation requires **separate browser contexts/profiles** (incognito per account) — the app has no built-in multi-account support.

**Reproduction plan (once 2 accounts + a browser exist):** use two isolated Playwright browser contexts; do NOT attempt same-context switching — it is expected to fail by design. Verify each context sees only its own org/profile data.

**Blocker:** need ≥2 real accounts (see §9).

---

## 5. ONBOARDING (D), ORGANIZATION (E), DASHBOARD (F), TASKS (G), CALENDAR (H), SETTINGS (J) — BLOCKED

All are behind `ProtectedRoute` (require `user`). Cannot reach without auth. Source-level notes that *will* matter when unblocked:
- Org creation (`createOrganization`, `AuthContext.jsx:662-739`) inserts into `organizations` then `profiles.update({ role:'owner' })`.
- **Staff add stuck bug (reported) — strong root-cause candidate:** `createStaffMember` (`AuthContext.jsx:777-864`) calls `supabase.auth.signUp(...)` for the new member, then **restores the admin session** via `supabase.auth.setSession({ access_token, refresh_token })` (lines 845-854). If Supabase has email autoconfirm ON, `signUp` itself returns a **session for the new staff user**, and the subsequent `setSession` restore is racy/order-dependent — the admin can end up "logged in as the staff member," making the UI appear stuck or show the wrong identity. If autoconfirm is OFF, `signUp` returns no session and the restore is a no-op. This is the most likely cause of "cannot add staff/team members; operation gets stuck."

---

## 6. ROOT-CAUSE ANALYSIS — REPORTED BUGS (source-level, no runtime)

| # | Reported problem | Probable root cause (file:line) | Confidence |
|---|------------------|--------------------------------|------------|
| 1 | Two accounts unreliable on same browser | Single `localStorage` Supabase session slot (`supabase.js:9`); no per-user isolation; `signOut` scope `'local'` (`AuthContext.jsx:522`) | **High** |
| 2 | Logout works once then fails / unavailable | Single-slot overwrite (above) + `onAuthStateChange` SIGNED_OUT handler (`AuthContext.jsx:323-325`) only clears `profile`; repeated cycles can leave stale `user`/`session` refs. Possible interaction with the 24h `SESSION_TIMEOUT_MS` auto-logout (`AuthContext.jsx:49,130-133`). | **Medium-High** |
| 3 | Gemini API key invalid | Key present (56 chars) but reported invalid; cannot verify without exposing it. Likely a revoked/expired/placeholder key. | **Medium** (needs key check) |
| 4 | DeepSeek & Qwen = premium/unsupported | Both use **`:free`** OpenRouter model slugs (`deepseek/deepseek-r1:free`, `qwen/qwen2.5-vl-72b-instruct:free`). OpenRouter frequently retires/limits `:free` models → "model not found / premium required". Keys are present, so the slug (not the key) is the likely culprit. | **High** |
| 5 | Only OpenAI works | **OpenAI is actually NOT configured** — `VITE_OPENROUTER_API_KEY` is absent (`config.js:152-162`). If OpenAI "works" it is only via fallback chain when Gemini/DeepSeek/Qwen fail and an OpenRouter key happens to be present elsewhere. With current `.env`, OpenAI is unavailable too. | **High** |
| 6 | Staff add stuck | `createStaffMember` session-restore race (`AuthContext.jsx:845-854`) | **High** |
| 7 | UI sluggish / freezes after many interactions | Not runtime-confirmed. Candidates from code: profile polling every 60s (`AuthContext.jsx:373-388`), realtime `profiles` channel per mount (`AuthContext.jsx:337-370`), and `AiCache`/`AnalyticsTracker` operations on every AI call (`aiService.js`). Need runtime profiling to confirm. | **Low-Medium** (needs runtime) |
| 8 | No limit on # users that can log in | No rate-limit / quota enforcement client-side or in observed RLS; `auth.users` open signup. | **Medium** |

---

## 7. AI FEATURES (I) — CONFIG-VERIFIED

| Provider | Config key | Status | Notes |
|----------|-----------|--------|-------|
| Gemini (default) | `VITE_GEMINI_API_KEY` | Key present, **reported invalid** | Cannot test UI without login; key validity unverifiable read-only. |
| DeepSeek | `VITE_DEEPSEEK_API_KEY` | Key present; model `:free` | Likely "premium/unsupported" due to `:free` slug. |
| Qwen | `VITE_QWEN_API_KEY` | Key present; model `:free` (vision) | Same `:free` risk. |
| OpenAI | `VITE_OPENROUTER_API_KEY` | ❌ **Key ABSENT** | `isAvailable()` false; never selectable. |

Fallback chain: `providerManager.withFallback` tries active → others by priority (`providerManager.js:195-236`). With Gemini invalid + DeepSeek/Qwen `:free` failing + OpenAI unset, **every AI request will throw `AiConfigurationError('All AI providers failed…')`** — which would surface as a stuck/errored AI panel (matches reported "some components get stuck").

**To runtime-test I:** need (a) a logged-in session to open `#/app/ai`, and (b) valid keys for at least one provider. AI calls hit `https://generativelanguage.googleapis.com` / `https://openrouter.ai/api/v1` directly from the browser — capture `browser_network_requests` to record exact API/auth errors. **Do not expose keys in the report.**

---

## 8. PERFORMANCE (K) & UI/UX (L)

Not runtime-verified (no browser). Source-level risk items:
- 60s profile polling (`AuthContext.jsx:373-388`) + per-mount realtime channel (`AuthContext.jsx:337-370`) → duplicate/repeated fetches, especially after route changes that remount `MainLayout`.
- `aiService.generateText` runs cache + logger + analytics + usage tracking on **every** call (`aiService.js:241-365`); no global request debounce observed.
- Route transitions wrapped in `AnimatePresence` (`App.jsx:74-214`); combined with lazy chunks, repeated navigation could accumulate listeners if cleanup is incomplete.
- **UI/UX "buttons that do nothing":** `Pitch Deck Assistant` is registered in `config.js` but the roadmap (`IMPROVEMENT_ROADMAP.md` A1.2) notes it has **no UI button** — confirmed gap. `ToolRecommender` / `CommandPalette` exist but coverage unverified.

---

## 9. ⛔ BLOCKERS — EXACTLY WHAT IS REQUIRED TO FINISH

To complete the gated sections (B–J runtime, C multi-user, I AI, K/L), I need **all** of the following. I will not proceed without them, and I will not guess any value:

1. **A working Playwright browser.**
   - Either install it (`npx playwright install chromium`) and confirm the Playwright MCP server uses it, **or** grant me explicit permission to install it.
   - Without this, *no* runtime DOM/console/network capture is possible (sections A runtime, B–L interactive).

2. **Two safe test accounts** (email + password) that already exist in the `hajvxegsjcjdeoukkkag` Supabase Auth.
   - Reason: creating accounts via signup would write to `auth.users`/`profiles` — a DB mutation, which this audit forbids. Provide existing credentials (or a sanctioned, pre-approved seed method that you explicitly authorize in writing).
   - They must belong to **different organizations** (or at least different profiles) so the "User B must not see User A's data" assertion (section C.5) is meaningful.
   - Prefer accounts with **separate browser contexts** (one incognito each) — same-browser switching is expected to fail by design (§4).

3. **Valid AI provider key(s) for at least one provider**, OR confirmation of which keys are currently valid.
   - Specifically: is `VITE_GEMINI_API_KEY` a real key (the report says invalid)? Are the DeepSeek/Qwen OpenRouter keys active, and do the `:free` model slugs still exist on your OpenRouter account?
   - `VITE_OPENROUTER_API_KEY` is **absent** — OpenAI cannot be tested until it is supplied.
   - If you want AI tested, provide a key; I will use it only through the UI and **never print it**.

4. **(Optional) Resend/email secret confirmation** for MFA (section J): MFA OTP delivery depends on the `send-otp` Edge Function having `RESEND_API_KEY` set on the Supabase project. I cannot read project secrets from here; tell me if MFA email is expected to work in this environment.

---

## 10. WHAT WAS DONE (read-only, safe)

- Started Vite dev server (`bhn144cby`); confirmed clean compile + HTTP 200.
- Inspected `.env` (key **names/lengths only**, no values exposed).
- Read `AuthContext.jsx`, `ProtectedRoute.jsx`, `supabase.js`, `aiService.js`, `providerManager.js`, `config.js`, `providers/gemini|deepseek|qwen.js`, `App.jsx`.
- Read `IMPROVEMENT_ROADMAP.md`, `MASTER_WORKFLOW.md`, `README.md`, `_env`.
- Queried Supabase schema via MCP (read-only): 25 tables, RLS enabled on all, FKs to `auth.users` intact.
- **No source file was modified. No DB row was inserted/updated/deleted. No test data was created.**

---

## 11. RECOMMENDED UNBLOCK SEQUENCE

1. You provide items 1–3 above.
2. I install/verify the Playwright browser and re-run this audit capturing **console + network** on: first load, invalid login, each protected route, dashboard, tasks, calendar, AI panel (per provider), multi-context multi-user, and a 10-iteration navigation loop for K/L.
3. Each failed workflow gets the full repro/expected/actual/error/root-cause record the brief requires.
4. Findings roll into the Phase 2 plan — **no fixes applied until you approve.**

*Audit halted at the credential/tooling gate per the read-only brief. Awaiting the inputs in §9.*
