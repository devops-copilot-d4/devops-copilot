const Incident = require('../models/Incident');
const Deployment = require('../models/Deployment');
const aiClient = require('../services/aiService.client');
const k8sService = require('../services/k8s.service');
const { analyzeRootCause } = require('../services/llm.service');
const { emitEvent } = require('../services/socket.service');

// 1. Numerical ML Failure Prediction
const predictFailure = async (req, res, next) => {
  try {
    const telemetry = req.body;
    const result = await aiClient.predict(telemetry);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// 2. Hybrid AI DevOps Copilot Diagnosis (ML + Structured LLM RCA)
const runCopilotDiagnosis = async (req, res, next) => {
  try {
    const { serviceName, namespace, telemetry, logs, events, recentDeploymentInfo } = req.body;

    let targetTelemetry = telemetry;
    let targetLogs = logs || '';
    let targetEvents = events || '';

    // If telemetry is not explicitly provided, derive from live Kubernetes cluster status
    if (!targetTelemetry) {
      const k8sStatus = await k8sService.getDeploymentStatus({
        deploymentName: serviceName || 'demo-checkout-service',
        namespace: namespace || 'default',
      });
      const pods = k8sStatus.pods || [];
      const hasFailedPod = pods.some((p) => p.status === 'CrashLoopBackOff' || p.status === 'Error');
      const maxRestarts = Math.max(0, ...pods.map((p) => p.restarts || 0));

      targetTelemetry = {
        cpu_usage: hasFailedPod ? 95 : 24,
        memory_usage: hasFailedPod ? 92 : 35,
        restart_count: maxRestarts > 0 ? maxRestarts : (hasFailedPod ? 6 : 0),
        error_rate: hasFailedPod ? 18.0 : 0.05,
        response_time: hasFailedPod ? 3.0 : 0.14,
        recent_deployment: 1,
        pod_status: hasFailedPod ? 'CrashLoopBackOff' : 'Running',
        deployment_status: hasFailedPod ? 'Failed' : 'Healthy',
        log_error_count: hasFailedPod ? 8 : 0,
        event_count: hasFailedPod ? 5 : 0,
        health_status: hasFailedPod ? 'Unhealthy' : 'Healthy',
      };

      if (hasFailedPod && !targetLogs) {
        targetLogs = 'FATAL: Unhandled exception in server.js on startup. Connection refused to port 5000';
      }
      if (hasFailedPod && !targetEvents) {
        targetEvents = 'Back-off restarting failed container; pod failed readiness probe; container restarted repeatedly';
      }
    }

    const diagnosis = await aiClient.analyzeCopilotState({
      serviceName: serviceName || 'demo-checkout-service',
      namespace: namespace || 'default',
      telemetry: targetTelemetry,
      logs: targetLogs,
      events: targetEvents,
      recentDeploymentInfo: recentDeploymentInfo || 'deployment v1.0.0',
    });

    res.json(diagnosis);
  } catch (err) {
    next(err);
  }
};

// 3. Log-specific Root Cause Analysis on a deployment
const runRootCauseAnalysis = async (req, res, next) => {
  try {
    const { deploymentId, events, metricsSummary } = req.body;

    const deployment = await Deployment.findById(deploymentId).populate('service');
    if (!deployment) return res.status(404).json({ message: 'Deployment not found' });

    const analysis = await analyzeRootCause({
      logs: deployment.logs || '',
      events: events || '',
      metricsSummary: metricsSummary || '',
    });

    const incident = await Incident.create({
      service: deployment.service._id,
      type: 'runtime_failure',
      rootCause: analysis.rootCause,
      confidence: analysis.confidence,
      rawLogsSnapshot: deployment.logs,
      status: 'diagnosing',
    });

    emitEvent('incident:new', { incidentId: incident._id, rootCause: analysis.rootCause });

    res.status(201).json({ incident, suggestedAction: analysis.suggestedAction });
  } catch (err) {
    next(err);
  }
};

const getIncidents = async (req, res, next) => {
  try {
    const incidents = await Incident.find().populate('service').sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  predictFailure,
  runCopilotDiagnosis,
  runRootCauseAnalysis,
  getIncidents,
};
