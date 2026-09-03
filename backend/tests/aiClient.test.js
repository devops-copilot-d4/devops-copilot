const assert = require('assert');
const aiClient = require('../services/aiService.client');

console.log('Running AI Service Client & Heuristic Fallback Tests...\n');

// Test 1: CrashLoopBackOff Detection
const crashTelemetry = {
  cpu_usage: 45,
  memory_usage: 50,
  restart_count: 5,
  error_rate: 80,
  pod_status: 'CrashLoopBackOff',
};
const crashPred = aiClient.localPredictFallback(crashTelemetry);
assert.strictEqual(crashPred.risk_level, 'HIGH');
assert.strictEqual(crashPred.predicted_failure_type, 'CrashLoopBackOff');
console.log('✓ Test 1: CrashLoopBackOff accurately predicted with HIGH risk.');

// Test 2: Normal Workload
const normalTelemetry = {
  cpu_usage: 25,
  memory_usage: 35,
  restart_count: 0,
  error_rate: 0.1,
  pod_status: 'Running',
};
const normalPred = aiClient.localPredictFallback(normalTelemetry);
assert.strictEqual(normalPred.risk_level, 'LOW');
assert.strictEqual(normalPred.predicted_failure_type, 'Normal');
console.log('✓ Test 2: Nominal telemetry accurately classified as LOW risk / Normal.');

// Test 3: Copilot Reasoning Policy Mapping
const copilotResp = aiClient.localCopilotFallback({
  telemetry: crashTelemetry,
  logs: 'FATAL: database connection refused',
  recentDeploymentInfo: 'v2.1',
});
assert.strictEqual(copilotResp.recommended_action, 'ROLLBACK');
console.log('✓ Test 3: Copilot reasoner selected approved ROLLBACK remediation.');

console.log('\nAll AI Service Client & Reasoning Tests Passed! (3/3)\n');
