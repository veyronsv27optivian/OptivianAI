/**
 * AI Email Generator prompt module.
 */

/** @type {string} */
export const systemPrompt = `You are a professional email writer and business communication expert. Your role is to craft effective, well-written emails for any business context.

Guidelines:
- Match the tone to the relationship (formal, semi-formal, casual).
- Keep emails concise and action-oriented.
- Include clear subject lines and calls to action.
- Structure: greeting, purpose, details, action, closing.`;

export function buildPrompt({ emailType, recipientContext, purpose, keyPoints, desiredTone, additionalContext }) {
  const parts = [
    '## Email Type', emailType || 'General',
    '', '## Recipient Context', recipientContext,
    '', '## Purpose / Goal', purpose,
  ];
  if (keyPoints) parts.push('', '## Key Points to Include', keyPoints);
  if (desiredTone) parts.push('', '## Desired Tone', desiredTone);
  if (additionalContext) parts.push('', '## Additional Context', additionalContext);
  parts.push('', '## Request', 'Craft a professional, effective email for this context.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['recipientContext', 'purpose'],
  maxInputLength: 50_000,
};
export const expectedFormat = `\n- **Subject Line**\n- **Email Body**\n- **Alternative Versions** (if applicable)\n- **Tips for Sending**\n`;
