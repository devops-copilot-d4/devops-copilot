const assert = require('assert');
const { extractFeatures, REQUIRED_FEATURES } = require('../services/copilotFeature.service');

const telemetry = { available: true, metrics: [
  { name: 'cpu_usage_cores', available: true, value: 0.25, query: 'cpu' },
  { name: 'memory_usage_bytes', available: true, value: 104857600, query: 'memory' },
  { name: 'error_rate_per_second', available: true, value: 0.2, query: 'errors' },
  { name: 'p95_request_latency_seconds', available: true, value: 0.12, query: 'latency' },
] };
const result = extractFeatures({ telemetry, deployment: { resourceLimits: { cpuCores: 1, memoryBytes: 209715200 } }, pods: [{ restartCount: 2 }], logs: 'ERROR request failed', events: [{}], recentDeployment: false });
assert.strictEqual(result.available, true);
assert.deepStrictEqual(Object.keys(result.features), REQUIRED_FEATURES);
assert.strictEqual(result.features.cpu_usage, 25);
assert.strictEqual(result.features.memory_usage, 50);
assert.strictEqual(result.features.response_time, 120);
const unavailable = extractFeatures({ telemetry: { available: false, errorCode: 'PROMETHEUS_UNAVAILABLE' }, deployment: {}, pods: [], logs: '', events: [], recentDeployment: false });
assert.strictEqual(unavailable.available, false);
assert.strictEqual(unavailable.code, 'TELEMETRY_UNAVAILABLE');
const missingLogEvidence = extractFeatures({ telemetry, deployment: { resourceLimits: { cpuCores: 1, memoryBytes: 209715200 } }, pods: [{ restartCount: 0 }], logs: null, events: [], recentDeployment: false });
assert.strictEqual(missingLogEvidence.available, false);
assert(missingLogEvidence.missingFeatures.includes('log_error_count'));
console.log('Copilot feature extraction rejects incomplete telemetry and preserves the 8-feature contract.');
