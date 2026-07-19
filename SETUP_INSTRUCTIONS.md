# Setup Instructions — External Services

This document covers the setup steps for services that require **your manual action** (API keys, accounts, or configuration changes).

---

## 1. Website Analyzer — CORS Proxy URL

**Why:** The Website Analyzer runs in the browser and needs a CORS proxy to fetch website content (browsers block cross-origin requests).

### Option A: Use a Free CORS Proxy (Quick Start)

Create a `.env` file in the project root and add:

```env
VITE_CORS_PROXY_URL=https://corsproxy.io/?
```

> **Note:** Free proxies have rate limits. For production, use Option B or C.

### Option B: Deploy Your Own Proxy (Recommended)

Create a free serverless function on Vercel/Netlify:

```js
// cors-proxy.js — Deploy as a serverless function
export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  const response = await fetch(url, {
    headers: { 'User-Agent': 'OptivianAI/1.0' },
  });
  const text = await response.text();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(text);
}
```

After deploying, set:
```env
VITE_CORS_PROXY_URL=https://your-proxy.vercel.app/api/proxy?url=
```

### Option C: Supabase Edge Function

```bash
supabase functions deploy cors-proxy
```

### After Setup

The Website Analyzer in the app (AI Platform → Website Analyzer) will automatically use the proxy when you enter a URL.

---

## 2. YouTube Analyzer — YouTube Data API Key

**Why:** The YouTube Analyzer fetches video metadata and transcripts using the YouTube Data API v3.

### Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **YouTube Data API v3**
4. Create credentials → **API Key**
5. Restrict the key to YouTube Data API only (optional but recommended)

### Add to .env

```env
VITE_YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Test

Open the YouTube Analyzer in the app and paste a YouTube URL like:
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

---

## 3. Email Service — SendGrid or Resend

**Why:** The app sends task assignment notifications, chat message alerts, and daily digests via email.

### Option A: SendGrid (Recommended)

1. Create account at [sendgrid.com](https://sendgrid.com/) (Free tier: 100 emails/day)
2. Create an API key (Settings → API Keys → Create Key → Full Access)
3. Verify sender email (Settings → Sender Authentication → Single Sender Verification)

Add to `.env`:
```env
VITE_EMAIL_PROVIDER=sendgrid
VITE_SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
VITE_SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Option B: Resend

1. Create account at [resend.com](https://resend.com/) (Free tier: 100 emails/day)
2. Create an API key
3. Verify your domain

Add to `.env`:
```env
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
VITE_RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Test

The notification system will automatically use the configured provider:
- Task assignment → email notification
- Due date reminders → email notification  
- Chat messages → email notification (for offline users)
- 2FA OTP codes (via Supabase edge function)

---

## 4. Supabase Tables — Run Migrations

Run these SQL migrations in your Supabase Dashboard (SQL Editor):

### Migration 1: Login History

```sql
-- File: supabase/migrations/add_login_history.sql
-- Copy and paste the contents of this file into Supabase SQL Editor
```

### Migration 2: Audit Log

```sql
-- File: supabase/migrations/add_audit_log.sql  
-- Copy and paste the contents of this file into Supabase SQL Editor
```

### What these tables do:

| Table | Purpose | Retention |
|-------|---------|-----------|
| `login_history` | Tracks every login attempt (success/failure, IP, device, provider) | 90 days |
| `audit_log` | Tracks admin actions (who did what, when) | 1 year |

---

## 5. OAuth Providers — Google, GitHub

Already configured in Supabase Dashboard:
- **Google:** Enabled (needs Client ID + Secret)
- **GitHub:** Enabled (needs Client ID + Secret)

Go to: Supabase Dashboard → Authentication → Providers → Configure each

---

## 6. Deploy Supabase Edge Functions

```bash
# Deploy all custom edge functions
supabase functions deploy send-otp
supabase functions deploy delete-user
supabase functions deploy daily-digest

# Set secrets (after setting up email service above)
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set SMTP_FROM=noreply@optivian.app
```

---

## 7. Quick Start — `.env` File Template

Copy this to `.env` in the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://hajvxegsjcjdeoukkkag.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Website Analyzer (optional - for fetching URLs)
VITE_CORS_PROXY_URL=https://corsproxy.io/?

# YouTube Analyzer (optional - for video analysis)
VITE_YOUTUBE_API_KEY=AIzaSy...

# Email (optional - for notifications)
VITE_EMAIL_PROVIDER=sendgrid
VITE_SENDGRID_API_KEY=SG.xxxxx
VITE_SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# AI Providers (optional - for AI tools)
VITE_OPENAI_API_KEY=sk-...
VITE_DEEPSEEK_API_KEY=sk-...
VITE_GEMINI_API_KEY=AIzaSy...
```

---

Need help with any of these steps? Let me know which one you want to tackle!
