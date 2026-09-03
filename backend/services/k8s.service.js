// Kubernetes integration layer & Cluster State Manager.
// Provides direct live Kubernetes REST API bindings with automatic fallback
// for local demo, chaos engineering, and self-healing verification.

const axios = require('axios');
const https = require('https');

// K8S_API_URL and K8S_TOKEN must come from environment variables only.
// Never hardcode a service-account token here - it grants cluster access
// and must not be committed to source control. If unset, the client below
// simply won't have credentials and calls will fail over to the local
// demo fallback data further down in this file.
const K8S_API_URL = process.env.K8S_API_URL || 'https://host.docker.internal:51810';
const K8S_TOKEN = process.env.K8S_TOKEN || '';

if (!K8S_TOKEN) {
  console.warn('[k8s.service] K8S_TOKEN not set - live cluster calls will fail and fall back to demo cache data.');
}

const k8sClient = axios.create({
  baseURL: K8S_API_URL,
  headers: K8S_TOKEN ? { Authorization: `Bearer ${K8S_TOKEN}` } : {},
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  timeout: 5000,
});

const podRegistry = new Map();

// Helper to generate realistic K8s pod names
const generatePodName = (deploymentName) => {
  const hash = Math.random().toString(36).substring(2, 7);
  const rand = Math.random().toString(36).substring(2, 7);
  return `${deploymentName || 'service'}-${hash}-${rand}`;
};

// Calculate human-readable age
const getAge = (timestamp) => {
  if (!timestamp) return '1m';
  const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  return `${Math.floor(diffSec / 3600)}h`;
};

const getPods = async ({ deploymentName = 'demo-checkout-service', namespace = 'devops-copilot' }) => {
  try {
    const res = await k8sClient.get(`/api/v1/namespaces/${namespace}/pods`, {
      params: { labelSelector: `app=${deploymentName}` },
    });
    if (res.data && res.data.items && res.data.items.length > 0) {
      return res.data.items.map((pod) => {
        const containerStatus = pod.status.containerStatuses?.[0] || {};
        const isReady = containerStatus.ready ? '1/1' : '0/1';
        let status = pod.status.phase || 'Running';
        if (containerStatus.state?.waiting?.reason) {
          status = containerStatus.state.waiting.reason;
        } else if (containerStatus.state?.terminated?.reason) {
          status = containerStatus.state.terminated.reason;
        }
        return {
          name: pod.metadata.name,
          namespace: pod.metadata.namespace,
          deploymentName,
          status,
          ready: isReady,
          restarts: containerStatus.restartCount || 0,
          age: getAge(pod.metadata.creationTimestamp),
          cpu: `${Math.floor(20 + Math.random() * 20)}m`,
          memory: `${Math.floor(110 + Math.random() * 30)}Mi`,
          node: pod.spec.nodeName || 'desktop-control-plane',
        };
      });
    }
  } catch (err) {
    console.warn(`[k8s.service] K8s API getPods notice: ${err.message}. Using cluster cache.`);
  }

  // Fallback cache
  const key = `${namespace}/${deploymentName}`;
  if (!podRegistry.has(key)) {
    const defaultPods = [
      {
        name: `${deploymentName}-6bd6984b5-56p94`,
        namespace,
        deploymentName,
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '2m',
        cpu: '24m',
        memory: '128Mi',
        node: 'desktop-control-plane',
      },
      {
        name: `${deploymentName}-6bd6984b5-h9j7t`,
        namespace,
        deploymentName,
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '2m',
        cpu: '28m',
        memory: '132Mi',
        node: 'desktop-control-plane',
      },
    ];
    podRegistry.set(key, defaultPods);
  }
  return podRegistry.get(key);
};

const getDeploymentStatus = async ({ deploymentName = 'demo-checkout-service', namespace = 'devops-copilot' }) => {
  let replicas = 2;
  let availableReplicas = 2;
  let isHealthy = true;

  try {
    const depRes = await k8sClient.get(`/apis/apps/v1/namespaces/${namespace}/deployments/${deploymentName}`);
    if (depRes.data) {
      replicas = depRes.data.spec?.replicas || 2;
      availableReplicas = depRes.data.status?.availableReplicas || 0;
      isHealthy = availableReplicas >= replicas && availableReplicas > 0;
    }
  } catch (err) {
    console.warn(`[k8s.service] getDeploymentStatus notice: ${err.message}`);
  }

  const pods = await getPods({ deploymentName, namespace });
  const running = pods.filter((p) => p.status === 'Running' && p.ready === '1/1').length;
  if (running < replicas) {
    isHealthy = false;
  }

  return {
    deploymentName,
    namespace,
    replicas,
    availableReplicas: running,
    status: isHealthy ? 'Healthy' : 'Degraded',
    pods,
  };
};

const restartDeployment = async ({ deploymentName = 'demo-checkout-service', namespace = 'devops-copilot' }) => {
  try {
    await k8sClient.patch(
      `/apis/apps/v1/namespaces/${namespace}/deployments/${deploymentName}`,
      {
        spec: {
          template: {
            metadata: {
              annotations: {
                'kubectl.kubernetes.io/restartedAt': new Date().toISOString(),
              },
            },
            spec: {
              containers: [
                {
                  name: 'checkout-api',
                  image: 'tharungowda/demo-checkout-service:v1.0.0',
                  imagePullPolicy: 'IfNotPresent',
                  command: null,
                  env: null,
                },
              ],
            },
          },
        },
      },
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    );
    console.log(`[k8s.service] Rolling restart triggered in live Kubernetes for ${deploymentName}`);
  } catch (err) {
    console.warn(`[k8s.service] Live restart notice: ${err.message}`);
  }

  const pods = await getPods({ deploymentName, namespace });
  return { status: 'restarted', deploymentName, namespace, pods };
};

const rollbackDeployment = async ({ deploymentName = 'demo-checkout-service', namespace = 'devops-copilot' }) => {
  try {
    await k8sClient.patch(
      `/apis/apps/v1/namespaces/${namespace}/deployments/${deploymentName}`,
      {
        spec: {
          template: {
            metadata: {
              annotations: {
                'kubectl.kubernetes.io/restartedAt': new Date().toISOString(),
                'copilot.recovery/action': 'rollback-to-stable',
              },
            },
            spec: {
              containers: [
                {
                  name: 'checkout-api',
                  image: 'tharungowda/demo-checkout-service:v1.0.0',
                  imagePullPolicy: 'IfNotPresent',
                  command: null,
                  env: null,
                },
              ],
            },
          },
        },
      },
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    );
    console.log(`[k8s.service] Rollback executed in live Kubernetes for ${deploymentName}`);
  } catch (err) {
    console.warn(`[k8s.service] Live rollback notice: ${err.message}`);
  }

  const pods = await getPods({ deploymentName, namespace });
  return { status: 'rolled_back', deploymentName, namespace, pods };
};

const scaleDeployment = async ({ deploymentName = 'demo-checkout-service', namespace = 'devops-copilot', replicas = 3 }) => {
  try {
    await k8sClient.patch(
      `/apis/apps/v1/namespaces/${namespace}/deployments/${deploymentName}/scale`,
      {
        spec: { replicas },
      },
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    );
    console.log(`[k8s.service] Scaled ${deploymentName} to ${replicas} replicas in live Kubernetes`);
  } catch (err) {
    console.warn(`[k8s.service] Live scale notice: ${err.message}`);
  }

  const pods = await getPods({ deploymentName, namespace });
  return { status: 'scaled', deploymentName, namespace, replicas, pods };
};

const injectPodFailure = async ({ deploymentName = 'demo-checkout-service', namespace = 'devops-copilot' }) => {
  try {
    await k8sClient.patch(
      `/apis/apps/v1/namespaces/${namespace}/deployments/${deploymentName}`,
      {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'checkout-api',
                  image: 'tharungowda/demo-checkout-service:v1.0.0',
                  imagePullPolicy: 'IfNotPresent',
                  command: ['sh', '-c', "echo '[FATAL] Missing DB credentials! Application crashing...' && exit 1"],
                },
              ],
            },
          },
        },
      },
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    );
    console.log(`[k8s.service] Injected real CrashLoopBackOff chaos fault into Kubernetes deployment ${deploymentName}`);
  } catch (err) {
    console.warn(`[k8s.service] Live fault injection notice: ${err.message}`);
  }

  const pods = await getPods({ deploymentName, namespace });
  return pods;
};

const deployService = async ({ deploymentName = 'demo-checkout-service', namespace = 'devops-copilot', imageName = 'tharungowda/demo-checkout-service:v1.0.0' }) => {
  return rollbackDeployment({ deploymentName, namespace });
};

module.exports = {
  deployService,
  restartDeployment,
  rollbackDeployment,
  scaleDeployment,
  getDeploymentStatus,
  getPods,
  injectPodFailure,
};
