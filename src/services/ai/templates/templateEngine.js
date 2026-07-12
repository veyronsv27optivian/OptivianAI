/**
 * Template engine.
 *
 * A lightweight template engine for constructing prompts.
 * Supports variable interpolation, partials, and conditionals.
 *
 * Every new AI tool can register its own templates here, making it
 * extremely easy to add new tools without duplicating prompt logic.
 *
 * @example
 *   import { renderTemplate, TEMPLATES } from '../templates';
 *   const prompt = renderTemplate(TEMPLATES.BUSINESS_ADVISOR, { context: '...', challenge: '...' });
 */

/** @type {Object<string, string>} */
const templateRegistry = {};

/** @type {string[]} */
const builtInTemplates = [];

/**
 * Register a template string.
 *
 * @param {string} name - Unique template name (e.g., 'business_advisor').
 * @param {string} template - Template string with {{variable}} placeholders.
 */
export function registerTemplate(name, template) {
  templateRegistry[name] = template;
}

/**
 * Render a template by substituting variables.
 *
 * @param {string} name - Registered template name.
 * @param {object} variables - Key-value pairs to substitute.
 * @param {object} [options]
 * @param {boolean} [options.stripMissing=false] - If true, remove {{missing}} placeholders instead of leaving them.
 * @returns {string} The rendered template.
 * @throws {Error} If the template is not registered.
 */
export function renderTemplate(name, variables = {}, options = {}) {
  const template = templateRegistry[name];
  if (!template) {
    throw new Error(`Template "${name}" not found. Registered templates: ${Object.keys(templateRegistry).join(', ')}`);
  }

  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(placeholder, value ?? '');
  }

  if (options.stripMissing) {
    result = result.replace(/\{\{\s*\w+\s*\}\}/g, '');
  }

  return result;
}

/**
 * Get a registered template by name.
 *
 * @param {string} name
 * @returns {string|undefined}
 */
export function getTemplate(name) {
  return templateRegistry[name];
}

/**
 * List all registered template names.
 *
 * @returns {string[]}
 */
export function listTemplates() {
  return Object.keys(templateRegistry);
}

// ─── Built-in templates ──────────────────────────────────────────

const ADVISOR_TEMPLATE = `## Business Context
{{businessContext}}

## Challenge / Question
{{challenge}}

{{#if industry}}
## Industry
{{industry}}
{{/if}}

{{#if goals}}
## Business Goals
{{goals}}
{{/if}}

## Request
Provide strategic business advice and actionable recommendations based on the above context.`;

const ANALYSIS_TEMPLATE = `## Subject of Analysis
{{subject}}

## Context
{{context}}

{{#if industry}}
## Industry
{{industry}}
{{/if}}

## Request
{{request}}`;

const REPORT_TEMPLATE = `## Report Topic
{{topic}}

## Data & Context
{{data}}

## Report Type
{{reportType}}

{{#if audience}}
## Target Audience
{{audience}}
{{/if}}

## Request
Generate a professional, well-structured report based on the provided data and specifications.`;

// Register built-in templates
registerTemplate('business_advisor', ADVISOR_TEMPLATE);
registerTemplate('analysis', ANALYSIS_TEMPLATE);
registerTemplate('report', REPORT_TEMPLATE);
registerTemplate('swot_analysis', `## Subject of Analysis\n{{subject}}\n\n## Context\n{{context}}\n\n{{#if industry}}\n## Industry\n{{industry}}\n{{/if}}\n\n## Request\nPerform a comprehensive SWOT analysis with actionable strategies.`);
registerTemplate('decision_simulation', `## Decision to Simulate\n{{decision}}\n\n## Current Context\n{{context}}\n\n{{#if options}}\n## Options to Evaluate\n{{options}}\n{{/if}}\n\n## Request\nSimulate the outcomes of this decision across multiple scenarios.`);
registerTemplate('meeting_notes', `## Meeting Title\n{{meetingTitle}}\n\n## Transcript / Raw Notes\n{{transcript}}\n\n{{#if date}}\n## Date\n{{date}}\n{{/if}}\n\n## Request\nConvert these meeting notes into a structured summary with clear action items.`);

export const TEMPLATES = {
  BUSINESS_ADVISOR: 'business_advisor',
  ANALYSIS: 'analysis',
  REPORT: 'report',
  SWOT_ANALYSIS: 'swot_analysis',
  DECISION_SIMULATION: 'decision_simulation',
  MEETING_NOTES: 'meeting_notes',
};
