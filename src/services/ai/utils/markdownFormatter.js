/**
 * Markdown formatter.
 *
 * Provides consistent markdown rendering for AI outputs.
 * Ensures all AI-generated content follows a uniform formatting style.
 */
export const markdownFormatter = {
  /**
   * Bold text.
   * @param {string} text
   * @returns {string}
   */
  bold(text) {
    return `**${text}**`;
  },

  /**
   * Italic text.
   * @param {string} text
   * @returns {string}
   */
  italic(text) {
    return `*${text}*`;
  },

  /**
   * Inline code.
   * @param {string} code
   * @returns {string}
   */
  inlineCode(code) {
    return `\`${code}\``;
  },

  /**
   * Code block with optional language.
   * @param {string} code
   * @param {string} [language]
   * @returns {string}
   */
  codeBlock(code, language = '') {
    return `\`\`\`${language}\n${code}\n\`\`\``;
  },

  /**
   * Bullet list from an array of items.
   * @param {string[]} items
   * @returns {string}
   */
  bulletList(items) {
    return items.map((item) => `- ${item}`).join('\n');
  },

  /**
   * Numbered list from an array of items.
   * @param {string[]} items
   * @returns {string}
   */
  numberedList(items) {
    return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
  },

  /**
   * Heading at the specified level (1-6).
   * @param {string} text
   * @param {number} [level=2]
   * @returns {string}
   */
  heading(text, level = 2) {
    const prefix = '#'.repeat(Math.max(1, Math.min(6, level)));
    return `${prefix} ${text}`;
  },

  /**
   * Horizontal rule.
   * @returns {string}
   */
  horizontalRule() {
    return '\n---\n';
  },

  /**
   * Table from headers and rows.
   * @param {string[]} headers
   * @param {string[][]} rows
   * @returns {string}
   */
  table(headers, rows) {
    const headerLine = `| ${headers.join(' | ')} |`;
    const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
    const bodyLines = rows.map((row) => `| ${row.join(' | ')} |`);
    return [headerLine, separatorLine, ...bodyLines].join('\n');
  },

  /**
   * Blockquote.
   * @param {string} text
   * @returns {string}
   */
  blockquote(text) {
    return text
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
  },
};
