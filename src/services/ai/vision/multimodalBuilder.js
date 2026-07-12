/**
 * Multimodal content builder.
 *
 * Constructs multimodal payloads for vision-capable providers
 * (Gemini, Qwen VL, and future multimodal providers).
 *
 * Converts file references (URLs, base64, File objects) into
 * the provider-specific content format expected by each provider.
 */

/**
 * @typedef {Object} ImageInput
 * @property {string} [url] - Public URL of the image.
 * @property {string} [base64] - Base64-encoded image data.
 * @property {string} [mimeType] - MIME type (image/png, image/jpeg, application/pdf, etc.).
 * @property {string|File} [file] - File object or path.
 * @property {string} [altText] - Alternative text description.
 */

/**
 * Build a multimodal content array for OpenAI-compatible APIs (OpenRouter).
 *
 * @param {string} text - The text prompt.
 * @param {ImageInput[]} images - Array of image inputs.
 * @returns {Array<{ type: string, text?: string, image_url?: { url: string } }>}
 */
function buildOpenAIMultimodal(text, images = []) {
  const content = [{ type: 'text', text }];

  for (const img of images) {
    if (img.url) {
      content.push({ type: 'image_url', image_url: { url: img.url } });
    } else if (img.base64) {
      const mime = img.mimeType || 'image/png';
      content.push({
        type: 'image_url',
        image_url: { url: `data:${mime};base64,${img.base64}` },
      });
    } else if (img.file) {
      // File object — will be handled by the caller with blob URL
      content.push({
        type: 'image_url',
        image_url: { url: URL.createObjectURL(img.file) },
      });
    }
  }

  return content;
}

/**
 * Build a Gemini-compatible inline data part.
 *
 * @param {string} text - The text prompt.
 * @param {ImageInput[]} images - Array of image inputs.
 * @returns {{ parts: Array<{ text?: string, inlineData?: { mimeType: string, data: string } }> }}
 */
function buildGeminiMultimodal(text, images = []) {
  const parts = [{ text }];

  for (const img of images) {
    if (img.base64) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/png',
          data: img.base64,
        },
      });
    } else if (img.url) {
      // Gemini prefers inlineData, but fileData can also work
      parts.push({
        fileData: {
          mimeType: img.mimeType || 'image/png',
          fileUri: img.url,
        },
      });
    }
  }

  return { parts };
}

export const multimodalBuilder = {
  /**
   * Build content for the specified provider format.
   *
   * @param {string} provider - Provider name ('gemini', 'qwen', 'deepseek').
   * @param {string} text - Text prompt.
   * @param {ImageInput[]} [images] - Image inputs.
   * @returns {object} Provider-specific content structure.
   */
  build(provider, text, images = []) {
    if (provider === 'gemini') {
      return buildGeminiMultimodal(text, images);
    }

    // OpenAI-compatible (OpenRouter: DeepSeek, Qwen, and others)
    return buildOpenAIMultimodal(text, images);
  },

  /**
   * Convert a File or Blob to base64.
   *
   * @param {File|Blob} file
   * @returns {Promise<{ base64: string, mimeType: string }>}
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          // Remove the data:...;base64, prefix
          const base64 = result.split(',')[1];
          resolve({ base64, mimeType: file.type });
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Check if the given provider supports multimodal (vision) input.
   *
   * @param {string} providerName
   * @returns {boolean}
   */
  supportsMultimodal(providerName) {
    const visionProviders = ['gemini', 'qwen'];
    return visionProviders.includes(providerName.toLowerCase());
  },
};
