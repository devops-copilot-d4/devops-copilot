const assert = require('assert');
const axios = require('axios');
const { queryInstant, checkSLO } = require('../services/prometheus.service');

async function run() {
  const originalGet = axios.get;
  axios.get = async () => { throw new Error('connection refused'); };
  try {
    await assert.rejects(() => queryInstant('up'), (error) => error.code === 'PROMETHEUS_UNAVAILABLE' && error.statusCode === 503);
    await assert.rejects(() => checkSLO({ queryExpression: 'up', threshold: 1, comparator: '>=' }), (error) => error.code === 'PROMETHEUS_UNAVAILABLE');
    console.log('Prometheus unavailable returns a structured error and never marks an SLO healthy.');
  } finally {
    axios.get = originalGet;
  }
}

run().catch((error) => { console.error(error); process.exit(1); });
