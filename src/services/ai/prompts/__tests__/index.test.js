/**
 * Unit tests for prompts barrel (index.js).
 *
 * Verifies that all 36 namespace exports from the barrel file
 * resolve correctly and each one contains the expected exports:
 *   - systemPrompt (string)
 *   - buildPrompt (function)
 *   - validation (object)
 *   - expectedFormat (string)
 */
import { describe, it, expect } from 'vitest';
import {
  businessAdvisor,
  requirementAnalyzer,
  decisionSimulation,
  futureLab,
  socialMediaAnalysis,
  swotAnalysis,
  marketingStrategy,
  financialForecast,
  competitorAnalysis,
  launchReadiness,
  reportGenerator,
  pitchDeckAssistant,
  meetingNotes,
  riskAssessment,
  documentAnalyzer,
  businessPlanGenerator,
  salesAdvisor,
  financialAdvisor,
  hrAdvisor,
  startupValidator,
  productAnalyzer,
  customerPersonaGenerator,
  brandAnalysis,
  seoAnalysis,
  aiProposalGenerator,
  aiPresentationGenerator,
  aiEmailGenerator,
  aiBrainstorm,
  aiCustomAssistant,
  resumeAnalyzer,
  contractAnalyzer,
  pdfAnalyzer,
  wordAnalyzer,
  excelAnalyzer,
  csvAnalyzer,
  powerpointAnalyzer,
  websiteAnalyzer,
  youtubeAnalyzer,
} from '../index';

/** Minimum required exports each prompt module must have */
const REQUIRED_EXPORTS = ['systemPrompt', 'buildPrompt', 'validation', 'expectedFormat'];

/**
 * Test a single prompt namespace object for the required shape.
 */
function testPromptModule(name, mod) {
  describe(name, () => {
    it('should be defined and not null', () => {
      expect(mod).toBeDefined();
      expect(mod).not.toBeNull();
    });

    it('should be an object', () => {
      expect(typeof mod).toBe('object');
    });

    REQUIRED_EXPORTS.forEach((exp) => {
      it(`should export "${exp}"`, () => {
        expect(mod).toHaveProperty(exp);
      });
    });

    it('systemPrompt should be a non-empty string', () => {
      expect(typeof mod.systemPrompt).toBe('string');
      expect(mod.systemPrompt.length).toBeGreaterThan(0);
    });

    it('buildPrompt should be a function', () => {
      expect(typeof mod.buildPrompt).toBe('function');
    });

    it('buildPrompt should return a string when called with empty params', () => {
      const result = mod.buildPrompt({});
      expect(typeof result).toBe('string');
    });

    it('validation should be an object with requiredFields and maxInputLength', () => {
      expect(typeof mod.validation).toBe('object');
      expect(Array.isArray(mod.validation.requiredFields)).toBe(true);
      expect(typeof mod.validation.maxInputLength).toBe('number');
    });

    it('expectedFormat should be a non-empty string', () => {
      expect(typeof mod.expectedFormat).toBe('string');
      expect(mod.expectedFormat.length).toBeGreaterThan(0);
    });
  });
}

// ─── Run tests for every prompt module ──────────────────────────

const promptModules = {
  businessAdvisor,
  requirementAnalyzer,
  decisionSimulation,
  futureLab,
  socialMediaAnalysis,
  swotAnalysis,
  marketingStrategy,
  financialForecast,
  competitorAnalysis,
  launchReadiness,
  reportGenerator,
  pitchDeckAssistant,
  meetingNotes,
  riskAssessment,
  documentAnalyzer,
  businessPlanGenerator,
  salesAdvisor,
  financialAdvisor,
  hrAdvisor,
  startupValidator,
  productAnalyzer,
  customerPersonaGenerator,
  brandAnalysis,
  seoAnalysis,
  aiProposalGenerator,
  aiPresentationGenerator,
  aiEmailGenerator,
  aiBrainstorm,
  aiCustomAssistant,
  resumeAnalyzer,
  contractAnalyzer,
  pdfAnalyzer,
  wordAnalyzer,
  excelAnalyzer,
  csvAnalyzer,
  powerpointAnalyzer,
  websiteAnalyzer,
  youtubeAnalyzer,
};

Object.entries(promptModules).forEach(([name, mod]) => {
  testPromptModule(name, mod);
});
