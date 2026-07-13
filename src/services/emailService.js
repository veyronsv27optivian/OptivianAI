/**
 * ─── Email Notification Service ──────────────────────────────────
 * Sends transactional emails via SendGrid or Resend.
 *
 * SETUP:
 *   1. Create a SendGrid OR Resend account
 *   2. Add API key to .env:
 *        VITE_SENDGRID_API_KEY=SG.xxxx
 *        VITE_SENDGRID_FROM_EMAIL=noreply@yourdomain.com
 *      OR
 *        VITE_RESEND_API_KEY=re_xxxx
 *        VITE_RESEND_FROM_EMAIL=noreply@yourdomain.com
 *   3. Set VITE_EMAIL_PROVIDER=sendgrid or VITE_EMAIL_PROVIDER=resend
 *
 * In DEV_MODE, emails are logged to console instead of sent.
 */

// ─── Configuration ───────────────────────────────────────────────

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;

function getConfig() {
  const provider = import.meta.env.VITE_EMAIL_PROVIDER || 'sendgrid';

  if (provider === 'resend') {
    return {
      provider: 'resend',
      apiKey: import.meta.env.VITE_RESEND_API_KEY,
      fromEmail: import.meta.env.VITE_RESEND_FROM_EMAIL || 'noreply@optivian.ai',
      endpoint: 'https://api.resend.com/emails',
    };
  }

  // Default: SendGrid
  return {
    provider: 'sendgrid',
    apiKey: import.meta.env.VITE_SENDGRID_API_KEY,
    fromEmail: import.meta.env.VITE_SENDGRID_FROM_EMAIL || 'noreply@optivian.ai',
    endpoint: 'https://api.sendgrid.com/v3/mail/send',
  };
}

// ─── Email templates ─────────────────────────────────────────────

const TEMPLATES = {
  task_assigned: (data) => ({
    subject: `[OptivianAI] New Task: ${data.taskTitle || 'Task Assigned'}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1e293b;">New Task Assigned</h2>
        <p style="color: #475569;">Hi ${data.assigneeName || 'there'},</p>
        <p style="color: #475569;">You've been assigned a new task:</p>
        <div style="background: #f8fafc; border-left: 3px solid #3b82f6; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: 600; color: #1e293b;">${data.taskTitle || 'Untitled Task'}</p>
          ${data.taskDescription ? `<p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">${data.taskDescription}</p>` : ''}
        </div>
        ${data.dueDate ? `<p style="color: #ef4444; font-size: 14px;">⚠ Due: ${new Date(data.dueDate).toLocaleDateString()}</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="${data.taskUrl || '#'}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px;">View Task</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">OptivianAI — AI-Powered Enterprise OS</p>
      </div>
    `,
  }),

  task_due_soon: (data) => ({
    subject: `⏰ Task Due Soon: ${data.taskTitle || 'Task'}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Task Due Reminder</h2>
        <p style="color: #475569;">Hi ${data.assigneeName || 'there'},</p>
        <p style="color: #475569;">This task is due <strong>${data.dueIn || 'soon'}</strong>:</p>
        <div style="background: #fef2f2; border-left: 3px solid #dc2626; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: 600; color: #991b1b;">${data.taskTitle || 'Untitled Task'}</p>
          <p style="margin: 8px 0 0; color: #dc2626; font-size: 14px;">Due: ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'N/A'}</p>
        </div>
        <p style="margin-top: 20px;">
          <a href="${data.taskUrl || '#'}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px;">View & Complete</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">OptivianAI — AI-Powered Enterprise OS</p>
      </div>
    `,
  }),

  task_overdue: (data) => ({
    subject: `🔴 Overdue: ${data.taskTitle || 'Task'}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #991b1b;">Task Overdue</h2>
        <p style="color: #475569;">Hi ${data.assigneeName || 'there'},</p>
        <p style="color: #475569;">This task is now <strong>overdue</strong>:</p>
        <div style="background: #fef2f2; border-left: 3px solid #991b1b; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: 600; color: #991b1b;">${data.taskTitle || 'Untitled Task'}</p>
          <p style="margin: 8px 0 0; color: #991b1b; font-size: 14px;">Was due: ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'N/A'}<br/>Overdue by: ${data.overdueBy || 'N/A'}</p>
        </div>
        <p style="margin-top: 20px;">
          <a href="${data.taskUrl || '#'}" style="background: #991b1b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px;">View Task</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">OptivianAI — AI-Powered Enterprise OS</p>
      </div>
    `,
  }),

  chat_message: (data) => ({
    subject: `💬 New message from ${data.senderName || 'someone'} on OptivianAI`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1e293b;">New Message</h2>
        <p style="color: #475569;"><strong>${data.senderName || 'Someone'}</strong> sent you a message:</p>
        <div style="background: #f8fafc; border-left: 3px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; color: #475569; font-size: 14px;">${data.messagePreview || ''}</p>
        </div>
        <p style="margin-top: 20px;">
          <a href="${data.chatUrl || '#'}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px;">Open Chat</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">OptivianAI — AI-Powered Enterprise OS</p>
      </div>
    `,
  }),

  ai_report: (data) => ({
    subject: `📊 Your AI Report: ${data.reportName || 'Analysis Complete'}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1e293b;">AI Analysis Complete</h2>
        <p style="color: #475569;">Hi ${data.userName || 'there'},</p>
        <p style="color: #475569;">Your AI ${data.reportType || 'analysis'} is ready:</p>
        <div style="background: #f0fdf4; border-left: 3px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: 600; color: #166534;">${data.reportName || 'AI Report'}</p>
          ${data.summary ? `<p style="margin: 8px 0 0; color: #475569; font-size: 14px;">${data.summary}</p>` : ''}
        </div>
        <p style="margin-top: 20px;">
          <a href="${data.reportUrl || '#'}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px;">View Report</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">OptivianAI — AI-Powered Enterprise OS</p>
      </div>
    `,
  }),
};

// ─── Core send function ──────────────────────────────────────────

/**
 * Send an email via the configured email provider (SendGrid or Resend).
 *
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} html - HTML email body.
 * @param {object} [options] - Additional options.
 * @param {string} [options.from] - Override sender email.
 * @returns {Promise<{success: boolean, error?: string, id?: string}>}
 */
async function sendEmail(to, subject, html, options = {}) {
  if (!to) {
    return { success: false, error: 'Recipient email is required' };
  }

  const config = getConfig();

  if (DEV_MODE) {
    console.log('[📧 DEV MODE] Email would be sent:', {
      to,
      from: options.from || config.fromEmail,
      subject,
      htmlLength: html.length,
    });
    return { success: true, id: `dev-${Date.now()}` };
  }

  if (!config.apiKey) {
    return {
      success: false,
      error: `Email provider (${config.provider}) is not configured. Add VITE_${config.provider.toUpperCase()}_API_KEY to your .env file.`,
    };
  }

  try {
    const body = config.provider === 'resend'
      ? {
          from: options.from || config.fromEmail,
          to: [to],
          subject,
          html,
        }
      : {
          personalizations: [{ to: [{ email: to }] }],
          from: { email: options.from || config.fromEmail },
          subject,
          content: [{ type: 'text/html', value: html }],
        };

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.provider === 'resend'
          ? { Authorization: `Bearer ${config.apiKey}` }
          : { Authorization: `Bearer ${config.apiKey}` }
        ),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      return {
        success: false,
        error: `Email API error (${response.status}): ${errorBody || response.statusText}`,
      };
    }

    const result = await response.json().catch(() => ({}));
    return { success: true, id: result.id || result.message_id || 'sent' };
  } catch (err) {
    return { success: false, error: `Failed to send email: ${err.message}` };
  }
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Send a notification email using a named template.
 *
 * @param {string} templateName - One of 'task_assigned', 'task_due_soon', 'task_overdue', 'chat_message', 'ai_report'.
 * @param {string} to - Recipient email.
 * @param {object} data - Template data.
 * @returns {Promise<{success: boolean, error?: string, id?: string}>}
 */
export async function sendNotificationEmail(templateName, to, data = {}) {
  const template = TEMPLATES[templateName];
  if (!template) {
    return { success: false, error: `Unknown template: ${templateName}` };
  }

  const { subject, html } = template(data);
  return sendEmail(to, subject, html);
}

/**
 * Send a raw email (custom content).
 *
 * @param {string} to - Recipient email.
 * @param {string} subject - Email subject.
 * @param {string} html - HTML body.
 * @returns {Promise<{success: boolean, error?: string, id?: string}>}
 */
export async function sendRawEmail(to, subject, html) {
  return sendEmail(to, subject, html);
}

/**
 * Check if email is configured (has API key).
 * @returns {boolean}
 */
export function isEmailConfigured() {
  if (DEV_MODE) return true; // Always ready in dev (logs to console)
  const config = getConfig();
  return !!config.apiKey;
}

/**
 * Get the active email provider name.
 * @returns {string}
 */
export function getEmailProvider() {
  return getConfig().provider;
}
