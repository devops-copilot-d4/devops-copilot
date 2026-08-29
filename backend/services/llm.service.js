const axios = require('axios');

const LLM_API_URL = process.env.LLM_API_URL;
const LLM_API_KEY = process.env.LLM_API_KEY;

// Generic helper to call the LLM API with a system-style prompt + user content.
// Adapt the request/response shape to whichever provider you settle on
// (Anthropic Messages API shown as an example structure).
const callLLM = async (prompt, maxTokens = 1000) => {
  const response = await axios.post(
    LLM_API_URL,
    {
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LLM_API_KEY,
        'anthropic-version': '2023-06-01',
      },
    }
  );
  const textBlock = response.data.content.find((c) => c.type === 'text');
  return textBlock ? textBlock.text : '';
};

// Requirement Analyzer: NL requirement -> draft measurable SLO (JSON)
const requirementToSLO = async (requirementText) => {
  const prompt = `
You convert a natural-language software requirement into a measurable Service Level Objective.
Respond ONLY with JSON, no other text, in this exact shape:
{"metricName": "...", "comparator": "<|<=|>|>=|==", "threshold": number, "unit": "..."}

Requirement: "${requirementText}"
`.trim();

  const raw = await callLLM(prompt, 300);
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
};

// Root Cause Analysis on logs/metrics/K8s events
const analyzeRootCause = async ({ logs, events, metricsSummary }) => {
  const prompt = `
You are a DevOps root-cause analysis assistant. Given the following build/deployment
logs, Kubernetes events, and metrics summary, identify the most likely root cause of
the failure and suggest a corrective action.

Respond ONLY with JSON in this exact shape:
{"rootCause": "...", "confidence": 0.0-1.0, "suggestedAction": "restart|rollback|scale_up|scale_down|alert_only"}

Logs:
${logs}

Kubernetes events:
${events}

Metrics summary:
${metricsSummary}
`.trim();

  const raw = await callLLM(prompt, 500);
  return JSON.parse(raw.replace(/```json|```/g, '').trim());
};

// Explainability: justify why a specific recovery action was chosen
const explainRecoveryDecision = async ({ rootCause, actionType, businessImpact }) => {
  const prompt = `
Explain in 2-3 plain-English sentences why the recovery action "${actionType}" was chosen,
given the root cause "${rootCause}" and business impact "${businessImpact}".
Write for a non-technical stakeholder reading a dashboard.
`.trim();

  return callLLM(prompt, 200);
};

module.exports = { requirementToSLO, analyzeRootCause, explainRecoveryDecision };

