const Incident = require('../models/Incident');
const Deployment = require('../models/Deployment');
const aiClient = require('../services/aiService.client');
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
    const diagnosis = await aiClient.analyzeCopilotState({
      serviceName: serviceName || 'demo-checkout-service',
      namespace: namespace || 'default',
      telemetry: telemetry || {
        cpu_usage: 45,
        memory_usage: 50,
        restart_count: 0,
        error_rate: 0,
        pod_status: 'Running',
      },
      logs: logs || '',
      events: events || '',
      recentDeploymentInfo: recentDeploymentInfo || 'v1.0.0',
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
