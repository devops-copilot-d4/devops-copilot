const assert = require('assert');
const { parsePod, parseDeployment, parseEvent, getPodLogs } = require('../services/k8s.service');

const pod = parsePod({
  metadata: { name: 'checkout-abc', namespace: 'devops-copilot', creationTimestamp: new Date().toISOString() },
  spec: { nodeName: 'worker-1' },
  status: {
    phase: 'Running',
    containerStatuses: [
      { name: 'checkout-api', ready: true, restartCount: 2, state: { running: { startedAt: '2026-01-01T00:00:00Z' } } },
      { name: 'sidecar', ready: false, restartCount: 1, state: { waiting: { reason: 'CrashLoopBackOff', message: 'back-off restarting container' } } },
    ],
  },
});
assert.strictEqual(pod.ready, false);
assert.strictEqual(pod.readiness, '1/2');
assert.strictEqual(pod.restartCount, 3);
assert.strictEqual(pod.status, 'CrashLoopBackOff');

const deployment = parseDeployment({
  metadata: { name: 'checkout', namespace: 'devops-copilot', generation: 4 },
  spec: { replicas: 3 },
  status: { observedGeneration: 4, availableReplicas: 2, readyReplicas: 2, updatedReplicas: 3, unavailableReplicas: 1, conditions: [{ type: 'Available', status: 'False', reason: 'MinimumReplicasUnavailable' }] },
});
assert.strictEqual(deployment.status, 'Degraded');
assert.strictEqual(deployment.desiredReplicas, 3);
assert.strictEqual(deployment.availableReplicas, 2);
assert.strictEqual(deployment.conditions[0].reason, 'MinimumReplicasUnavailable');

const event = parseEvent({ type: 'Warning', reason: 'BackOff', message: 'Back-off restarting failed container', count: 4, involvedObject: { kind: 'Pod', name: 'checkout-abc', namespace: 'devops-copilot' } });
assert.strictEqual(event.involvedObject.name, 'checkout-abc');
assert.strictEqual(event.reason, 'BackOff');

async function run() {
  await assert.rejects(() => getPodLogs({ namespace: 'devops-copilot' }), (error) => error.code === 'LOGS_UNAVAILABLE');
  console.log('Kubernetes pod, deployment, readiness, event parsing, and logs-unavailable handling passed.');
}

run().catch((error) => { console.error(error); process.exit(1); });
