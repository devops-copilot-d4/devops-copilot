const assert = require('assert');
const axios = require('axios');
const { parsePrometheusMetric, queryInstant, collectServiceTelemetry } = require('../services/prometheus.service');

const metric = parsePrometheusMetric([{ metric: { job: 'demo-checkout-service' }, value: [1710000000, '12.5'] }]);
assert.strictEqual(metric.value, 12.5);
assert.strictEqual(metric.labels.job, 'demo-checkout-service');
assert.strictEqual(parsePrometheusMetric([]), null);

async function run() {
  const originalGet = axios.get;
  axios.get = async () => ({ data: { data: { result: [] } } });
  try {
    await assert.rejects(() => queryInstant('up'), (error) => error.code === 'PROMETHEUS_NO_DATA' && error.statusCode === 503);
    const telemetry = await collectServiceTelemetry({ name: 'checkout', deploymentName: 'demo-checkout-service', namespace: 'devops-copilot' });
    assert.strictEqual(telemetry.available, true, 'Prometheus responded, but the requested metrics are unavailable.');
    assert(telemetry.metrics.every((item) => item.available === false && item.errorCode === 'METRIC_UNAVAILABLE'));
    console.log('Prometheus response parsing and missing-metric handling passed.');
  } finally {
    axios.get = originalGet;
  }
}

run().catch((error) => { console.error(error); process.exit(1); });
