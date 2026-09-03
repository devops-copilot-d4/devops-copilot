const Service = require('../models/Service');
const SLO = require('../models/SLO');
const Incident = require('../models/Incident');
const RecoveryAction = require('../models/RecoveryAction');
const Requirement = require('../models/Requirement');
const Metric = require('../models/Metric');
const k8sService = require('../services/k8s.service');
const { predictFailureTrend } = require('../services/prediction.service');
const { analyzeRootCause, explainRecoveryDecision } = require('../services/llm.service');
const { emitEvent } = require('../services/socket.service');

// Generate 15 baseline time-series points
let metricStream = Array.from({ length: 15 }, (_, i) => {
  const time = new Date(Date.now() - (15 - i) * 10000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return {
    time,
    latency: Math.floor(120 + Math.random() * 40),
    errorRate: parseFloat((0.1 + Math.random() * 0.2).toFixed(2)),
    rps: Math.floor(450 + Math.random() * 50),
  };
});

// GET /api/simulation/metrics
const getLiveMetrics = async (req, res, next) => {
  try {
    const latencies = metricStream.map((p) => p.latency);
    const prediction = predictFailureTrend({
      metricHistory: latencies,
      threshold: 300,
      comparator: '<',
    });

    res.json({
      metrics: metricStream,
      prediction,
      currentP95: latencies[latencies.length - 1],
      threshold: 300,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/simulation/pods
const getPodTelemetry = async (req, res, next) => {
  try {
    const deploymentName = req.query.deploymentName || 'demo-checkout-service';
    const namespace = req.query.namespace || 'default';
    const status = await k8sService.getDeploymentStatus({ deploymentName, namespace });
    res.json(status);
  } catch (err) {
    next(err);
  }
};

// POST /api/simulation/chaos — 1-Click Anomaly / Traffic Spike Simulation
const triggerChaosSpike = async (req, res, next) => {
  try {
    // Ensure a Service document exists (upsert)
    let service = await Service.findOne();
    if (!service) {
      service = await Service.create({
        name: 'demo-checkout-service',
        repoUrl: 'https://github.com/devops-copilot-d4/devops-copilot',
        deploymentName: 'demo-checkout-service',
        namespace: 'default',
      });
    }

    // 1. Inject traffic spike in metric stream
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const spikePoint = {
      time: now,
      latency: 680,
      errorRate: 4.8,
      rps: 1250,
    };
    metricStream.push(spikePoint);
    if (metricStream.length > 20) metricStream.shift();

    // 2. Inject pod failure in K8s state manager
    await k8sService.injectPodFailure({
      deploymentName: service.deploymentName || 'demo-checkout-service',
      namespace: service.namespace || 'default',
    });

    // 3. Mark SLO violated (upsert if needed)
    let slo = await SLO.findOne();
    if (!slo) {
      // Create supporting Requirement & Metric docs for SLO references
      let requirement = await Requirement.findOne({ service: service._id });
      if (!requirement) {
        requirement = await Requirement.create({
          text: 'Checkout API P95 latency must be below 300ms',
          service: service._id,
        });
      }
      let metric = await Metric.findOne({ service: service._id });
      if (!metric) {
        metric = await Metric.create({
          name: 'http_request_duration_seconds',
          source: 'prometheus',
          service: service._id,
          queryExpression: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
        });
      }
      slo = await SLO.create({
        requirement: requirement._id,
        metric: metric._id,
        comparator: '<',
        threshold: 300,
        unit: 'ms',
        status: 'violated',
        lastCheckedAt: new Date(),
      });
    } else {
      slo.status = 'violated';
      slo.lastCheckedAt = new Date();
      await slo.save();
    }
    emitEvent('slo:update', { sloId: slo._id, status: 'violated', value: 680 });

    // 4. Create Incident & Run AI RCA
    const rca = await analyzeRootCause({
      logs: 'ERROR: connection pool exhausted. 18 queries timed out waiting for available socket. Worker thread starvation on port 5000.',
      events: 'Warning: FailedScheduling, BackOff: Back-off restarting failed container',
      metricsSummary: 'P95 latency spiked from 145ms -> 680ms. Error rate increased to 4.8%.',
    });

    const incident = await Incident.create({
      service: service._id,
      slo: slo._id,
      type: 'active_violation',
      severity: 'high',
      rootCause: rca.rootCause,
      confidence: rca.confidence || 0.88,
      status: 'diagnosing',
    });
    emitEvent('incident:new', { incidentId: incident._id, rootCause: incident.rootCause });

    // 5. Generate AI Explainability & Self-Healing Action
    const reason = await explainRecoveryDecision({
      rootCause: rca.rootCause,
      actionType: 'restart',
      businessImpact: 'Checkout API latency exceeds 300ms SLO; cart abandonment rate spiked by 24%',
    });

    const recoveryAction = await RecoveryAction.create({
      incident: incident._id,
      service: service._id,
      actionType: 'restart',
      reason,
      requiresApproval: false,
      status: 'executing',
    });
    emitEvent('recovery:new', { actionId: recoveryAction._id, actionType: 'restart' });

    // Execute recovery after short 2s delay to show transition
    setTimeout(async () => {
      await k8sService.restartDeployment({
        deploymentName: service.deploymentName || 'demo-checkout-service',
        namespace: service.namespace || 'default',
      });

      // Restore metrics
      const recoveryPoint = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        latency: 135,
        errorRate: 0.05,
        rps: 480,
      };
      metricStream.push(recoveryPoint);
      if (metricStream.length > 20) metricStream.shift();

      if (slo) {
        slo.status = 'met';
        await slo.save();
        emitEvent('slo:update', { sloId: slo._id, status: 'met', value: 135 });
      }

      recoveryAction.status = 'success';
      recoveryAction.requirementVerified = true;
      await recoveryAction.save();

      if (incident) {
        incident.status = 'resolved';
        await incident.save();
      }
      emitEvent('recovery:update', { actionId: recoveryAction._id, status: 'success', verified: true });
      emitEvent('metrics:update', { metrics: metricStream });
      emitEvent('k8s:update', await k8sService.getDeploymentStatus({ deploymentName: service.deploymentName || 'demo-checkout-service' }));
    }, 2000);

    emitEvent('metrics:update', { metrics: metricStream });
    emitEvent('k8s:update', await k8sService.getDeploymentStatus({ deploymentName: service.deploymentName || 'demo-checkout-service' }));

    res.json({
      message: 'Chaos traffic spike initiated. Self-healing loop executing.',
      spikePoint,
      incident,
      recoveryAction,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLiveMetrics,
  getPodTelemetry,
  triggerChaosSpike,
};
