/**
 * Meeting Notes tool.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { meetingNotes } from '../prompts';

export class MeetingNotesTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.SUMMARIZATION;
  }

  buildPrompt(params) {
    return {
      systemPrompt: meetingNotes.systemPrompt,
      prompt: meetingNotes.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.transcript) errors.push('transcript is required');
    if (!params.meetingTitle) errors.push('meetingTitle is required');
    return { valid: errors.length === 0, errors };
  }
}
