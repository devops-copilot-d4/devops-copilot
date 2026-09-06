const assert = require('assert');
const axios = require('axios');
const aiClient = require('../services/aiService.client');

async function run() {
  const originalPost = axios.post;
  axios.post = async () => { throw new Error('connection refused'); };
  try {
    await assert.rejects(() => aiClient.predict({ cpu_usage: 1 }), (error) => error.code === 'AI_SERVICE_UNAVAILABLE' && error.statusCode === 503);
    console.log('AI unavailable returns AI_SERVICE_UNAVAILABLE without a fabricated prediction.');
  } finally {
    axios.post = originalPost;
  }
}

run().catch((error) => { console.error(error); process.exit(1); });
