const assert = require('assert');
const recoveryService = require('../services/recovery.service');

console.log('Running Self-Healing Controller Safety & Allow-List Tests...\n');

// Test 1: Permitted Actions
const testAllowed = recoveryService.validateSafety({
  deploymentName: 'demo-checkout-service',
  namespace: 'default',
  actionType: 'ROLLBACK',
});
assert.strictEqual(testAllowed.allowed, true, 'Approved action ROLLBACK must be allowed');
console.log('✓ Test 1: Approved action (ROLLBACK) successfully permitted.');

// Test 2: Arbitrary/Unsafe Action Rejection
const testUnsafe = recoveryService.validateSafety({
  deploymentName: 'demo-checkout-service',
  namespace: 'default',
  actionType: 'DELETE_CLUSTER',
});
assert.strictEqual(testUnsafe.allowed, false, 'Unapproved action must be blocked');
console.log('✓ Test 2: Unsafe/arbitrary action (DELETE_CLUSTER) successfully blocked by allow-list.');

// Test 3: Disallowed Namespace
const testNamespace = recoveryService.validateSafety({
  deploymentName: 'demo-checkout-service',
  namespace: 'kube-system',
  actionType: 'RESTART',
});
assert.strictEqual(testNamespace.allowed, false, 'Restricted namespace kube-system must be blocked');
console.log('✓ Test 3: Restricted namespace (kube-system) successfully blocked.');

console.log('\nAll Safety & Controller Allow-List Tests Passed Successfully! (3/3)\n');
