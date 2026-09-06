const assert = require('assert');
const k8s = require('../services/k8s.service');

async function run() {
  const previousUrl = process.env.K8S_API_URL;
  const previousToken = process.env.K8S_TOKEN;
  delete process.env.K8S_API_URL;
  delete process.env.K8S_TOKEN;
  try {
    await assert.rejects(() => k8s.getDeploymentStatus({ deploymentName: 'demo-checkout-service', namespace: 'default' }), (error) => error.code === 'KUBERNETES_UNAVAILABLE' && error.statusCode === 503);
    console.log('Kubernetes unavailable returns KUBERNETES_UNAVAILABLE without healthy defaults.');
  } finally {
    if (previousUrl === undefined) delete process.env.K8S_API_URL; else process.env.K8S_API_URL = previousUrl;
    if (previousToken === undefined) delete process.env.K8S_TOKEN; else process.env.K8S_TOKEN = previousToken;
  }
}

run().catch((error) => { console.error(error); process.exit(1); });
