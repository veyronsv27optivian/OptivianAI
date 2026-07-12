/**
 * Prompt builder.
 *
 * A fluent builder for constructing complex multi-part prompts.
 * Useful for tools that need to compose prompts from multiple
 * sources (system instructions, context, data, user input).
 *
 * @example
 *   const prompt = promptBuilder()
 *     .system('You are a helpful analyst.')
 *     .context('Analysing Q3 financial data...')
 *     .data(revenueTable)
 *     .user('What are the key trends?')
 *     .build();
 */
export const promptBuilder = () => {
  const sections = {
    system: null,
    context: [],
    data: null,
    user: null,
    instructions: [],
    examples: [],
  };

  const builder = {
    /**
     * Set the system instruction.
     * @param {string} text
     * @returns {typeof builder}
     */
    system(text) {
      sections.system = text;
      return builder;
    },

    /**
     * Add context paragraph(s).
     * @param {string} text
     * @returns {typeof builder}
     */
    context(text) {
      if (text) sections.context.push(text);
      return builder;
    },

    /**
     * Set structured data (tables, JSON, lists).
     * @param {string} text
     * @returns {typeof builder}
     */
    data(text) {
      sections.data = text;
      return builder;
    },

    /**
     * Set the user input/question.
     * @param {string} text
     * @returns {typeof builder}
     */
    user(text) {
      sections.user = text;
      return builder;
    },

    /**
     * Add an instruction (formatting, constraints, output format).
     * @param {string} text
     * @returns {typeof builder}
     */
    instruction(text) {
      if (text) sections.instructions.push(text);
      return builder;
    },

    /**
     * Add a few-shot example.
     * @param {string} example
     * @returns {typeof builder}
     */
    example(example) {
      if (example) sections.examples.push(example);
      return builder;
    },

    /**
     * Build the final prompt string.
     * @returns {string}
     */
    build() {
      const parts = [];

      if (sections.system) {
        parts.push(`[System]\n${sections.system}`);
      }

      if (sections.context.length > 0) {
        parts.push(`[Context]\n${sections.context.join('\n\n')}`);
      }

      if (sections.data) {
        parts.push(`[Data]\n${sections.data}`);
      }

      if (sections.instructions.length > 0) {
        parts.push(`[Instructions]\n${sections.instructions.join('\n')}`);
      }

      if (sections.examples.length > 0) {
        parts.push(`[Examples]\n${sections.examples.join('\n\n---\n\n')}`);
      }

      if (sections.user) {
        parts.push(`[User]\n${sections.user}`);
      }

      return parts.join('\n\n');
    },

    /**
     * Clear all sections for reuse.
     * @returns {typeof builder}
     */
    reset() {
      sections.system = null;
      sections.context = [];
      sections.data = null;
      sections.user = null;
      sections.instructions = [];
      sections.examples = [];
      return builder;
    },
  };

  return builder;
};
