const k8s = require('./k8s.service');
const { evaluateRolloutStatus } = require('./ciCd.utils');
const { collectServiceTelemetry } = require('./prometheus.service');

const ACTIONS = Object.freeze(['RESTART_POD', 'SCALE_DEPLOYMENT', 'ROLLBACK_DEPLOYMENT', 'RECREATE_RESOURCE']);
const activeTargets = new Set();
const configuredNamespaces = () => (process.env.COPILOT_ALLOWED_NAMESPACES || 'default,devops-copilot,staging').split(',').map((value) => value.trim()).filter(Boolean);

function decide({ recommendation, pods = [], events = [], deployment }) {
  const text = JSON.stringify({ pods, events, conditions: deployment?.conditions || [] }).toLowerCase();
  if (/progressdeadlineexceeded|failed rollout|replicaset/.test(text)) return { action: 'ROLLBACK_DEPLOYMENT', reason: 'Deployment rollout evidence indicates a failed revision.' };
  if (/oomkilled|out of memory|memory pressure|high cpu/.test(text)) return { action: 'SCALE_DEPLOYMENT', reason: 'Resource-pressure evidence supports scaling replicas.' };
  if (/crashloopbackoff|crash loop|error|back-off/.test(text)) return { action: 'RESTART_POD', reason: 'Crash evidence supports restarting an unhealthy pod.' };
  if (/missing|notfound|unhealthy/.test(text)) return { action: 'RECREATE_RESOURCE', reason: 'Workload availability evidence supports controlled pod recreation.' };
  return { action: null, reason: `No allowlisted recovery action is supported by collected evidence; LLM recommendation '${String(recommendation || 'none')}' is not sufficient on its own.` };
}

function validateSafety({ service, decision }) {
  if (!service?._id || !service.deploymentName || !service.namespace) return { allowed: false, code: 'SERVICE_NOT_ALLOWED', reason: 'Target must be a registered service with Kubernetes identity.' };
  if (!configuredNamespaces().includes(service.namespace)) return { allowed: false, code: 'NAMESPACE_NOT_ALLOWED', reason: 'Service namespace is not allowlisted.' };
  if (!ACTIONS.includes(decision?.action)) return { allowed: false, code: 'ACTION_NOT_ALLOWED', reason: 'Recovery action is not allowlisted.' };
  if (process.env.COPILOT_RECOVERY_ENABLED !== 'true') return { allowed: false, code: 'RECOVERY_NOT_PERMITTED', reason: 'Autonomous recovery is disabled; set COPILOT_RECOVERY_ENABLED=true only for a controlled environment.' };
  const inCluster = require('fs').existsSync('/var/run/secrets/kubernetes.io/serviceaccount/token');
  if ((!process.env.K8S_API_URL || !process.env.K8S_TOKEN) && !inCluster) return { allowed: false, code: 'KUBERNETES_CREDENTIALS_UNAVAILABLE', reason: 'Kubernetes API URL and credentials are not configured.' };
  return { allowed: true };
}

const targetKey = (service) => `${service.namespace}/${service.deploymentName}`;
function claimTarget(service) {
  const key = targetKey(service);
  if (activeTargets.has(key)) return false;
  activeTargets.add(key);
  return true;
}
function releaseTarget(service) { activeTargets.delete(targetKey(service)); }

async function execute({ service, decision, dependencies = {} }) {
  const kubernetes = dependencies.k8s || k8s;
  const collectTelemetry = dependencies.collectServiceTelemetry || collectServiceTelemetry;
  const target = { deploymentName: service.deploymentName, namespace: service.namespace };
  const startedAt = new Date().toISOString();
  let beforeState = null;
  let afterState = null;
  let dispatch = null;
  let rolloutEvaluation = null;
  let actionError = null;
  try {
    beforeState = await kubernetes.getDeploymentStatus(target);
    if (decision.action === 'RESTART_POD') dispatch = await kubernetes.restartPod(target);
    if (decision.action === 'SCALE_DEPLOYMENT') dispatch = await kubernetes.scaleDeployment({ ...target, replicas: Math.max(1, Number(beforeState.desiredReplicas || 1) + 1) });
    if (decision.action === 'ROLLBACK_DEPLOYMENT') dispatch = await kubernetes.rollbackDeployment(target);
    if (decision.action === 'RECREATE_RESOURCE') dispatch = await kubernetes.recreateResource(target);
    const rollout = await kubernetes.waitForRollout(target);
    afterState = rollout.deployment;
    rolloutEvaluation = evaluateRolloutStatus({ deploymentStatus: afterState });
  } catch (error) {
    actionError = error;
    try { afterState = await kubernetes.getDeploymentStatus(target); } catch (_) { afterState = null; }
  }
  // A post-action monitoring read is mandatory even when rollout verification
  // fails.  Without it, the outcome is explicitly inconclusive.
  let postTelemetry = null;
  try { postTelemetry = await collectTelemetry(service); } catch (_) { postTelemetry = null; }
  const requiredMetricsAvailable = postTelemetry?.available && ['cpu_usage_cores', 'memory_usage_bytes', 'error_rate_per_second', 'p95_request_latency_seconds']
    .every((name) => postTelemetry.metrics?.some((item) => item.name === name && item.available));
  const verified = Boolean(rolloutEvaluation?.complete) && requiredMetricsAvailable;
  const verificationResult = !requiredMetricsAvailable ? 'RECOVERY_INCONCLUSIVE' : (verified ? 'RECOVERY_VERIFIED' : 'RECOVERY_FAILED');
  return { action: decision.action, target, startedAt, completedAt: new Date().toISOString(), success: verified, verificationResult, dispatch, beforeState, afterState, postTelemetry, error: verified ? null : (actionError?.message || (requiredMetricsAvailable ? 'Deployment rollout did not verify.' : 'Post-recovery Prometheus telemetry is unavailable or incomplete.')) };
}

module.exports = { ACTIONS, decide, validateSafety, claimTarget, releaseTarget, execute };
