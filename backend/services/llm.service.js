const axios = require('axios');

const LLM_API_URL = process.env.LLM_API_URL;
const LLM_API_KEY = process.env.LLM_API_KEY;

const llmUnavailable = (message, cause) => {
  const error = new Error(message);
  error.code = 'LLM_UNAVAILABLE';
  error.statusCode = 503;
  error.cause = cause;
  return error;
};

// Universal LLM caller supporting Google Gemini, Anthropic, and OpenAI/Groq
const callLLM = async (prompt, maxTokens = 1000) => {
  const rawUrl = (process.env.LLM_API_URL || '').trim().replace(/^["']|["']$/g, '');
  const apiKey = (process.env.LLM_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (!apiKey) {
    throw llmUnavailable('LLM_API_KEY is not configured');
  }

  // Determine standard Gemini URL if generic or malformed
  let url = rawUrl;
  if (!url || !url.startsWith('http')) {
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  // 1. Google Gemini API
  if (url.includes('googleapis.com') || url.includes('gemini') || apiKey.startsWith('AIza')) {
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    let lastErr;

    for (const model of models) {
      try {
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await axios.post(
          targetUrl,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 },
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 8000,
          }
        );
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (err) {
        lastErr = err;
        if (err.response?.status !== 404) {
          break; // Stop if not 404 (e.g. auth or quota)
        }
      }
    }
    throw lastErr || new Error('Gemini API call failed');
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
    throw llmUnavailable(`LLM requirement analysis unavailable: ${err.message}`, err);
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
    throw llmUnavailable(`LLM root-cause analysis unavailable: ${err.message}`, err);
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
    throw llmUnavailable(`LLM explainability unavailable: ${err.message}`, err);
  }
};

module.exports = { requirementToSLO, analyzeRootCause, explainRecoveryDecision, llmUnavailable };



