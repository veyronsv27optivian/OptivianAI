import { BaseTool } from './_BaseTool';
export class AIProjectOrchestrationTool extends BaseTool {
  constructor() {
    super({
      toolType: 'ai_project_orchestration',
      label: 'AI Project Orchestration',
      description: 'Full workflow: CEO objective → AI creates plan → assigns tasks → monitors execution',
    });
  }

  buildPrompt(params) {
    const { objective, context, departments, timeline } = params;
    return `
Please orchestrate a full project plan based on this objective:

Objective: ${objective || 'Not specified'}
Context: ${context || 'Not provided'}
Departments Involved: ${departments || 'All'}
Timeline: ${timeline || 'Not specified'}

Generate:
1. A project breakdown with milestones
2. Tasks for each milestone with dependencies
3. Suggested department/role assignments
4. Key risks and mitigation strategies
5. Success criteria and KPIs

Return as a structured JSON:
{
  "objective": "...",
  "milestones": [{ "name": "...", "tasks": ["..."], "department": "...", "deadline": "..." }],
  "dependencies": [{ "from": "...", "to": "..." }],
  "risks": [{ "risk": "...", "mitigation": "...", "severity": "high|medium|low" }],
  "successCriteria": ["..."],
  "estimatedDuration": "..."
}`;
  }

  validateParams(params) {
    if (!params.objective?.trim()) {
      return { valid: false, error: 'Objective is required for project orchestration' };
    }
    return { valid: true };
  }
}

export const aiProjectOrchestrationTool = new AIProjectOrchestrationTool();
