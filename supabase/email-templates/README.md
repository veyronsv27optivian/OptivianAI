# OptivianAI - Supabase Email Templates

Professional, branded HTML email templates for Supabase Auth.

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication → Email Templates**
3. For each template type, click "Edit" and paste the HTML from the corresponding file
4. Click "Save"

### Option 2: Custom SMTP (Production)

For production, set up a custom SMTP provider (Resend, SendGrid, AWS SES, etc.):

1. Go to **Authentication → Settings**
2. Under "SMTP Settings", configure your SMTP provider
3. Templates will still be editable in the same Email Templates section

## Template Types

| File | Type | Trigger |
|------|------|---------|
| `confirmation.html` | Confirm Signup | User signs up with email/password |
| `invite.html` | Invite User | Admin invites a new member |
| `magic-link.html` | Magic Link | User requests passwordless login |
| `reset-password.html` | Reset Password | User requests password reset |
| `change-email.html` | Email Change | User changes their email address |

## Available Variables

All templates support these Go template variables:

- `{{ .SiteURL }}` — Base URL of your application
- `{{ .Email }}` — Recipient's email address
- `{{ .ConfirmationURL }}` — The action link (works for ALL template types)
- `{{ .Token }}` — Raw verification token
- `{{ .TokenHash }}` — Hashed token

> **Important:** Supabase uses `{{ .ConfirmationURL }}` for **all** email template types. The platform automatically injects the correct URL (confirmation, invite, magic link, reset, or change email) based on which template is being rendered. Do **not** use type-specific variable names like `{{ .InviteURL }}` or `{{ .ResetURL }}`.

## Design System

- **Primary Color**: `#2563EB` (blue-600) — buttons and links
- **Background**: `#F8FAFC` (slate-50) — page background
- **Card**: `#FFFFFF` — email body card
- **Text**: `#0F172A` (slate-900) — headings, `#475569` (slate-600) — body text
- **Border**: `#E2E8F0` — card borders
- **Font**: system-ui, -apple-system, sans-serif
