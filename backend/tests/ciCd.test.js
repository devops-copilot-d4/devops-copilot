const assert = require('assert');
const {
  shortSha,
  imageRef,
  deploymentTargetFor,
  evaluateRolloutStatus,
} = require('../services/ciCd.utils');
const { workflowState } = require('../controllers/deployment.controller');
const k8sService = require('../services/k8s.service');

console.log('Running Phase 5 CI/CD & Kubernetes Integration Tests...\n');

// 1. Immutable SHA tag generation
console.log('1. Testing Immutable Image Tag Generation:');
assert.strictEqual(
  shortSha('8f43a2c91b4d3e21a0f9b8c7d6e5f4a3b2c1d0e9'),
  '8f43a2c91b4d',
  'Full 40-char SHA truncated to 12 chars'
);
assert.strictEqual(
  shortSha('A1B2C3D4E5F6789'),
  'a1b2c3d4e5f6',
  'Uppercase hex normalized to lowercase'
);
assert.strictEqual(
  shortSha('1234567'),
  '1234567',
  '7-character short SHA accepted'
);

assert.throws(
  () => shortSha(''),
  (err) => err.code === 'INVALID_IMAGE_TAG',
  'Empty SHA rejected'
);
assert.throws(
  () => shortSha('not-a-hex-sha!'),
  (err) => err.code === 'INVALID_IMAGE_TAG',
  'Non-hex SHA rejected'
);
assert.throws(
  () => shortSha('12345'),
  (err) => err.code === 'INVALID_IMAGE_TAG',
  'Too short SHA (<7 chars) rejected'
);
console.log('  ✓ Immutable commit-SHA tag generation validated.\n');

// 2. Image reference generation
console.log('2. Testing Image Reference Construction:');
const fullRef = imageRef({
  registry: 'docker.io',
  repository: 'tharungowda',
  service: 'demo-checkout-service',
  tag: '8f43a2c91b4d',
});
assert.strictEqual(
  fullRef,
  'docker.io/tharungowda/demo-checkout-service:8f43a2c91b4d'
);

const localRef = imageRef({
  service: 'demo-checkout-service',
  tag: '8f43a2c91b4d',
});
assert.strictEqual(localRef, 'demo-checkout-service:8f43a2c91b4d');

assert.throws(
  () => imageRef({ service: '', tag: '8f43a2c91b4d' }),
  (err) => err.code === 'INVALID_IMAGE_TAG',
  'Missing service rejected'
);
assert.throws(
  () => imageRef({ service: 'demo-checkout-service', tag: '' }),
  (err) => err.code === 'INVALID_IMAGE_TAG',
  'Missing tag rejected'
);
console.log('  ✓ Image reference construction and validation validated.\n');

// 3. Deployment target resolution
console.log('3. Testing Service Deployment Target Resolution:');
const validTarget = deploymentTargetFor({
  deploymentName: 'demo-checkout-service',
  namespace: 'devops-copilot',
  imageName: 'demo-checkout-service',
});
assert.deepStrictEqual(validTarget, {
  deploymentName: 'demo-checkout-service',
  namespace: 'devops-copilot',
  containerName: 'checkout-api',
  imageName: 'demo-checkout-service',
});

const customTarget = deploymentTargetFor({
  deploymentName: 'payment-service',
  namespace: 'devops-copilot',
  containerName: 'custom-payment-api',
});
assert.strictEqual(customTarget.containerName, 'custom-payment-api');

assert.throws(
  () => deploymentTargetFor({ deploymentName: 'demo-checkout-service' }),
  (err) => err.code === 'SERVICE_OBSERVABILITY_NOT_CONFIGURED' && err.statusCode === 422,
  'Missing namespace rejected with 422'
);
assert.throws(
  () => deploymentTargetFor(null),
  (err) => err.code === 'SERVICE_OBSERVABILITY_NOT_CONFIGURED',
  'Null service rejected'
);
console.log('  ✓ Deployment target resolution validated.\n');

// 4. Kubernetes rollout evaluation (Contract: Never fabricate success)
console.log('4. Testing Real Rollout Evaluation Logic:');

// 4a. In-progress rollout
const inProgress = evaluateRolloutStatus({
  deploymentStatus: {
    generation: 2,
    observedGeneration: 2,
    desiredReplicas: 3,
    updatedReplicas: 2,
    availableReplicas: 1,
    readyReplicas: 1,
    unavailableReplicas: 2,
    conditions: [{ type: 'Progressing', status: 'True', reason: 'ReplicaSetUpdated' }],
  },
});
assert.strictEqual(inProgress.complete, false);
assert.strictEqual(inProgress.failed, false);
assert.strictEqual(inProgress.reason, 'Progressing');

// 4b. Generation lag (API received spec, controller hasn't reconciled yet)
const genLag = evaluateRolloutStatus({
  deploymentStatus: {
    generation: 3,
    observedGeneration: 2,
    desiredReplicas: 2,
    updatedReplicas: 2,
    availableReplicas: 2,
    readyReplicas: 2,
  },
});
assert.strictEqual(genLag.complete, false, 'Cannot be complete while observedGeneration < generation');

// 4c. Fully completed rollout
const completed = evaluateRolloutStatus({
  deploymentStatus: {
    generation: 2,
    observedGeneration: 2,
    desiredReplicas: 2,
    updatedReplicas: 2,
    availableReplicas: 2,
    readyReplicas: 2,
    unavailableReplicas: 0,
    conditions: [
      { type: 'Progressing', status: 'True', reason: 'NewReplicaSetAvailable' },
      { type: 'Available', status: 'True', reason: 'MinimumReplicasAvailable' },
    ],
  },
});
assert.strictEqual(completed.complete, true);
assert.strictEqual(completed.failed, false);
assert.strictEqual(completed.availableReplicas, 2);
assert.strictEqual(completed.readyReplicas, 2);

// 4d. Failed rollout (ProgressDeadlineExceeded)
const failedRollout = evaluateRolloutStatus({
  deploymentStatus: {
    generation: 2,
    observedGeneration: 2,
    desiredReplicas: 2,
    updatedReplicas: 1,
    availableReplicas: 0,
    readyReplicas: 0,
    conditions: [
      {
        type: 'Progressing',
        status: 'False',
        reason: 'ProgressDeadlineExceeded',
        message: 'ReplicaSet "demo-checkout-service-xyz" has timed out progressing.',
      },
    ],
  },
});
assert.strictEqual(failedRollout.complete, false);
assert.strictEqual(failedRollout.failed, true);
assert.strictEqual(failedRollout.reason, 'ProgressDeadlineExceeded');
console.log('  ✓ Rollout evaluation correctly differentiates in-progress, completed, and failed rollouts.\n');

// 5. GitHub workflow state mapping
console.log('5. Testing GitHub Workflow State Mapping:');
assert.deepStrictEqual(
  workflowState({ status: 'queued' }),
  { buildStatus: 'building', deployStatus: 'pending' }
);
assert.deepStrictEqual(
  workflowState({ status: 'in_progress' }),
  { buildStatus: 'building', deployStatus: 'pending' }
);
assert.deepStrictEqual(
  workflowState({ status: 'completed', conclusion: 'success' }),
  { buildStatus: 'success', deployStatus: 'pending' }
);
assert.deepStrictEqual(
  workflowState({ status: 'completed', conclusion: 'failure' }),
  { buildStatus: 'failed', deployStatus: 'failed' }
);
console.log('  ✓ Workflow run state transitions validated.\n');

// 6. Kubernetes service deployment validation & error handling
console.log('6. Testing Kubernetes Service Deployment Validation:');
assert.rejects(
  async () => k8sService.setDeploymentImage({ deploymentName: '', namespace: 'devops-copilot', containerName: 'app', image: 'test:v1' }),
  (err) => err.code === 'INVALID_DEPLOYMENT_IMAGE_REQUEST'
);
assert.rejects(
  async () => k8sService.deployService({ deploymentName: 'app', namespace: 'devops-copilot', image: '' }),
  (err) => err.code === 'INVALID_DEPLOYMENT_IMAGE_REQUEST'
);
console.log('  ✓ Parameter validation and error handling validated.\n');

console.log('All Phase 5 CI/CD & Kubernetes Integration Tests Passed Successfully!');
