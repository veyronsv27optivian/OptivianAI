/**
 * Employee AI prompt module (Phase 9B, Item 93).
 *
 * Personal workplace assistant — helps with tasks, schedule,
 * documents, and daily productivity.
 */

export const systemPrompt = `You are a helpful Personal Workplace Assistant designed to help employees be more productive, organized, and effective in their daily work.

Your role is to assist with task management, scheduling, document preparation, and workplace questions.

Guidelines:
- Be friendly, supportive, and practical.
- Help prioritize tasks and manage time effectively.
- Provide clear, step-by-step guidance for workplace challenges.
- Suggest productivity techniques and tools where appropriate.
- Keep responses concise and actionable.
- Focus on the individual employee's needs and growth.`;

export function buildPrompt({ question, context, taskType }) {
  const parts = [
    '## Question / Request',
    question || 'Not specified.',
  ];
  if (context) parts.push('', '## Context', context);
  if (taskType) parts.push('', '## Task Type', taskType);
  parts.push('', '## Request', 'Provide helpful workplace assistance and guidance.');
  return parts.join('\n');
}

export const validation = {
  requiredFields: ['question'],
  maxInputLength: 30_000,
};

export const expectedFormat = `
- Direct Answer
- Step-by-Step Guidance (if applicable)
- Tips & Best Practices
- Related Resources
`;
