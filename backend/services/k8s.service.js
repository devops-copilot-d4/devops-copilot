const axios = require('axios');
const fs = require('fs');
const https = require('https');

const SERVICE_ACCOUNT_DIR = '/var/run/secrets/kubernetes.io/serviceaccount';

const infrastructureError = (message, cause) => {
  const error = new Error(message);
  error.code = 'KUBERNETES_UNAVAILABLE';
  error.statusCode = 503;
  error.cause = cause;
  return error;
};

const getClient = () => {
  const configuredUrl = process.env.K8S_API_URL;
  const configuredToken = process.env.K8S_TOKEN;
  const inCluster = fs.existsSync(`${SERVICE_ACCOUNT_DIR}/token`);
  if (!configuredUrl && !inCluster) throw infrastructureError('Kubernetes API is not configured. Set K8S_API_URL and K8S_TOKEN, or run in a Kubernetes pod.');

  let token = configuredToken;
  let ca;
  if (inCluster && !token) {
    token = fs.readFileSync(`${SERVICE_ACCOUNT_DIR}/token`, 'utf8').trim();
    ca = fs.readFileSync(`${SERVICE_ACCOUNT_DIR}/ca.crt`);
  }
  if (!token) throw infrastructureError('Kubernetes authentication is not configured. Set K8S_TOKEN or use an in-cluster service account.');

  return axios.create({
    baseURL: configuredUrl || 'https://kubernetes.default.svc',
    headers: { Authorization: `Bearer ${token}` },
    httpsAgent: new https.Agent({ ca, rejectUnauthorized: Boolean(ca) }),
    timeout: Number(process.env.K8S_TIMEOUT_MS || 5000),
  });
};

const kubernetesRequest = async (operation) => {
  try {
    return await operation(getClient());
  } catch (err) {
    if (err.statusCode) throw err;
    if (err.response?.status === 404) {
      const error = new Error('Kubernetes resource was not found.');
      error.code = 'KUBERNETES_RESOURCE_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }
    throw infrastructureError('Kubernetes API request failed.', err);
  }
};

const getAge = (timestamp) => {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  return `${Math.floor(diffSec / 3600)}h`;
};

const parsePod = (pod) => {
  const statuses = pod.status?.containerStatuses || [];
  const initStatuses = pod.status?.initContainerStatuses || [];
  const containers = statuses.map((container) => {
    const state = container.state || {};
    const currentState = state.waiting?.reason || state.terminated?.reason || (state.running ? 'Running' : 'Unknown');
    return {
      name: container.name,
      ready: Boolean(container.ready),
      restartCount: container.restartCount || 0,
      state: currentState,
      reason: state.waiting?.reason || state.terminated?.reason || null,
      message: state.waiting?.message || state.terminated?.message || null,
      exitCode: state.terminated?.exitCode ?? null,
    };
  });
  const readyCount = containers.filter((container) => container.ready).length;
  const allReady = containers.length > 0 && readyCount === containers.length;
  const primaryProblem = containers.find((container) => container.reason);
  return {
    name: pod.metadata.name,
    namespace: pod.metadata.namespace,
    phase: pod.status?.phase || 'Unknown',
    ready: allReady,
    readiness: `${readyCount}/${containers.length}`,
    restartCount: containers.reduce((total, container) => total + container.restartCount, 0),
    status: primaryProblem?.reason || pod.status?.phase || 'Unknown',
    reason: primaryProblem?.reason || pod.status?.reason || null,
    message: primaryProblem?.message || pod.status?.message || null,
    node: pod.spec?.nodeName || null,
    podIP: pod.status?.podIP || null,
    createdAt: pod.metadata.creationTimestamp || null,
    age: pod.metadata?.creationTimestamp ? getAge(pod.metadata.creationTimestamp) : null,
    containers,
    initContainers: initStatuses.map((container) => ({ name: container.name, ready: Boolean(container.ready), restartCount: container.restartCount || 0 })),
  };
};

const parseDeployment = (deployment) => {
  const specReplicas = deployment.spec?.replicas ?? 0;
  const status = deployment.status || {};
  const observedGeneration = status.observedGeneration ?? 0;
  const generation = deployment.metadata?.generation ?? 0;
  const availableReplicas = status.availableReplicas ?? 0;
  const readyReplicas = status.readyReplicas ?? 0;
  return {
    name: deployment.metadata.name,
    namespace: deployment.metadata.namespace,
    generation,
    observedGeneration,
    desiredReplicas: specReplicas,
    availableReplicas,
    readyReplicas,
    updatedReplicas: status.updatedReplicas ?? 0,
    unavailableReplicas: status.unavailableReplicas ?? 0,
    status: observedGeneration >= generation && specReplicas > 0 && availableReplicas >= specReplicas ? 'Healthy' : 'Degraded',
    conditions: (status.conditions || []).map((condition) => ({ type: condition.type, status: condition.status, reason: condition.reason || null, message: condition.message || null, lastTransitionTime: condition.lastTransitionTime || null })),
  };
};

const parseReplicaSet = (replicaSet) => ({
  name: replicaSet.metadata.name,
  namespace: replicaSet.metadata.namespace,
  revision: replicaSet.metadata.annotations?.['deployment.kubernetes.io/revision'] || null,
  desiredReplicas: replicaSet.spec?.replicas ?? 0,
  readyReplicas: replicaSet.status?.readyReplicas ?? 0,
  availableReplicas: replicaSet.status?.availableReplicas ?? 0,
  createdAt: replicaSet.metadata.creationTimestamp || null,
});

const parseEvent = (event) => ({
  type: event.type || 'Normal',
  reason: event.reason || null,
  message: event.message || null,
  count: event.count ?? 1,
  firstTimestamp: event.firstTimestamp || event.eventTime || event.metadata?.creationTimestamp || null,
  lastTimestamp: event.lastTimestamp || event.eventTime || event.metadata?.creationTimestamp || null,
  involvedObject: { kind: event.involvedObject?.kind || null, name: event.involvedObject?.name || null, namespace: event.involvedObject?.namespace || null },
});

const listPods = async ({ deploymentName, namespace }) => kubernetesRequest(async (client) => {
  const response = await client.get(`/api/v1/namespaces/${namespace}/pods`, { params: { labelSelector: `app=${deploymentName}` } });
  return response.data.items || [];
});

const getPods = async ({ deploymentName, namespace }) => (await listPods({ deploymentName, namespace })).map(parsePod);

const getDeploymentStatus = async ({ deploymentName, namespace }) => kubernetesRequest(async (client) => {
  const response = await client.get(`/apis/apps/v1/namespaces/${namespace}/deployments/${deploymentName}`);
  return { ...parseDeployment(response.data), pods: await getPods({ deploymentName, namespace }) };
});

const getReplicaSets = async ({ deploymentName, namespace }) => kubernetesRequest(async (client) => {
  const response = await client.get(`/apis/apps/v1/namespaces/${namespace}/replicasets`, { params: { labelSelector: `app=${deploymentName}` } });
  return (response.data.items || [])
    .filter((item) => (item.metadata.ownerReferences || []).some((owner) => owner.kind === 'Deployment' && owner.name === deploymentName))
    .map(parseReplicaSet)
    .sort((left, right) => Number(right.revision || 0) - Number(left.revision || 0));
});

const getDeploymentHistory = async ({ deploymentName, namespace }) => ({ deploymentName, namespace, replicaSets: await getReplicaSets({ deploymentName, namespace }) });

const getEvents = async ({ deploymentName, namespace }) => kubernetesRequest(async (client) => {
  const pods = await listPods({ deploymentName, namespace });
  const relevantNames = new Set([deploymentName, ...pods.map((pod) => pod.metadata.name)]);
  const response = await client.get(`/api/v1/namespaces/${namespace}/events`);
  return (response.data.items || [])
    .filter((event) => relevantNames.has(event.involvedObject?.name))
    .map(parseEvent)
    .sort((left, right) => new Date(right.lastTimestamp || 0) - new Date(left.lastTimestamp || 0));
});

const getPodLogs = async ({ namespace, podName, container, tailLines = Number(process.env.K8S_LOG_TAIL_LINES || 200) }) => {
  if (!podName) {
    const error = new Error('A pod name is required to retrieve Kubernetes logs.');
    error.code = 'LOGS_UNAVAILABLE';
    error.statusCode = 400;
    throw error;
  }
  return kubernetesRequest(async (client) => {
    const response = await client.get(`/api/v1/namespaces/${namespace}/pods/${podName}/log`, { params: { container: container || undefined, tailLines, timestamps: true } });
    return { podName, namespace, container: container || null, logs: response.data, tailLines };
  });
};

const observe = async (operation, unavailableCode) => {
  try {
    return { available: true, source: 'kubernetes', timestamp: new Date().toISOString(), ...(await operation()) };
  } catch (error) {
    const transportUnavailable = error.code === 'KUBERNETES_UNAVAILABLE';
    return {
      available: false,
      source: 'kubernetes',
      timestamp: new Date().toISOString(),
      errorCode: transportUnavailable ? 'KUBERNETES_UNAVAILABLE' : (error.code || unavailableCode || 'KUBERNETES_UNAVAILABLE'),
      message: transportUnavailable ? 'Kubernetes API is unavailable.' : error.message,
    };
  }
};

const restartDeployment = async ({ deploymentName, namespace }) => kubernetesRequest(async (client) => {
  await client.patch(`/apis/apps/v1/namespaces/${namespace}/deployments/${deploymentName}`, { spec: { template: { metadata: { annotations: { 'kubectl.kubernetes.io/restartedAt': new Date().toISOString() } } } } }, { headers: { 'Content-Type': 'application/merge-patch+json' } });
  return { status: 'restart_requested', deploymentName, namespace };
});

const rollbackDeployment = async () => {
  const error = new Error('Revision-aware Kubernetes rollback is not implemented yet.');
  error.code = 'KUBERNETES_ROLLBACK_UNAVAILABLE';
  error.statusCode = 501;
  throw error;
};

const scaleDeployment = async ({ deploymentName, namespace, replicas }) => kubernetesRequest(async (client) => {
  await client.patch(`/apis/apps/v1/namespaces/${namespace}/deployments/${deploymentName}/scale`, { spec: { replicas } }, { headers: { 'Content-Type': 'application/merge-patch+json' } });
  return { status: 'scale_requested', deploymentName, namespace, replicas };
});

const { evaluateRolloutStatus } = require('./ciCd.utils');

// Kubernetes-native image update (API equivalent of kubectl set image).
async function setDeploymentImage({ deploymentName, namespace, containerName, image }) {
  if (!deploymentName || !namespace || !containerName || !image) {
    const error = new Error('deploymentName, namespace, containerName and image are required to set a deployment image.');
    error.code = 'INVALID_DEPLOYMENT_IMAGE_REQUEST';
    error.statusCode = 400;
    throw error;
  }
  return kubernetesRequest(async (client) => {
    const patch = { spec: { template: { spec: { containers: [{ name: containerName, image }] } } } };
    const response = await client.patch(
      '/apis/apps/v1/namespaces/' + namespace + '/deployments/' + deploymentName,
      patch,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } }
    );
    return {
      status: 'image_updated',
      deploymentName, namespace, container: containerName, image,
      generation: response.data?.metadata?.generation ?? null,
    };
  });
}

// Real rollout tracking: polls Kubernetes until observedGeneration,
// desired/updated/available/ready replica counts satisfy the contract.
async function waitForRollout({ deploymentName, namespace, timeoutMs = Number(process.env.K8S_ROLLOUT_TIMEOUT_MS || 180000), intervalMs = Number(process.env.K8S_ROLLOUT_POLL_MS || 5000) }) {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = null;
  while (Date.now() < deadline) {
    const deployment = await getDeploymentStatus({ deploymentName, namespace });
    lastStatus = deployment;
    const evaluation = evaluateRolloutStatus({ deploymentStatus: deployment });
    if (evaluation.failed) {
      const error = new Error('Rollout failed: ' + evaluation.reason + ' - ' + evaluation.message);
      error.code = 'KUBERNETES_ROLLOUT_FAILED';
      error.statusCode = 502;
      error.details = evaluation;
      throw error;
    }
    if (evaluation.complete) {
      return {
        status: 'rollout_complete',
        deploymentName, namespace, evaluation, deployment: lastStatus,
        durationMs: timeoutMs - (deadline - Date.now()),
      };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  const error = new Error(
    'Rollout timed out after ' + Math.floor(timeoutMs / 1000) + 's. ' +
    'Latest status: ' + (lastStatus ? lastStatus.availableReplicas + '/' + lastStatus.desiredReplicas + ' available, ' + lastStatus.updatedReplicas + '/' + lastStatus.desiredReplicas + ' updated' : 'unknown') + '.'
  );
  error.code = 'KUBERNETES_ROLLOUT_TIMEOUT';
  error.statusCode = 504;
  error.details = lastStatus;
  throw error;
}

// Deploys by setting the container image and waiting for a real rollout.
async function deployService({ deploymentName, namespace, containerName, image }) {
  if (!image) {
    const error = new Error('image is required to deploy a service.');
    error.code = 'INVALID_DEPLOYMENT_IMAGE_REQUEST';
    error.statusCode = 400;
    throw error;
  }
  const resolvedContainer = containerName || (deploymentName === 'demo-checkout-service' ? 'checkout-api' : (process.env.K8S_CONTAINER_NAME || 'checkout-api'));
  const imageResult = await setDeploymentImage({ deploymentName, namespace, containerName: resolvedContainer, image });
  const rollout = await waitForRollout({ deploymentName, namespace });
  return { ...imageResult, ...rollout, status: 'deployed' };
}

module.exports = { getPods, getDeploymentStatus, getReplicaSets, getDeploymentHistory, getEvents, getPodLogs, observe, restartDeployment, rollbackDeployment, scaleDeployment, setDeploymentImage, waitForRollout, deployService, kubernetesRequest, infrastructureError, parsePod, parseDeployment, parseReplicaSet, parseEvent };
