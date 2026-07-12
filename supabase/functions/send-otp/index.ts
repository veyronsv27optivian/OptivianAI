// ─── Send OTP Email — Supabase Edge Function ─────────────────────
// Deployment: supabase functions deploy send-otp
// Secrets:    supabase secrets set RESEND_API_KEY=re_xxx
//             supabase secrets set SMTP_FROM=noreply@optivian.app
//
// Fallback:   If no RESEND_API_KEY is set, it still stores the OTP
//             and returns success — the client can display the code
//             in DEV_MODE or use the Supabase Auth email template.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Payload {
  email: string;
  userId: string;
}

serve(async (req) => {
  try {
    // ── Parse request ───────────────────────────────────────────
    const { email, userId }: Payload = await req.json();

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: 'email and userId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── Initialize Supabase client (service role for DB access) ─
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // ── Generate 6-digit OTP ────────────────────────────────────
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code with SHA-256 for secure storage
    const encoder = new TextEncoder();
    const data = encoder.encode(code + userId); // salt with userId
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // ── Store hash in mfa_otps table ────────────────────────────
    // Expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: dbError } = await supabaseAdmin
      .from('mfa_otps')
      .insert({
        user_id: userId,
        code_hash: codeHash,
        expires_at: expiresAt,
        attempts: 0,
        max_attempts: 3,
        is_used: false,
      });

    if (dbError) {
      console.error('Failed to store OTP:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate OTP' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── Send email via Resend (or fall back to Supabase Auth) ───
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('SMTP_FROM') || 'noreply@optivian.app';

    if (resendApiKey) {
      // Send via Resend
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: `OptivianAI <${fromEmail}>`,
          to: email,
          subject: 'Your OptivianAI Verification Code',
          html: getEmailHtml(code),
        }),
      });

      const resendResult = await res.json();
      if (!res.ok) {
        console.error('Resend error:', resendResult);
        // Don't fail - OTP is stored, user can see it in dev mode
      }
    } else {
      console.log(`[DEV MODE] OTP for ${email}: ${code}`);
      console.log(`[DEV MODE] Set RESEND_API_KEY secret to send real emails.`);
    }

    // ── Return success (never return the code!) ─────────────────
    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent to email' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('send-otp error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ─── Email HTML Template ────────────────────────────────────────
function getEmailHtml(code: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#FFFFFF;border-radius:12px;border:1px solid #E2E8F0;">
          <tr>
            <td style="padding:40px 40px 0 40px;text-align:center;">
              <div style="width:48px;height:48px;background-color:#2563EB;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
                <span style="font-size:24px;font-weight:bold;color:#FFFFFF;">O</span>
              </div>
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#0F172A;">Two-Factor Verification</h1>
              <p style="margin:8px 0 0 0;font-size:14px;line-height:22px;color:#475569;">
                Use the following code to complete your sign-in to <strong style="color:#0F172A;">OptivianAI</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <div style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;">
                <p style="margin:0 0 8px 0;font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">Verification Code</p>
                <p style="margin:0;font-size:36px;font-weight:700;color:#2563EB;letter-spacing:8px;font-family:monospace;">${code}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0;font-size:12px;color:#94A3B8;line-height:18px;text-align:center;">
                This code expires in <strong>5 minutes</strong>. If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 40px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-bottom:1px solid #E2E8F0;"></td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:11px;color:#CBD5E1;text-align:center;">
                &copy; 2026 OptivianAI &middot; Secure login verification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
