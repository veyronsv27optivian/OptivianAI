/**
 * Templates barrel.
 *
 * Reusable template helpers and prompt construction utilities.
 * Makes it easy to compose prompts, inject context, and manage
 * template variables consistently across all AI features.
 */

export { renderTemplate, registerTemplate, getTemplate, listTemplates, TEMPLATES } from './templateEngine';
export { promptBuilder } from './promptBuilder';
