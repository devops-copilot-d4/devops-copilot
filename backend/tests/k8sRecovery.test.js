const assert = require('assert');
const recoveryService = require('../services/recovery.service');

async function testRecoveryExecution() {
  console.log('Running Self-Healing Execution & Closed-Loop Verification Tests...\n');

  // Test 1: Rolling Restart Execution & Verification
  const restartResult = await recoveryService.executeRecovery({
    deploymentName: 'demo-checkout-service',
    namespace: 'default',
    actionType: 'RESTART',
    reason: 'Automated test restart',
    bypassCooldown: true,
  });

  assert.strictEqual(restartResult.success, true);
  assert.strictEqual(restartResult.status, 'RECOVERY_SUCCESSFUL');
  assert(restartResult.mttr > 0, 'MTTR must be computed');
  console.log(`✓ Test 1: RESTART executed and verified in ${restartResult.mttr}s.`);

  // Test 2: Rollback Execution & Verification
  const rollbackResult = await recoveryService.executeRecovery({
    deploymentName: 'demo-checkout-service',
    namespace: 'default',
    actionType: 'ROLLBACK',
    reason: 'Automated test rollback',
    bypassCooldown: true,
  });

  assert.strictEqual(rollbackResult.success, true);
  assert.strictEqual(rollbackResult.status, 'RECOVERY_SUCCESSFUL');
  console.log(`✓ Test 2: ROLLBACK executed and verified in ${rollbackResult.mttr}s.`);

  console.log('\nAll Self-Healing & Verification Tests Passed! (2/2)\n');
}

testRecoveryExecution().catch(console.error);
