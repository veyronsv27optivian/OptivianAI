/**
 * Document processor.
 *
 * Backend utilities for processing business documents:
 * PDF analysis, business document analysis, and pitch deck analysis.
 *
 * No UI — only backend architecture. Document content is extracted
 * client-side (or server-side via an endpoint) and passed to AI prompts.
 */
import { generateText } from '../aiService';
import { documentAnalyzer, pitchDeckAssistant } from '../prompts';

/**
 * @typedef {Object} ParsedDocument
 * @property {string} text - Extracted text content.
 * @property {number} pageCount - Number of pages (if available).
 * @property {object} [metadata] - Document metadata (title, author, etc.).
 * @property {string} [rawFormat] - Original format (pdf, docx, txt, etc.).
 */

/**
 * @typedef {Object} DocumentAnalysisResult
 * @property {string} summary - Concise document summary.
 * @property {string[]} keyPoints - Key points extracted.
 * @property {object} [structuredData] - Structured data (if applicable).
 * @property {string[]} [risks] - Potential risks or issues.
 * @property {string[]} [actionItems] - Action items extracted.
 */

export const documentProcessor = {
  /**
   * Analyse a business document (text content).
   * The actual OCR/PDF extraction should happen client-side before calling this.
   *
   * @param {object} params
   * @param {string} params.content - Extracted document text.
   * @param {string} params.documentType - Type of document.
   * @param {string} [params.analysisType] - Type of analysis (summary, deep, risk-focused).
   * @returns {Promise<DocumentAnalysisResult>}
   */
  async analyseDocument({ content, documentType, analysisType = 'summary' }) {
    const prompt = documentAnalyzer.buildPrompt({
      documentContent: content,
      documentType,
      analysisFocus: analysisType === 'risk' ? 'risks, red flags, and issues' : 'key insights and summary',
    });

    const result = await generateText('document_analysis', prompt, {
      systemPrompt: documentAnalyzer.systemPrompt,
    });

    return {
      summary: result.text,
      keyPoints: [],
      structuredData: null,
      risks: [],
      actionItems: [],
      raw: result,
    };
  },

  /**
   * Analyse a pitch deck from its content.
   *
   * @param {object} params
   * @param {string} params.content - Extracted pitch deck content.
   * @param {string} params.targetAudience - Target audience for the pitch.
   * @param {string} [params.pitchGoal] - Goal of the pitch.
   * @returns {Promise<object>}
   */
  async analysePitchDeck({ content, targetAudience, pitchGoal }) {
    const prompt = pitchDeckAssistant.buildPrompt({
      companyDescription: content,
      pitchGoal: pitchGoal || 'fundraising',
      targetAudience,
    });

    const result = await generateText('pitch_deck_analysis', prompt, {
      systemPrompt: pitchDeckAssistant.systemPrompt,
    });

    return {
      analysis: result.text,
      raw: result,
    };
  },

  /**
   * Validate that a document has sufficient content for analysis.
   *
   * @param {string} content
   * @returns {{ valid: boolean, reason: string|null }}
   */
  validateContent(content) {
    if (!content || content.trim().length === 0) {
      return { valid: false, reason: 'Document content is empty' };
    }
    if (content.trim().length < 50) {
      return { valid: false, reason: 'Document content is too short for meaningful analysis (min 50 chars)' };
    }
    return { valid: true, reason: null };
  },

  /**
   * Estimate the document's suitability for AI analysis.
   *
   * @param {string} content
   * @param {string} documentType
   * @returns {{ score: number, message: string }}
   */
  estimateAnalysisQuality(content, documentType) {
    const length = content.length;
    let score = 0;

    if (length > 10000) score = 100;
    else if (length > 5000) score = 80;
    else if (length > 1000) score = 60;
    else if (length > 200) score = 40;
    else score = 20;

    const expectedTypes = ['contract', 'proposal', 'report', 'article', 'deck', 'memo'];
    const typeMatch = expectedTypes.includes(documentType?.toLowerCase());
    if (typeMatch) score = Math.min(100, score + 10);

    return {
      score,
      message:
        score >= 80
          ? 'Document is well-suited for AI analysis'
          : score >= 50
            ? 'Document is adequate for AI analysis'
            : 'Document may be too short for comprehensive analysis',
    };
  },
};
