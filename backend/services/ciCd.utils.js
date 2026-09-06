// Pure CI/CD utilities — no I/O. Used by the deployment controller, the
// Kubernetes service, and the Phase 5 unit tests so the real deployment
// path can be exercised without fabricating cluster state.

const SHORT_SHA_LENGTH = 12;

const invalidImageTag = (message) => {
  const error = new Error(message);
  error.code = 'INVALID_IMAGE_TAG';
  error.statusCode = 400;
  return error;
};

// Returns the short immutable commit-based tag (e.g. "8f43a2c91b4d") from a
// full Git SHA. Throws for empty or non-SHA-shaped input so CI never pushes a
// blank/ambiguous tag silently.
const shortSha = (sha) => {
  if (!sha || typeof sha !== 'string') {
    throw invalidImageTag('A commit SHA is required to build an immutable image tag.');
  }
  const trimmed = sha.trim();
  if (!/^[0-9a-f]{7,40}$/i.test(trimmed)) {
    throw invalidImageTag(`Invalid Git SHA for image tag: "${trimmed}". Expected a 7–40 character hex SHA.`);
  }
  return trimmed.toLowerCase().slice(0, SHORT_SHA_LENGTH);
};

// Builds a fully qualified image reference such as:
//   imageRef({ registry: 'docker.io', repository: 'devops-copilot-d4', service: 'devops-copilot-backend', tag: '8f43a2c91b4d' })
//   -> docker.io/devops-copilot-d4/devops-copilot-backend:8f43a2c91b4d
// Registry and repository are optional; service and tag are required.
const imageRef = ({ registry, repository, service, tag }) => {
  if (!service || !tag) {
    throw invalidImageTag('service and tag are required to build an image reference.');
  }
  const prefix = registry ? `${registry}/` : '';
  const repo = repository ? `${repository}/` : '';
  return `${prefix}${repo}${service}:${tag}`;
};

// Validates that a registered Service record maps to a real Kubernetes
// deployment target. Throws a structured SERVICE_OBSERVABILITY_NOT_CONFIGURED
// error (422) when the mapping is incomplete instead of guessing a default.
const deploymentTargetFor = (service) => {
  if (!service || !service.deploymentName || !service.namespace) {
    const error = new Error('Service is missing Kubernetes deployment or namespace configuration.');
    error.code = 'SERVICE_OBSERVABILITY_NOT_CONFIGURED';
    error.statusCode = 422;
    throw error;
  }
  const containerName = service.containerName ||
    process.env.K8S_CONTAINER_NAME ||
    (service.deploymentName === 'demo-checkout-service' ? 'checkout-api' : 'checkout-api');
  return {
    deploymentName: service.deploymentName,
    namespace: service.namespace,
    containerName,
    imageName: service.imageName || null,
  };
};

// Pure rollout evaluation against the *parsed* deployment status returned by
// the Kubernetes API. Kubernetes is the authoritative source; this function
// never fabricates a completion.
//
// Complete requires ALL of:
//   - observedGeneration >= generation   (controller has observed the new spec)
//   - desiredReplicas > 0
//   - updatedReplicas >= desiredReplicas (new ReplicaSet is fully rolled out)
//   - availableReplicas >= desiredReplicas
//   - readyReplicas >= desiredReplicas
const evaluateRolloutStatus = ({ deploymentStatus }) => {
  const status = deploymentStatus || {};
  const desired = Number(status.desiredReplicas ?? 0);
  const updated = Number(status.updatedReplicas ?? 0);
  const available = Number(status.availableReplicas ?? 0);
  const ready = Number(status.readyReplicas ?? 0);
  const unavailable = Number(status.unavailableReplicas ?? 0);
  const generationReady =
    status.observedGeneration != null &&
    status.generation != null &&
    status.observedGeneration >= status.generation;
  const conditions = Array.isArray(status.conditions) ? status.conditions : [];
  const progressing = conditions.find((condition) => condition.type === 'Progressing');
  const availableCondition = conditions.find((condition) => condition.type === 'Available');

  const failureCondition =
    (progressing && progressing.status === 'False') ||
    (availableCondition && availableCondition.status === 'False' && available === 0 && !generationReady) ||
    (!generationReady && desired > 0 && updated === 0 && available === 0);

  const base = {
    desiredReplicas: desired,
    updatedReplicas: updated,
    availableReplicas: available,
    readyReplicas: ready,
    unavailableReplicas: unavailable,
  };

  if (failureCondition) {
    const reason =
      (progressing && progressing.reason) ||
      (availableCondition && availableCondition.reason) ||
      'ProgressDeadlineExceeded';
    const message =
      (progressing && progressing.message) ||
      (availableCondition && availableCondition.message) ||
      'Deployment did not complete within the rollout deadline.';
    return { ...base, complete: false, failed: true, reason, message };
  }

  const complete = generationReady && desired > 0 && updated >= desired && available >= desired && ready >= desired;
  return {
    ...base,
    complete,
    failed: false,
    reason: complete ? 'NewReplicaSetAvailable' : 'Progressing',
    message: complete
      ? `Rollout complete: ${available}/${desired} replicas available and ready.`
      : `Rollout in progress: ${available}/${desired} available, ${updated}/${desired} updated.`,
  };
};

module.exports = {
  SHORT_SHA_LENGTH,
  shortSha,
  imageRef,
  deploymentTargetFor,
  evaluateRolloutStatus,
};