// Translates authoritative Kubernetes and Prometheus observations into the
// immutable Phase 4 ML feature contract.  This module intentionally refuses
// to substitute defaults: a partial observation is not a prediction.
const REQUIRED_FEATURES = Object.freeze([
  'cpu_usage', 'memory_usage', 'restart_count', 'error_rate',
  'response_time', 'recent_deployment', 'log_error_count', 'event_count',
]);

const metric = (telemetry, name) => Array.isArray(telemetry?.metrics) ? telemetry.metrics.find((item) => item.name === name) : null;
const unavailable = (reason, details = {}) => ({ available: false, code: 'TELEMETRY_UNAVAILABLE', reason, missingFeatures: [...new Set(details.missingFeatures || [])], details });
const errorLines = (logs) => String(logs || '').split(/\r?\n/).filter((line) => /\b(error|fatal|exception|panic|oomkilled|crashloopbackoff)\b/i.test(line)).length;

const resourceLimit = (deployment, resource) => {
  const value = deployment?.resourceLimits?.[resource];
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return value;
};

function extractFeatures({ telemetry, deployment, pods, logs, events, recentDeployment }) {
  if (!telemetry?.available) return unavailable('Prometheus telemetry is unavailable.', { source: telemetry?.errorCode || 'PROMETHEUS_UNAVAILABLE' });
  const cpu = metric(telemetry, 'cpu_usage_cores');
  const memory = metric(telemetry, 'memory_usage_bytes');
  const errorRate = metric(telemetry, 'error_rate_per_second');
  const latency = metric(telemetry, 'p95_request_latency_seconds');
  const missing = [];
  for (const [feature, value] of [['cpu_usage', cpu], ['memory_usage', memory], ['error_rate', errorRate], ['response_time', latency]]) {
    if (!value?.available) missing.push(feature);
  }
  const cpuLimit = resourceLimit(deployment, 'cpuCores');
  const memoryLimit = resourceLimit(deployment, 'memoryBytes');
  if (!cpuLimit) missing.push('cpu_usage');
  if (!memoryLimit) missing.push('memory_usage');
  if (!Array.isArray(pods) || pods.length === 0) missing.push('restart_count');
  if (logs === null || logs === undefined) missing.push('log_error_count');
  if (!Array.isArray(events)) missing.push('event_count');
  if (recentDeployment === null || recentDeployment === undefined) missing.push('recent_deployment');
  if (missing.length) return unavailable('The complete ML feature contract could not be collected.', { missingFeatures: missing });

  const restartCount = (pods || []).reduce((total, pod) => total + Number(pod.restartCount || 0), 0);
  const features = {
    cpu_usage: (Number(cpu.value) / cpuLimit) * 100,
    memory_usage: (Number(memory.value) / memoryLimit) * 100,
    restart_count: restartCount,
    error_rate: Number(errorRate.value),
    response_time: Number(latency.value) * 1000,
    recent_deployment: recentDeployment ? 1 : 0,
    log_error_count: errorLines(logs),
    event_count: (events || []).length,
  };
  const invalid = REQUIRED_FEATURES.filter((name) => !Number.isFinite(features[name]) || features[name] < 0);
  if (invalid.length) return unavailable('Collected telemetry contains invalid ML feature values.', { missingFeatures: invalid });
  return { available: true, featureSchema: REQUIRED_FEATURES, features, sources: { cpu_usage: cpu.query, memory_usage: memory.query, error_rate: errorRate.query, response_time: latency.query, restart_count: 'kubernetes pod status', log_error_count: 'kubernetes pod logs', event_count: 'kubernetes events', recent_deployment: 'kubernetes deployment conditions' } };
}

module.exports = { REQUIRED_FEATURES, extractFeatures, errorLines };
