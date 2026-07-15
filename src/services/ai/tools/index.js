/**
 * Tool modules barrel.
 *
 * Every future AI feature becomes an independent tool module.
 * Each tool contains ONLY business logic – all provider communication
 * continues through aiService.
 *
 * To add a new tool:
 *   1. Create a prompt module in ../prompts/
 *   2. Create a tool module here
 *   3. Register it in the AI_TOOL_REGISTRY in config.js
 *   4. Export it from this barrel
 */

export { BusinessAdvisorTool } from './businessAdvisorTool';
export { RequirementAnalyzerTool } from './requirementAnalyzerTool';
export { DecisionSimulationTool } from './decisionSimulationTool';
export { FutureLabTool } from './futureLabTool';
export { SWOTTool } from './swotTool';
export { MarketingTool } from './marketingTool';
export { RiskTool } from './riskTool';
export { LaunchReadinessTool } from './launchReadinessTool';
export { SocialAnalysisTool } from './socialAnalysisTool';
export { CompetitorAnalysisTool } from './competitorAnalysisTool';
export { FinancialForecastTool } from './financialForecastTool';
export { ReportGenerationTool } from './reportGenerationTool';
export { PitchDeckAssistantTool } from './pitchDeckAssistantTool';
export { MeetingNotesTool } from './meetingNotesTool';
export { DocumentAnalyzerTool } from './documentAnalyzerTool';
export { BusinessPlanTool } from './businessPlanTool';
export { SalesAdvisorTool } from './salesAdvisorTool';
export { FinancialAdvisorTool } from './financialAdvisorTool';
export { HRAdvisorTool } from './hrAdvisorTool';
export { StartupValidatorTool } from './startupValidatorTool';
export { ProductAnalyzerTool } from './productAnalyzerTool';
export { CustomerPersonaTool } from './customerPersonaTool';
export { BrandAnalysisTool } from './brandAnalysisTool';
export { SEOAnalysisTool } from './seoAnalysisTool';
export { ProposalGeneratorTool } from './proposalGeneratorTool';
export { PresentationGeneratorTool } from './presentationGeneratorTool';
export { EmailGeneratorTool } from './emailGeneratorTool';
export { BrainstormTool } from './brainstormTool';
export { CustomAssistantTool } from './customAssistantTool';
export { ResumeAnalyzerTool } from './resumeAnalyzerTool';
export { ContractAnalyzerTool } from './contractAnalyzerTool';
export { PDFAnalyzerTool } from './pdfAnalyzerTool';
export { WordAnalyzerTool } from './wordAnalyzerTool';
export { ExcelAnalyzerTool } from './excelAnalyzerTool';
export { CSVAnalyzerTool } from './csvAnalyzerTool';
export { PowerPointAnalyzerTool } from './powerpointAnalyzerTool';
export { WebsiteAnalyzerTool } from './websiteAnalyzerTool';
export { YouTubeAnalyzerTool } from './youtubeAnalyzerTool';

// ── Phase 9B: Role-Specific AI Assistants ───────────────────
export { ExecutiveAiTool } from './executiveAiTool';
export { ManagerAiTool } from './managerAiTool';
export { EmployeeAiTool } from './employeeAiTool';
export { FinanceAiTool } from './financeAiTool';
export { HrSpecificAiTool } from './hrSpecificAiTool';
export { MarketingAiTool } from './marketingAiTool';
export { SalesAiTool } from './salesAiTool';
export { OperationsAiTool } from './operationsAiTool';
export { TechnicalAiTool } from './technicalAiTool';

// ── Phase 9C: AI Project Orchestration ───────────────────
export { IntelligentDelegationTool } from './intelligentDelegationTool';
export { DecisionSupportTool } from './decisionSupportTool';
export { RiskDetectionAiTool } from './riskDetectionAiTool';
export { ExecutiveInsightsTool } from './executiveInsightsTool';
export { OrgHealthEngineTool } from './orgHealthEngineTool';
export { CrossDeptIntelligenceTool } from './crossDeptIntelligenceTool';

// ── Phase 9C Extension: Full Orchestration (Items 100, 102, 106) ──
export { AIProjectOrchestrationTool, aiProjectOrchestrationTool } from './aiProjectOrchestrationTool';
export { WorkflowAutomationTool, workflowAutomationTool } from './workflowAutomationTool';
export { PredictiveAnalyticsTool, predictiveAnalyticsTool } from './predictiveAnalyticsTool';
