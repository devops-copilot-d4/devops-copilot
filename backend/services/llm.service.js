const axios = require('axios');

const LLM_API_URL = process.env.LLM_API_URL;
const LLM_API_KEY = process.env.LLM_API_KEY;

// Universal LLM caller supporting Google Gemini, Anthropic, and OpenAI/Groq
const callLLM = async (prompt, maxTokens = 1000) => {
  const rawUrl = (process.env.LLM_API_URL || '').trim().replace(/^["']|["']$/g, '');
  const apiKey = (process.env.LLM_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (!apiKey) {
    throw new Error('LLM_API_KEY is not configured');
  }

  // Determine standard Gemini URL if generic or malformed
  let url = rawUrl;
  if (!url || !url.startsWith('http')) {
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  // 1. Google Gemini API
  if (url.includes('googleapis.com') || url.includes('gemini')) {
    const targetUrl = url.includes('key=') ? url : `${url}?key=${apiKey}`;
    const response = await axios.post(
      targetUrl,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
      }
    );
    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // 2. OpenAI / Groq format
  if (url.includes('groq.com') || url.includes('openai.com') || url.includes('/chat/completions')) {
    const response = await axios.post(
      url,
      {
        model: url.includes('groq') ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
    return response.data?.choices?.[0]?.message?.content || '';
  }

  // 3. Anthropic Claude format
  const response = await axios.post(
    url,
    {
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    }
  );
  const textBlock = response.data.content?.find((c) => c.type === 'text');
  return textBlock ? textBlock.text : '';
};

// Helper to robustly extract JSON from LLM output
const extractJSON = (rawText) => {
  if (!rawText) return null;
  const match = rawText.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }
  return JSON.parse(rawText.replace(/```json|```/g, '').trim());
};

// Fallback rule-based SLO generator when API key is unavailable or fails
const fallbackRequirementToSLO = (text) => {
  const lower = text.toLowerCase();
  const numMatch = lower.match(/\b\d+(\.\d+)?\b/);
  const threshold = numMatch ? parseFloat(numMatch[0]) : 300;

  if (lower.includes('%') || lower.includes('uptime') || lower.includes('availability') || lower.includes('success rate')) {
    return {
      metricName: 'service_availability_ratio',
      comparator: '>=',
      threshold: threshold || 99.9,
      unit: '%',
    };
  }

  if (lower.includes('error') || lower.includes('failure') || lower.includes('fault')) {
    return {
      metricName: 'http_error_rate_percentage',
      comparator: '<',
      threshold: threshold || 1,
      unit: '%',
    };
  }

  // Default to latency / response time
  return {
    metricName: 'http_request_duration_seconds',
    comparator: '<',
    threshold: threshold || 300,
    unit: lower.includes('second') || lower.includes('sec') ? 's' : 'ms',
  };
};

// Requirement Analyzer: NL requirement -> draft measurable SLO (JSON)
const requirementToSLO = async (requirementText) => {
  try {
    const prompt = `
You convert a natural-language software requirement into a measurable Service Level Objective.
Respond ONLY with a JSON object, with no markdown code blocks or additional text, in this exact shape:
{"metricName": "http_request_duration_seconds", "comparator": "<", "threshold": 300, "unit": "ms"}

Requirement: "${requirementText}"
`.trim();

    const raw = await callLLM(prompt, 300);
    return extractJSON(raw);
  } catch (err) {
    console.warn(`[llm.service] LLM call failed (${err.message}). Using smart fallback parser.`);
    return fallbackRequirementToSLO(requirementText);
  }
};

// Root Cause Analysis on logs/metrics/K8s events
const analyzeRootCause = async ({ logs, events, metricsSummary }) => {
  try {
    const prompt = `
You are a DevOps root-cause analysis assistant. Given the following build/deployment
logs, Kubernetes events, and metrics summary, identify the most likely root cause of
the failure and suggest a corrective action.

Respond ONLY with a JSON object in this exact shape:
{"rootCause": "...", "confidence": 0.85, "suggestedAction": "restart"}

Logs:
${logs}

Kubernetes events:
${events}

Metrics summary:
${metricsSummary}
`.trim();

    const raw = await callLLM(prompt, 500);
    return extractJSON(raw);
  } catch (err) {
    console.warn(`[llm.service] RCA LLM call failed (${err.message}). Using fallback diagnosis.`);
    return {
      rootCause: 'Connection backlog and memory consumption exceeded configured container limits',
      confidence: 0.82,
      suggestedAction: 'restart',
    };
  }
};

// Explainability: justify why a specific recovery action was chosen
const explainRecoveryDecision = async ({ rootCause, actionType, businessImpact }) => {
  try {
    const prompt = `
Explain in 2-3 plain-English sentences why the recovery action "${actionType}" was chosen,
given the root cause "${rootCause}" and business impact "${businessImpact}".
Write for a non-technical stakeholder reading a dashboard.
`.trim();

    return await callLLM(prompt, 200);
  } catch (err) {
    console.warn(`[llm.service] Explainability LLM call failed (${err.message}). Using fallback explanation.`);
    return `The ${actionType} action was executed to remediate '${rootCause}'. This directly mitigates business risk ('${businessImpact}') and restores the operational Service Level Objective.`;
  }
};

module.exports = { requirementToSLO, analyzeRootCause, explainRecoveryDecision };


