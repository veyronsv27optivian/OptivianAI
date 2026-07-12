/**
 * Financial Forecast tool.
 */
import { BaseTool } from './_BaseTool';
import { AI_TOOL_TYPES } from '../config';
import { financialForecast } from '../prompts';

export class FinancialForecastTool extends BaseTool {
  get toolType() {
    return AI_TOOL_TYPES.PERFORMANCE_ANALYSIS;
  }

  buildPrompt(params) {
    return {
      systemPrompt: financialForecast.systemPrompt,
      prompt: financialForecast.buildPrompt(params),
    };
  }

  validateParams(params) {
    const errors = [];
    if (!params.businessModel) errors.push('businessModel is required');
    if (!params.historicalData) errors.push('historicalData is required');
    if (!params.forecastPeriod) errors.push('forecastPeriod is required');
    return { valid: errors.length === 0, errors };
  }
}
