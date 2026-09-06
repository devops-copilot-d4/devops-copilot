const assert = require('assert');
const { workflowState } = require('../controllers/deployment.controller');

assert.deepStrictEqual(workflowState({ status: 'completed', conclusion: 'failure' }), { buildStatus: 'failed', deployStatus: 'failed' });
assert.deepStrictEqual(workflowState({ status: 'completed', conclusion: 'success' }), { buildStatus: 'success', deployStatus: 'pending' });
console.log('Workflow failures remain failed and successful builds are not reported as running deployments.');
