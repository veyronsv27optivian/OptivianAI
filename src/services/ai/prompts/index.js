/**
 * Prompt modules barrel.
 *
 * Every AI feature/tool has its own prompt module that exports:
 *   - systemPrompt  – The system instruction string.
 *   - buildPrompt() – Builder function that constructs the full user prompt.
 *   - validation    – Validation rules for the input.
 *   - expectedFormat – Description of the expected response format.
 *
 * Importing from this barrel is the recommended way to access prompts:
 *   import { businessAdvisor, swotAnalysis } from '../prompts';
 *
 * Each re-exported name is a namespace object containing the individual
 * exports from its module (systemPrompt, buildPrompt, validation,
 * expectedFormat). Usage:
 *   businessAdvisor.systemPrompt
 *   businessAdvisor.buildPrompt(params)
 */

import * as _businessAdvisor from './businessAdvisor';
export const businessAdvisor = _businessAdvisor;

import * as _requirementAnalyzer from './requirementAnalyzer';
export const requirementAnalyzer = _requirementAnalyzer;

import * as _decisionSimulation from './decisionSimulation';
export const decisionSimulation = _decisionSimulation;

import * as _futureLab from './futureLab';
export const futureLab = _futureLab;

import * as _socialMediaAnalysis from './socialMediaAnalysis';
export const socialMediaAnalysis = _socialMediaAnalysis;

import * as _swotAnalysis from './swotAnalysis';
export const swotAnalysis = _swotAnalysis;

import * as _marketingStrategy from './marketingStrategy';
export const marketingStrategy = _marketingStrategy;

import * as _financialForecast from './financialForecast';
export const financialForecast = _financialForecast;

import * as _competitorAnalysis from './competitorAnalysis';
export const competitorAnalysis = _competitorAnalysis;

import * as _launchReadiness from './launchReadiness';
export const launchReadiness = _launchReadiness;

import * as _reportGenerator from './reportGenerator';
export const reportGenerator = _reportGenerator;

import * as _pitchDeckAssistant from './pitchDeckAssistant';
export const pitchDeckAssistant = _pitchDeckAssistant;

import * as _meetingNotes from './meetingNotes';
export const meetingNotes = _meetingNotes;

import * as _riskAssessment from './riskAssessment';
export const riskAssessment = _riskAssessment;

import * as _documentAnalyzer from './documentAnalyzer';
export const documentAnalyzer = _documentAnalyzer;

import * as _businessPlanGenerator from './businessPlanGenerator';
export const businessPlanGenerator = _businessPlanGenerator;

import * as _salesAdvisor from './salesAdvisor';
export const salesAdvisor = _salesAdvisor;

import * as _financialAdvisor from './financialAdvisor';
export const financialAdvisor = _financialAdvisor;

import * as _hrAdvisor from './hrAdvisor';
export const hrAdvisor = _hrAdvisor;

import * as _startupValidator from './startupValidator';
export const startupValidator = _startupValidator;

import * as _productAnalyzer from './productAnalyzer';
export const productAnalyzer = _productAnalyzer;

import * as _customerPersonaGenerator from './customerPersonaGenerator';
export const customerPersonaGenerator = _customerPersonaGenerator;

import * as _brandAnalysis from './brandAnalysis';
export const brandAnalysis = _brandAnalysis;

import * as _seoAnalysis from './seoAnalysis';
export const seoAnalysis = _seoAnalysis;

import * as _aiProposalGenerator from './aiProposalGenerator';
export const aiProposalGenerator = _aiProposalGenerator;

import * as _aiPresentationGenerator from './aiPresentationGenerator';
export const aiPresentationGenerator = _aiPresentationGenerator;

import * as _aiEmailGenerator from './aiEmailGenerator';
export const aiEmailGenerator = _aiEmailGenerator;

import * as _aiBrainstorm from './aiBrainstorm';
export const aiBrainstorm = _aiBrainstorm;

import * as _aiCustomAssistant from './aiCustomAssistant';
export const aiCustomAssistant = _aiCustomAssistant;

import * as _resumeAnalyzer from './resumeAnalyzer';
export const resumeAnalyzer = _resumeAnalyzer;

import * as _contractAnalyzer from './contractAnalyzer';
export const contractAnalyzer = _contractAnalyzer;

import * as _pdfAnalyzer from './pdfAnalyzer';
export const pdfAnalyzer = _pdfAnalyzer;

import * as _wordAnalyzer from './wordAnalyzer';
export const wordAnalyzer = _wordAnalyzer;

import * as _excelAnalyzer from './excelAnalyzer';
export const excelAnalyzer = _excelAnalyzer;

import * as _csvAnalyzer from './csvAnalyzer';
export const csvAnalyzer = _csvAnalyzer;

import * as _powerpointAnalyzer from './powerpointAnalyzer';
export const powerpointAnalyzer = _powerpointAnalyzer;

import * as _websiteAnalyzer from './websiteAnalyzer';
export const websiteAnalyzer = _websiteAnalyzer;

import * as _youtubeAnalyzer from './youtubeAnalyzer';
export const youtubeAnalyzer = _youtubeAnalyzer;

// ── Phase 9B: Role-Specific AI Assistants ───────────────────
import * as _executiveAi from './executiveAi';
export const executiveAi = _executiveAi;

import * as _managerAi from './managerAi';
export const managerAi = _managerAi;

import * as _employeeAi from './employeeAi';
export const employeeAi = _employeeAi;

import * as _financeAi from './financeAi';
export const financeAi = _financeAi;

import * as _hrSpecificAi from './hrSpecificAi';
export const hrSpecificAi = _hrSpecificAi;

import * as _marketingAi from './marketingAi';
export const marketingAi = _marketingAi;

import * as _salesAi from './salesAi';
export const salesAi = _salesAi;

import * as _operationsAi from './operationsAi';
export const operationsAi = _operationsAi;

import * as _technicalAi from './technicalAi';
export const technicalAi = _technicalAi;

// ── Phase 9C: AI Project Orchestration ───────────────────
import * as _intelligentDelegation from './intelligentDelegation';
export const intelligentDelegation = _intelligentDelegation;

import * as _decisionSupport from './decisionSupport';
export const decisionSupport = _decisionSupport;

import * as _riskDetectionAi from './riskDetectionAi';
export const riskDetectionAi = _riskDetectionAi;

import * as _executiveInsights from './executiveInsights';
export const executiveInsights = _executiveInsights;

import * as _orgHealthEngine from './orgHealthEngine';
export const orgHealthEngine = _orgHealthEngine;

import * as _crossDeptIntelligence from './crossDeptIntelligence';
export const crossDeptIntelligence = _crossDeptIntelligence;
