/**
 * ─── Daily Digest Email — Supabase Edge Function ──────────────────
 * Sends a daily summary email to each user with:
 *   - Tasks due today
 *   - Tasks overdue
 *   - New chat messages since last digest
 *   - AI report notifications
 *
 * Deployment: supabase functions deploy daily-digest
 * Secrets:    supabase secrets set RESEND_API_KEY=re_xxx
 *             supabase secrets set SMTP_FROM=noreply@optivian.app
 *
 * Trigger: Can be called via cron job or scheduled webhook.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface DigestPayload {
  userId?: string;       // If provided, sends to one user only
  testMode?: boolean;    // If true, logs instead of sending
}

serve(async (req) => {
  try {
    const { userId, testMode }: DigestPayload = await req.json();

    // ── Initialize Supabase admin client ─────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('SMTP_FROM') || 'noreply@optivian.app';
    const today = new Date().toISOString().slice(0, 10);
    const lastDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // ── Get profiles who have daily_digest enabled ───────────────
    let profiles;
    if (userId) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      profiles = data ? [data] : [];
    } else {
      // Filter to profiles with daily_digest preference enabled
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('is_active', true);

      // Respect the daily_digest user preference (default to false)
      profiles = (data || []).filter((p: any) => {
        const prefs = p.notification_preferences || {};
        // Allow sending if daily_digest is explicitly true, or if no preference set (opt-in)
        return prefs.daily_digest === true;
      });
    }

    if (profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No users with daily digest enabled' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const profile of profiles) {
      try {
        const profileId = profile.id;

        // ── Get tasks due today ──────────────────────────────────
        const { data: tasksDueToday } = await supabaseAdmin
          .from('tasks')
          .select('id, title, due_date, status')
          .or(`assigned_tos.cs.{${profileId}},assigned_by.eq.${profileId}`)
          .eq('due_date', today)
          .neq('status', 'done')
          .neq('status', 'cancelled');

        // ── Get overdue tasks ────────────────────────────────────
        const { data: overdueTasks } = await supabaseAdmin
          .from('tasks')
          .select('id, title, due_date, status')
          .or(`assigned_tos.cs.{${profileId}},assigned_by.eq.${profileId}`)
          .lt('due_date', today)
          .neq('status', 'done')
          .neq('status', 'cancelled')
          .not('due_date', 'is', null);

        // ── Get unread message count ─────────────────────────────
        const { data: unreadConversations } = await supabaseAdmin
          .from('conversation_participants')
          .select('conversation_id, last_read_at')
          .eq('user_id', profile.user_id);

        let unreadMessages = 0;
        if (unreadConversations && unreadConversations.length > 0) {
          for (const cp of unreadConversations) {
            const { count } = await supabaseAdmin
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', cp.conversation_id)
              .gt('created_at', cp.last_read_at || '1970-01-01');
            unreadMessages += count || 0;
          }
        }

        // ── Get new AI reports from last 24h ─────────────────────
        const { data: newAiReports } = await supabaseAdmin
          .from('ai_analyses')
          .select('id, type, created_at')
          .eq('created_by', profileId)
          .gte('created_at', lastDay)
          .order('created_at', { ascending: false })
          .limit(10);

        // ── Get active announcements ────────────────────────────
        const { data: activeAnnouncements } = await supabaseAdmin
          .from('announcements')
          .select('id, title, type, created_at')
          .gte('created_at', lastDay)
          .order('created_at', { ascending: false })
          .limit(5);

        const aiReportCount = newAiReports?.length || 0;
        const announcementCount = activeAnnouncements?.length || 0;

        const hasContent = (tasksDueToday?.length || 0) > 0 ||
          (overdueTasks?.length || 0) > 0 ||
          unreadMessages > 0 ||
          aiReportCount > 0 ||
          announcementCount > 0;

        // ── Skip if no activity (unless testMode) ────────────────
        if (!hasContent && !testMode) {
          results.push({ email: profile.email, status: 'skipped', reason: 'no activity' });
          continue;
        }

        // ── Build email HTML ─────────────────────────────────────
        const html = buildDigestHtml(
          profile.full_name || profile.email?.split('@')[0] || 'User',
          tasksDueToday || [],
          overdueTasks || [],
          unreadMessages,
          aiReportCount,
          announcementCount,
          activeAnnouncements || []
        );

        // ── Send via Resend ──────────────────────────────────────
        if (resendApiKey && !testMode) {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: `OptivianAI <${fromEmail}>`,
              to: profile.email,
              subject: hasContent
                ? `Your Daily Digest — ${tasksDueToday?.length || 0} tasks due, ${unreadMessages} unread`
                : 'Your Daily Digest — All clear ✅',
              html,
            }),
          });

          const resendResult = await res.json();
          if (!res.ok) {
            console.error(`Failed to send digest to ${profile.email}:`, resendResult);
            results.push({ email: profile.email, status: 'failed', error: resendResult });
          } else {
            results.push({ email: profile.email, status: 'sent' });
          }
        } else if (testMode) {
          console.log(`[TEST] Digest for ${profile.email}:`, {
            tasksDueToday: tasksDueToday?.length || 0,
            overdueTasks: overdueTasks?.length || 0,
            unreadMessages,
            aiReports: aiReportCount,
            announcements: announcementCount,
          });
          results.push({ email: profile.email, status: 'test_logged' });
        } else {
          results.push({ email: profile.email, status: 'skipped', reason: 'no RESEND_API_KEY' });
        }
      } catch (err) {
        console.error(`Error processing digest for ${profile.email}:`, err);
        results.push({ email: profile.email, status: 'error', error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('daily-digest error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ─── Email HTML Template ────────────────────────────────────────
function buildDigestHtml(
  name: string,
  tasksDueToday: any[],
  overdueTasks: any[],
  unreadMessages: number,
  aiReportCount: number = 0,
  announcementCount: number = 0,
  activeAnnouncements: any[] = []
): string {
  const taskRows = (tasks: any[], label: string, color: string) => tasks.length > 0 ? `
    <tr>
      <td style="padding: 0 0 16px 0;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${color};">
          ${label} (${tasks.length})
        </h3>
        ${tasks.map((t: any) => `
          <div style="padding: 10px 12px; margin-bottom: 6px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
            <p style="margin: 0; font-size: 13px; color: #0F172A; font-weight: 500;">${t.title}</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748B;">
              Due: ${t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
              · Status: ${t.status?.replace(/_/g, ' ') || 'pending'}
            </p>
          </div>
        `).join('')}
      </td>
    </tr>
  ` : '';

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
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background-color:#FFFFFF;border-radius:12px;border:1px solid #E2E8F0;">
          <tr>
            <td style="padding:32px 32px 0 32px;">
              <div style="width:40px;height:40px;background:linear-gradient(135deg,#2563EB,#6366F1);border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="font-size:20px;font-weight:bold;color:#FFFFFF;">O</span>
              </div>
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#0F172A;">Good morning, ${name}!</h1>
              <p style="margin:8px 0 0 0;font-size:14px;color:#475569;">
                Here's your daily summary for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
              </p>
            </td>
          </tr>

          ${overdueTasks.length > 0 ? `
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;">
                <p style="margin:0;font-size:13px;color:#991B1B;font-weight:500;">
                  ⚠️ ${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} overdue
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <tr><td style="padding:24px 32px 0 32px;">
            ${taskRows(overdueTasks, '🔴 Overdue Tasks', '#DC2626')}
            ${taskRows(tasksDueToday, '📋 Due Today', '#2563EB')}
          </td></tr>

          <tr>
            <td style="padding:0 32px 0 32px;">
              <!-- Summary cards -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${unreadMessages > 0 ? `
                  <td width="50%" style="padding: 8px 4px 8px 0;">
                    <div style="padding:12px 16px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;">
                      <p style="margin:0;font-size:13px;color:#1D4ED8;font-weight:500;">
                        💬 ${unreadMessages} unread
                      </p>
                    </div>
                  </td>
                  ` : ''}
                  ${aiReportCount > 0 ? `
                  <td width="50%" style="padding: 8px 0 8px 4px;">
                    <div style="padding:12px 16px;background:#F5F3FF;border:1px solid #DDD6FE;border-radius:8px;">
                      <p style="margin:0;font-size:13px;color:#6D28D9;font-weight:500;">
                        🤖 ${aiReportCount} AI report${aiReportCount > 1 ? 's' : ''} ready
                      </p>
                    </div>
                  </td>
                  ` : ''}
                </tr>
              </table>
            </td>
          </tr>

          ${announcementCount > 0 ? `
          <tr>
            <td style="padding:16px 32px 0 32px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #7C3AED;">
                📢 Announcements (${announcementCount})
              </h3>
              ${activeAnnouncements.map((a: any) => `
                <div style="padding: 10px 12px; margin-bottom: 6px; background: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 8px;">
                  <p style="margin: 0; font-size: 13px; color: #0F172A; font-weight: 500;">${a.title}</p>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748B;">
                    ${new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              `).join('')}
            </td>
          </tr>
          ` : ''}

          <tr>
            <td style="padding:24px 32px 32px 32px;">
              <div style="border-top:1px solid #E2E8F0;padding-top:16px;">
                <p style="margin:0;font-size:11px;color:#94A3B8;text-align:center;">
                  OptivianAI · Daily Digest · <a href="#" style="color:#2563EB;text-decoration:none;">View in app</a>
                </p>
                <p style="margin:4px 0 0 0;font-size:10px;color:#CBD5E1;text-align:center;">
                  Change your preferences in Settings → Notification Preferences
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
