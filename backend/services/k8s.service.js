// Kubernetes integration layer.
//
// Uses the official @kubernetes/client-node package (install when you reach
// Week 3-4 of the roadmap): npm install @kubernetes/client-node
//
// This file is intentionally structured so each function maps 1:1 to a
// self-healing action type in RecoveryAction.actionType, keeping the
// recovery-decision logic and the K8s execution logic cleanly separated.

// const k8s = require('@kubernetes/client-node');
// const kc = new k8s.KubeConfig();
// kc.loadFromDefault(); // reads ~/.kube/config (works with minikube out of the box)
// const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
// const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);

const deployService = async ({ deploymentName, namespace, imageName }) => {
  // TODO (Week 3): build a Deployment manifest from imageName and apply it
  // via k8sAppsApi.createNamespacedDeployment(...)
  console.log(`[k8s.service] deploy ${deploymentName} in ${namespace} using ${imageName}`);
  return { status: 'deployed', deploymentName, namespace };
};

const restartDeployment = async ({ deploymentName, namespace }) => {
  // TODO (Week 6): patch the deployment's pod template annotation to force
  // a rolling restart, e.g. kubectl rollout restart deployment/<name>
  console.log(`[k8s.service] restart ${deploymentName} in ${namespace}`);
  return { status: 'restarted', deploymentName, namespace };
};

const rollbackDeployment = async ({ deploymentName, namespace }) => {
  // TODO (Week 6): use rollback to previous ReplicaSet revision
  console.log(`[k8s.service] rollback ${deploymentName} in ${namespace}`);
  return { status: 'rolled_back', deploymentName, namespace };
};

const scaleDeployment = async ({ deploymentName, namespace, replicas }) => {
  // TODO (Week 6): patch spec.replicas on the deployment
  console.log(`[k8s.service] scale ${deploymentName} in ${namespace} to ${replicas} replicas`);
  return { status: 'scaled', deploymentName, namespace, replicas };
};

const getDeploymentStatus = async ({ deploymentName, namespace }) => {
  // TODO (Week 3-4): read live status (available replicas, pod health) from K8s API
  console.log(`[k8s.service] status check ${deploymentName} in ${namespace}`);
  return { status: 'unknown', deploymentName, namespace };
};

module.exports = {
  deployService,
  restartDeployment,
  rollbackDeployment,
  scaleDeployment,
  getDeploymentStatus,
};

