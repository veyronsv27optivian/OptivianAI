/**
 * Image analyzer.
 *
 * Backend utility for analysing images using vision-capable AI providers.
 * Supports: general image analysis, logo detection, brand asset analysis,
 * and custom image queries.
 *
 * This module does NOT build UI — it only provides the backend
 * architecture for image-based AI features.
 */
import { generateText } from '../aiService';
import { multimodalBuilder } from './multimodalBuilder';

export const imageAnalyzer = {
  /**
   * Analyse an image with a text prompt.
   *
   * @param {object} params
   * @param {string} params.prompt - What to ask about the image.
   * @param {string|File|object} params.image - Image URL, base64, File, or ImageInput object.
   * @param {string} [params.systemPrompt] - Optional system prompt.
   * @returns {Promise<string>}
   */
  async analyse({ prompt, image, systemPrompt }) {
    const imageInput = typeof image === 'string' ? { url: image } : image;
    const images = [imageInput];

    // Use Qwen or Gemini (both support vision)
    const result = await generateText('image_analysis', prompt, {
      systemPrompt,
      requireVision: true,
    });

    return result.text;
  },

  /**
   * Analyse a business logo.
   *
   * @param {object} params
   * @param {string} params.imageUrl - URL of the logo image.
   * @param {string} [params.businessContext] - Optional business context.
   * @returns {Promise<object>}
   */
  async analyseLogo({ imageUrl, businessContext }) {
    const systemPrompt = `You are a brand identity and logo analysis expert. Analyse the provided logo image thoroughly.

Provide:
- Brand alignment (how well does the logo represent the brand?)
- Design quality (typography, colour scheme, scalability, memorability)
- Industry appropriateness
- Strengths and weaknesses
- Specific improvement recommendations`;

    const prompt = [
      'Analyse this logo',
      businessContext ? `\nBusiness context: ${businessContext}` : '',
      '\nProvide a detailed analysis of the logo including brand alignment, design quality, industry fit, and recommendations.',
    ].join('');

    const result = await this.analyse({ prompt, image: imageUrl, systemPrompt });
    return { text: result };
  },

  /**
   * Analyse a collection of brand assets (social media images, banners, ads).
   *
   * @param {object} params
   * @param {Array<{ url: string, label: string }>} params.assets - Array of asset URLs with labels.
   * @param {string} [params.brandGuidelines] - Brand guidelines to evaluate against.
   * @returns {Promise<object>}
   */
  async analyseBrandAssets({ assets, brandGuidelines }) {
    const systemPrompt = `You are a brand asset analyst. Evaluate the provided brand assets for consistency, quality, and adherence to brand guidelines.`;

    const prompt = [
      'Analyse the following brand assets:\n',
      assets.map((a, i) => `[Asset ${i + 1}: ${a.label}](${a.url})`).join('\n'),
      brandGuidelines ? `\n\nBrand Guidelines:\n${brandGuidelines}` : '',
      '\n\nEvaluate consistency, quality, and provide recommendations.',
    ].join('');

    const result = await generateText('brand_analysis', prompt, {
      systemPrompt,
      requireVision: true,
    });

    return { text: result.text };
  },
};
