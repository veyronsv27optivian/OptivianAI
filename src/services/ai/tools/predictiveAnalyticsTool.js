import { BaseTool } from './_BaseTool';

export class PredictiveAnalyticsTool extends BaseTool {
  constructor() {
    super({
      toolType: 'predictive_analytics_tool',
      label: 'Predictive Analytics',
      description: 'AI forecasts trends, revenue, and resource needs',
    });
  }

  buildPrompt(params) {
    const { data, metric, timeframe, context } = params;
    return `
Perform predictive analytics based on the following:

Metric to Forecast: ${metric || 'Revenue'}
Timeframe: ${timeframe || 'Next 12 months'}
Context: ${context || 'Not provided'}
Data: ${data ? data.slice(0, 5000) : 'No historical data provided'}

Please:
1. Analyze historical trends
2. Generate forecast with confidence intervals
3. Identify key drivers and risks
4. Suggest actionable recommendations
5. Highlight resource implications

Return as JSON:
{
  "forecastMetric": "...",
  "timeframe": "...",
  "historicalTrend": "up|down|stable|volatile",
  "forecastData": [{ "period": "...", "predicted": 0, "lowerBound": 0, "upperBound": 0 }],
  "confidence": "high|medium|low",
  "keyDrivers": [{ "factor": "...", "impact": "positive|negative", "weight": 0 }],
  "risks": [{ "risk": "...", "probability": "high|medium|low", "impact": "..." }],
  "recommendations": ["..."],
  "resourceImplications": "..."
}`;
  }

  validateParams(params) {
    if (!params.metric?.trim()) {
      return { valid: false, error: 'Metric to forecast is required' };
    }
    return { valid: true };
  }
}

export const predictiveAnalyticsTool = new PredictiveAnalyticsTool();
