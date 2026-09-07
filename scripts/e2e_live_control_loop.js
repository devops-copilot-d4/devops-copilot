#!/usr/bin/env node
/*
 * Phase 9 live E2E runner.
 *
 * This is deliberately a boundary test: it uses HTTP calls to the running
 * frontend/backend/Prometheus services and lets the backend own all Kubernetes
 * operations. It contains no kubectl/shell recovery calls and no mock data.
 */
const backendUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
const prometheusUrl = (process.env.PROMETHEUS_URL || '').replace(/\/$/, '');
const token = process.env.E2E_AUTH_TOKEN;
const serviceIdOverride = process.env.E2E_SERVICE_ID;
const unavailableServiceId = process.env.E2E_UNAVAILABLE_SERVICE_ID;
const faultUrl = (process.env.E2E_FAULT_URL || '').replace(/\/$/, '');
const faultEnabled = process.env.E2E_ENABLE_FAULT_INJECTION === 'true';
const waitMs = Number(process.env.E2E_FAULT_SETTLE_MS || 30000);
const expectedInconclusive = process.env.E2E_EXPECT_RECOVERY_INCONCLUSIVE === 'true';
const expectedDuplicate = process.env.E2E_EXPECT_DUPLICATE_LOCK === 'true';

const fail = (message) => { throw new Error(message); };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const authorized = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => null);
  return { response, body };
}
async function requireOk(url, options, label) {
  const result = await request(url, options);
  if (!result.response.ok) fail(`${label} failed with HTTP ${result.response.status}: ${result.body?.message || 'no response body'}`);
  return result.body;
}
function requireControlLoop(result, label) {
  const { response, body } = result;
  if (!response.ok) fail(`${label} failed with HTTP ${response.status}: ${body?.message || 'no response body'}`);
  if (!body?.status || !body?.features?.available || !body?.prediction) fail(`${label} did not return a complete real control-loop result.`);
  const required = ['cpu_usage', 'memory_usage', 'restart_count', 'error_rate', 'response_time', 'recent_deployment', 'log_error_count', 'event_count'];
  if (required.some((name) => !(name in body.features.features))) fail(`${label} did not preserve the exact 8-feature contract.`);
  return body;
}
async function analyze(serviceId) {
  return request(`${backendUrl}/api/copilot/analyze`, { method: 'POST', headers: authorized, body: JSON.stringify({ serviceId }) });
}

async function main() {
  if (!token) fail('E2E_AUTH_TOKEN is required; a live E2E run cannot use the frontend demo token.');
  console.log(`Phase 9 live E2E: ${backendUrl}`);
  await requireOk(`${backendUrl}/`, {}, 'Backend reachability');
  if (frontendUrl) {
    const page = await fetch(frontendUrl);
    const document = await page.text();
    if (!page.ok || !document.includes('<div id="root">')) fail(`Frontend reachability failed with HTTP ${page.status}.`);
  }
  if (prometheusUrl) {
    const query = await requireOk(`${prometheusUrl}/api/v1/query?query=up`, {}, 'Prometheus reachability');
    if (query.status !== 'success') fail('Prometheus did not return a successful query response.');
  }
  const services = await requireOk(`${backendUrl}/api/services`, { headers: authorized }, 'Service inventory');
  const service = serviceIdOverride ? services.find((item) => item._id === serviceIdOverride) : services.find((item) => item.deploymentName);
  if (!service) fail('No registered Kubernetes-backed service was found. Set E2E_SERVICE_ID to a real service document.');

  console.log(`Healthy/no-action analysis for ${service.deploymentName}`);
  const healthy = requireControlLoop(await analyze(service._id), 'Healthy/no-action flow');
  if (healthy.status === 'NO_FAILURE_PREDICTED' && healthy.recovery) fail('No-action result unexpectedly contains a recovery payload.');

  if (unavailableServiceId) {
    console.log('Telemetry-unavailable guard scenario');
    const unavailable = await analyze(unavailableServiceId);
    if (unavailable.response.status !== 503 || unavailable.body?.status !== 'TELEMETRY_UNAVAILABLE') fail('Expected TELEMETRY_UNAVAILABLE for E2E_UNAVAILABLE_SERVICE_ID.');
    if (unavailable.body?.recovery) fail('Telemetry-unavailable result must not dispatch recovery.');
  } else {
    console.log('SKIP telemetry-unavailable scenario: E2E_UNAVAILABLE_SERVICE_ID is not configured.');
  }

  if (!faultEnabled) {
    console.log('SKIP controlled failure/recovery scenarios: set E2E_ENABLE_FAULT_INJECTION=true and E2E_FAULT_URL for an isolated test workload.');
  } else {
    if (!faultUrl) fail('E2E_FAULT_URL is required when E2E_ENABLE_FAULT_INJECTION=true.');
    console.log(`Injecting controlled health failure at ${faultUrl}/fault/health-fail`);
    await requireOk(`${faultUrl}/fault/health-fail`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, 'Controlled fault injection');
    await wait(waitMs);
    const first = await analyze(service._id);
    const failure = requireControlLoop(first, 'Failure/recovery flow');
    if (!failure.prediction?.is_failure_predicted) fail('Fault injection did not produce a model failure prediction; do not claim a recovery test.');
    if (!failure.rca || !failure.decision || !failure.safety) fail('Predicted failure did not produce evidence-bound RCA, decision, and safety results.');
    if (failure.decision.action && !['RESTART_POD', 'SCALE_DEPLOYMENT', 'ROLLBACK_DEPLOYMENT', 'RECREATE_RESOURCE'].includes(failure.decision.action)) fail('Non-allowlisted recovery action was returned.');
    if (failure.recovery && !['RECOVERY_VERIFIED', 'RECOVERY_FAILED', 'RECOVERY_INCONCLUSIVE'].includes(failure.recovery.verificationResult)) fail('Recovery verification result is invalid.');
    if (expectedInconclusive && failure.recovery?.verificationResult !== 'RECOVERY_INCONCLUSIVE') fail('Expected an inconclusive recovery result when post-action verification is unavailable.');

    if (expectedDuplicate) {
      console.log('Duplicate recovery claim scenario');
      const concurrent = await Promise.all([analyze(service._id), analyze(service._id)]);
      const outputs = concurrent.map((result) => result.body);
      if (!outputs.some((output) => output?.safety?.code === 'RECOVERY_ALREADY_RUNNING')) fail('Expected one concurrent analysis to be blocked by the duplicate recovery claim.');
    }
  }
  console.log('Phase 9 live E2E completed against reachable dependencies.');
}

main().catch((error) => { console.error(`Phase 9 live E2E failed: ${error.message}`); process.exitCode = 1; });
