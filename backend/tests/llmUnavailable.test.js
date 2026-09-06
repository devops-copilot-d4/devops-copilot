const assert = require('assert');
const { analyzeRootCause } = require('../services/llm.service');

async function run() {
  const previousKey = process.env.LLM_API_KEY;
  delete process.env.LLM_API_KEY;
  try {
    await assert.rejects(
      () => analyzeRootCause({ logs: 'error', events: '', metricsSummary: '' }),
      (error) => error.code === 'LLM_UNAVAILABLE' && error.statusCode === 503,
    );
    console.log('LLM unavailable returns LLM_UNAVAILABLE without fabricated RCA.');
  } finally {
    if (previousKey === undefined) delete process.env.LLM_API_KEY; else process.env.LLM_API_KEY = previousKey;
  }
}

run().catch((error) => { console.error(error); process.exit(1); });
