/**
 * Vision-Ready Architecture barrel.
 *
 * Backend utilities for image and document analysis.
 * Prepares the system for: PDF analysis, image analysis, logo analysis,
 * business document analysis, and pitch deck analysis.
 *
 * No UI is built here — only the backend architecture.
 *
 * Each analyser returns structured data that can be consumed by
 * AI prompts and tools via the existing provider architecture.
 */

export { imageAnalyzer } from './imageAnalyzer';
export { documentProcessor } from './documentProcessor';
export { multimodalBuilder } from './multimodalBuilder';
