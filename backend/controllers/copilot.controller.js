const mongoose = require('mongoose');
const Service = require('../models/Service');
const Incident = require('../models/Incident');
const RecoveryAction = require('../models/RecoveryAction');
const k8s = require('../services/k8s.service');
const { collectServiceTelemetry } = require('../services/prometheus.service');
const aiClient = require('../services/aiService.client');
const { extractFeatures } = require('../services/copilotFeature.service');
const recovery = require('../services/copilotRecovery.service');

async function resolveService(identifier) {
  if (!identifier) { const error = new Error('serviceId or serviceName is required.'); error.statusCode = 400; throw error; }
  const service = (mongoose.isValidObjectId(identifier) ? await Service.findById(identifier) : null) || await Service.findOne({ $or: [{ deploymentName: identifier }, { name: identifier }] });
  if (!service) { const error = new Error('Service not found.'); error.code = 'SERVICE_NOT_FOUND'; error.statusCode = 404; throw error; }
  return service;
}

const serializeEvents = (events) => events.map((event) => `${event.type || 'Normal'} ${event.reason || ''}: ${event.message || ''}`).join('\n');
const recentDeployment = (deployment) => (deployment.conditions || []).some((condition) => condition.lastTransitionTime && Date.now() - new Date(condition.lastTransitionTime).getTime() < Number(process.env.COPILOT_RECENT_DEPLOYMENT_MS || 900000));

async function persistIncident(service, payload) {
  if (mongoose.connection.readyState !== 1) return null;
  return Incident.create({ service: service._id, type: 'predicted_violation', severity: payload.prediction.risk_level.toLowerCase(), failureType: payload.prediction.predicted_failure_type, probability: payload.prediction.failure_probability, risk: payload.prediction.risk_level, evidence: payload.evidence, rca: payload.rca || null, rootCause: payload.rca?.likely_cause, confidence: payload.rca?.confidence, status: payload.status, resolutionStatus: payload.resolutionStatus });
}

async function analyze(req, res, next) {
  try {
    const service = await resolveService(req.body.serviceId || req.body.serviceName || req.body.service);
    const target = { deploymentName: service.deploymentName, namespace: service.namespace };
    const [deployment, telemetry, events] = await Promise.all([k8s.getDeploymentStatus(target), collectServiceTelemetry(service), k8s.getEvents(target)]);
    const primaryPod = deployment.pods.find((pod) => pod.containers?.length) || deployment.pods[0];
    if (!primaryPod) return res.status(503).json({ status: 'TELEMETRY_UNAVAILABLE', code: 'PODS_UNAVAILABLE', message: 'No workload pod is available for required log and restart-count collection.' });
    let logs;
    try { logs = primaryPod ? (await k8s.getPodLogs({ namespace: service.namespace, podName: primaryPod.name })).logs : null; } catch (error) { return res.status(503).json({ status: 'TELEMETRY_UNAVAILABLE', code: 'LOGS_UNAVAILABLE', message: 'Required Kubernetes pod logs could not be collected; analysis was not performed.' }); }
    const extracted = extractFeatures({ telemetry, deployment, pods: deployment.pods, logs, events, recentDeployment: recentDeployment(deployment) });
    if (!extracted.available) return res.status(503).json({ status: 'TELEMETRY_UNAVAILABLE', ...extracted });
    let prediction;
    try { prediction = await aiClient.predict(extracted.features); } catch (error) {
      if (error.code === 'AI_SERVICE_UNAVAILABLE') return res.status(503).json({ status: 'AI_UNAVAILABLE', code: error.code, message: 'Canonical ML prediction service is unavailable; recovery was not considered.' });
      throw error;
    }
    const evidence = { telemetry, deployment, pods: deployment.pods, events, logErrorCount: extracted.features.log_error_count };
    if (!prediction.is_failure_predicted) {
      const incident = await persistIncident(service, { prediction, evidence, status: 'resolved', resolutionStatus: 'NO_FAILURE_PREDICTED' });
      return res.json({ status: 'NO_FAILURE_PREDICTED', service: { id: service._id, name: service.name, deploymentName: service.deploymentName, namespace: service.namespace }, features: extracted, prediction, evidence, incidentId: incident?._id || null });
    }
    let rca;
    try {
      rca = await aiClient.analyzeCopilotState({ serviceName: service.deploymentName, namespace: service.namespace, telemetry: extracted.features, logs, events: serializeEvents(events), recentDeploymentInfo: JSON.stringify({ generation: deployment.generation, conditions: deployment.conditions }), podState: JSON.stringify(deployment.pods.map((pod) => ({ name: pod.name, phase: pod.phase, ready: pod.ready, status: pod.status, restartCount: pod.restartCount }))) });
    } catch (error) {
      if (error.code === 'LLM_UNAVAILABLE') return res.status(503).json({ status: 'LLM_UNAVAILABLE', code: 'LLM_UNAVAILABLE', message: 'Failure was predicted, but root-cause analysis is unavailable.', prediction, evidence });
      throw error;
    }
    const decision = recovery.decide({ recommendation: rca.recommended_action, pods: deployment.pods, events, deployment });
    const baseSafety = recovery.validateSafety({ service, decision });
    let safety = mongoose.connection.readyState === 1
      ? baseSafety
      : { allowed: false, code: 'AUDIT_PERSISTENCE_UNAVAILABLE', reason: 'MongoDB audit persistence is unavailable; autonomous recovery is not permitted.' };
    let targetClaimed = false;
    if (safety.allowed) {
      targetClaimed = recovery.claimTarget(service);
      if (!targetClaimed) safety = { allowed: false, code: 'RECOVERY_ALREADY_RUNNING', reason: 'A recovery action is already running for this service target.' };
    }
    const incident = await persistIncident(service, { prediction, evidence, rca, status: safety.allowed ? 'recovering' : 'diagnosing', resolutionStatus: safety.allowed ? 'RECOVERY_PENDING' : safety.code });
    let action = null;
    if (safety.allowed) {
      try {
        action = await recovery.execute({ service, decision });
        if (incident) await Incident.findByIdAndUpdate(incident._id, { status: action.success ? 'resolved' : 'escalated', resolutionStatus: action.verificationResult });
        if (incident) await RecoveryAction.create({ incident: incident._id, service: service._id, actionType: { RESTART_POD: 'restart', SCALE_DEPLOYMENT: 'scale_up', ROLLBACK_DEPLOYMENT: 'rollback', RECREATE_RESOURCE: 'recreate' }[action.action], reason: decision.reason, confidence: rca.confidence, target: action.target, status: action.success ? 'success' : 'failed', startedAt: action.startedAt, completedAt: action.completedAt, verificationResult: action.verificationResult, error: action.error, requirementVerified: action.success });
      } finally {
        if (targetClaimed) recovery.releaseTarget(service);
      }
    }
    return res.json({ status: action?.verificationResult || (safety.allowed ? 'RECOVERY_FAILED' : 'RECOVERY_NOT_EXECUTED'), service: { id: service._id, name: service.name, deploymentName: service.deploymentName, namespace: service.namespace }, features: extracted, prediction, rca: { failure_type: rca.failure_type, likely_cause: rca.likely_cause, evidence, affected_resource: `${service.namespace}/${service.deploymentName}`, confidence: rca.confidence, recommended_action: rca.recommended_action, reasoning: rca.reason }, decision, safety, recovery: action, incidentId: incident?._id || null });
  } catch (error) { next(error); }
}

module.exports = { analyze };
