/**
 * Response validator.
 *
 * Validates AI responses against expected schemas and formats.
 * Each prompt module defines its own expected format and can use
 * these validators to ensure responses are structurally correct.
 */
export const responseValidator = {
  /**
   * Validate that the response contains required fields.
   *
   * @param {object} response - Parsed response object.
   * @param {string[]} requiredFields - Array of required field names.
   * @returns {{ valid: boolean, missing: string[] }}
   */
  hasFields(response, requiredFields) {
    if (!response || typeof response !== 'object') {
      return { valid: false, missing: requiredFields };
    }

    const missing = requiredFields.filter((field) => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], response);
      return value === undefined || value === null || value === '';
    });

    return { valid: missing.length === 0, missing };
  },

  /**
   * Validate that a value is within an expected numeric range.
   *
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {{ valid: boolean, message: string|null }}
   */
  inRange(value, min, max) {
    if (typeof value !== 'number' || isNaN(value)) {
      return { valid: false, message: `Value must be a number between ${min} and ${max}` };
    }
    if (value < min || value > max) {
      return { valid: false, message: `Value ${value} is outside allowed range [${min}, ${max}]` };
    }
    return { valid: true, message: null };
  },

  /**
   * Validate that a value is one of the allowed options.
   *
   * @param {any} value
   * @param {any[]} allowedValues
   * @returns {{ valid: boolean, message: string|null }}
   */
  oneOf(value, allowedValues) {
    if (!allowedValues.includes(value)) {
      return {
        valid: false,
        message: `"${value}" is not one of: ${allowedValues.join(', ')}`,
      };
    }
    return { valid: true, message: null };
  },

  /**
   * Validate that a string does not exceed max length.
   *
   * @param {string} value
   * @param {number} maxLength
   * @returns {{ valid: boolean, message: string|null }}
   */
  maxLength(value, maxLength) {
    if (typeof value === 'string' && value.length > maxLength) {
      return {
        valid: false,
        message: `String exceeds max length of ${maxLength} (current: ${value.length})`,
      };
    }
    return { valid: true, message: null };
  },

  /**
   * Validate that an array is non-empty.
   *
   * @param {any[]} arr
   * @returns {{ valid: boolean, message: string|null }}
   */
  nonEmptyArray(arr) {
    if (!Array.isArray(arr) || arr.length === 0) {
      return { valid: false, message: 'Expected a non-empty array' };
    }
    return { valid: true, message: null };
  },

  /**
   * Validate a complete response against a schema definition.
   * Schema format: { fieldName: 'string'|'number'|'boolean'|'array'|'object' }
   *
   * @param {object} response
   * @param {object} schema
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateSchema(response, schema) {
    const errors = [];

    for (const [field, type] of Object.entries(schema)) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], response);

      if (value === undefined || value === null) {
        errors.push(`Missing required field: "${field}"`);
        continue;
      }

      const expectedType = typeof type === 'string' ? type : type.type;
      const isOptional = typeof type === 'object' && type.optional;

      if (!isOptional) {
        if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push(`Field "${field}" must be an array`);
        } else if (expectedType !== 'array' && typeof value !== expectedType) {
          errors.push(`Field "${field}" must be of type "${expectedType}", got "${typeof value}"`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
