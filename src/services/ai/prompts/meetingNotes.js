/**
 * Meeting Notes prompt module.
 *
 * Converts meeting transcripts or raw notes into structured,
 * professional meeting summaries with action items.
 */

/** @type {string} */
export const systemPrompt = `You are a professional meeting scribe and note-taker. Your role is to convert meeting transcripts or raw notes into clear, structured, and actionable meeting summaries.

Guidelines:
- Organise notes by agenda topic in chronological order.
- Capture: date, attendees, key discussion points, decisions made, action items, and next steps.
- Clearly distinguish between decisions, discussions, and action items.
- Assign action items to specific individuals with deadlines where mentioned.
- Flag any unresolved issues or items requiring follow-up.
- Maintain a neutral, objective tone.
- Use consistent formatting for easy scanning.`;

/**
 * Build a Meeting Notes prompt.
 *
 * @param {object} params
 * @param {string} params.transcript - Meeting transcript or raw notes.
 * @param {string} params.meetingTitle - Title of the meeting.
 * @param {string} [params.date] - Meeting date.
 * @param {string} [params.attendees] - List of attendees.
 * @param {string} [params.agenda] - Meeting agenda.
 * @param {string} [params.format] - Desired output format (brief, detailed, action-focused).
 * @returns {string}
 */
export function buildPrompt({ transcript, meetingTitle, date, attendees, agenda, format }) {
  const parts = [
    '## Meeting Title',
    meetingTitle,
    '',
    '## Transcript / Raw Notes',
    transcript,
  ];

  if (date) parts.push('', '## Date', date);
  if (attendees) parts.push('', '## Attendees', attendees);
  if (agenda) parts.push('', '## Agenda', agenda);
  if (format) parts.push('', '## Desired Format', format);

  parts.push('', '## Request', 'Convert these meeting notes into a structured, professional summary with clear action items.');

  return parts.join('\n');
}

/** @type {{ requiredFields: string[], maxInputLength: number }} */
export const validation = {
  requiredFields: ['transcript', 'meetingTitle'],
  maxInputLength: 100_000,
};

/** @type {string} */
export const expectedFormat = `
- **Meeting Title & Meta** (date, attendees)
- **Summary** (brief overview)
- **Discussion Points** (by agenda topic)
- **Decisions Made**
- **Action Items** (owner, deadline)
- **Next Steps / Follow-ups**
`;
