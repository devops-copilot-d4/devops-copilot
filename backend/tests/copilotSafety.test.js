const assert = require('assert');
const recovery = require('../services/copilotRecovery.service');
const service = { _id: '507f1f77bcf86cd799439011', deploymentName: 'demo', namespace: 'default' };
async function run() {
  const prior = process.env.COPILOT_RECOVERY_ENABLED;
  delete process.env.COPILOT_RECOVERY_ENABLED;
  assert.strictEqual(recovery.validateSafety({ service, decision: { action: 'RESTART_POD' } }).allowed, false);
  assert.strictEqual(recovery.validateSafety({ service, decision: { action: 'DELETE_CLUSTER' } }).code, 'ACTION_NOT_ALLOWED');
  assert.strictEqual(recovery.validateSafety({ service: { ...service, namespace: 'kube-system' }, decision: { action: 'RESTART_POD' } }).code, 'NAMESPACE_NOT_ALLOWED');
  const decision = recovery.decide({ recommendation: 'ROLLBACK', pods: [{ status: 'CrashLoopBackOff' }], events: [], deployment: {} });
  assert.strictEqual(decision.action, 'RESTART_POD');
  assert.strictEqual(recovery.decide({ recommendation: 'DELETE_CLUSTER' }).action, null);
  assert.strictEqual(recovery.claimTarget(service), true);
  assert.strictEqual(recovery.claimTarget(service), false);
  recovery.releaseTarget(service);
  assert.strictEqual(recovery.claimTarget(service), true);
  recovery.releaseTarget(service);

  const calls = [];
  const fakeK8s = {
    getDeploymentStatus: async () => ({ desiredReplicas: 1, availableReplicas: 0 }),
    restartPod: async () => { calls.push('restartPod'); return { status: 'requested' }; },
    waitForRollout: async () => { calls.push('waitForRollout'); throw new Error('rollout failed'); },
  };
  const result = await recovery.execute({ service, decision: { action: 'RESTART_POD' }, dependencies: {
    k8s: fakeK8s,
    collectServiceTelemetry: async () => { calls.push('postTelemetry'); return { available: false, metrics: [] }; },
  } });
  assert.deepStrictEqual(calls, ['restartPod', 'waitForRollout', 'postTelemetry']);
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.verificationResult, 'RECOVERY_INCONCLUSIVE');
  if (prior === undefined) delete process.env.COPILOT_RECOVERY_ENABLED; else process.env.COPILOT_RECOVERY_ENABLED = prior;
  console.log('Copilot decision, typed action dispatch, and safety guard reject unpermitted or unverifiable recovery.');
}
run().catch((error) => { console.error(error); process.exit(1); });
