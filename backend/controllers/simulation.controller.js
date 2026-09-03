const Service = require('../models/Service');
const SLO = require('../models/SLO');
const Incident = require('../models/Incident');
const RecoveryAction = require('../models/RecoveryAction');
const Requirement = require('../models/Requirement');
const Metric = require('../models/Metric');
const k8sService = require('../services/k8s.service');
const aiClient = require('../services/aiService.client');
const recoveryService = require('../services/recovery.service');
const { predictFailureTrend } = require('../services/prediction.service');
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

// POST /api/simulation/chaos — Full Real E2E AI-Driven Self-Healing Loop
const triggerChaosSpike = async (req, res, next) => {
  try {
    // 1. Ensure Target Service Document exists
    let service = await Service.findOne({
      $or: [
        { deploymentName: 'demo-checkout-service' },
        { name: 'demo-checkout-service' },
      ],
    });

    if (!service) {
      service = await Service.create({
        name: 'demo-checkout-service',
        repoUrl: 'https://github.com/devops-copilot-d4/devops-copilot',
        deploymentName: 'demo-checkout-service',
        namespace: 'default',
        status: 'running',
      });
    }

    // 2. Ensure Supporting Requirement, Metric & SLO exist
    let requirement = await Requirement.findOne({ service: service._id });
    if (!requirement) {
      requirement = await Requirement.create({
        text: 'Checkout API P95 latency must stay below 300ms',
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

    let slo = await SLO.findOne({ requirement: requirement._id });
    if (!slo) {
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

    // 3. Inject In-Memory Metric Spike & Kubernetes Pod Failure
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const spikePoint = {
      time: now,
      latency: 680,
      errorRate: 18.0,
      rps: 1250,
    };
    metricStream.push(spikePoint);
    if (metricStream.length > 20) metricStream.shift();

    await k8sService.injectPodFailure({
      deploymentName: service.deploymentName || 'demo-checkout-service',
      namespace: service.namespace || 'default',
    });

    emitEvent('slo:update', { sloId: slo._id, status: 'violated', value: 680 });
    emitEvent('metrics:update', { metrics: metricStream });
    emitEvent('k8s:update', await k8sService.getDeploymentStatus({ deploymentName: service.deploymentName || 'demo-checkout-service' }));

    // 4. Construct Live Failure Telemetry Payload for AI Diagnosis
    const faultTelemetry = {
      cpu_usage: 95.0,
      memory_usage: 92.0,
      restart_count: 6,
      error_rate: 18.0,
      response_time: 3.0,
      recent_deployment: 1,
      pod_status: 'CrashLoopBackOff',
      deployment_status: 'Failed',
      log_error_count: 8,
      event_count: 5,
      health_status: 'Unhealthy',
    };

    const failureLogs = `
2026-09-03T09:30:12Z [INFO] Initializing checkout service v2.1.0...
2026-09-03T09:30:14Z [ERROR] Missing DB_SECRET environment variable in configuration.
2026-09-03T09:30:15Z [FATAL] Database connection refused. Unhandled exception.
2026-09-03T09:30:15Z [FATAL] Process exiting with status code 1.
2026-09-03T09:30:16Z [K8S_EVENT] Back-off restarting failed container checkout-api in pod demo-checkout-service-7f89d-abc12
`.trim();

    // 5. Call Python FastAPI AI Service (/copilot/analyze)
    console.log('[Chaos Engine] Calling FastAPI AI Service (/copilot/analyze) for failure diagnosis...');
    const copilotResult = await aiClient.analyzeCopilotState({
      serviceName: service.deploymentName || 'demo-checkout-service',
      namespace: service.namespace || 'default',
      telemetry: faultTelemetry,
      logs: failureLogs,
      events: 'Back-off restarting failed container; Readiness probe failed',
      recentDeploymentInfo: 'deployment v1.0.0 rolled out recently with configuration changes',
    });

    console.log(`[Chaos Engine] AI Prediction: Probability: ${copilotResult.probability} (${copilotResult.risk}), Action: ${copilotResult.recommended_action}, Confidence: ${copilotResult.confidence}`);

    // 6. Create Active Incident Record
    const incident = await Incident.create({
      service: service._id,
      slo: slo._id,
      type: 'runtime_failure',
      severity: 'high',
      rootCause: copilotResult.likely_cause || 'Application configuration failure or unhandled startup crash post-deployment.',
      confidence: copilotResult.confidence || 0.91,
      rawLogsSnapshot: failureLogs,
      status: 'diagnosing',
    });

    emitEvent('incident:new', {
      incidentId: incident._id,
      rootCause: incident.rootCause,
      risk: copilotResult.risk,
      probability: copilotResult.probability,
      recommendedAction: copilotResult.recommended_action,
    });

    // 7. Dispatch Autonomous Closed-Loop Self-Healing via Recovery Service
    // Schedule short transition delay (1.5s) to illustrate real-time state awareness
    setTimeout(async () => {
      try {
        incident.status = 'recovering';
        await incident.save();

        console.log(`[Chaos Engine] Passing action '${copilotResult.recommended_action}' through Deterministic Safety Guard...`);
        const executionResult = await recoveryService.executeRecovery({
          serviceId: service._id,
          deploymentName: service.deploymentName || 'demo-checkout-service',
          namespace: service.namespace || 'default',
          actionType: copilotResult.recommended_action || 'ROLLBACK',
          rootCause: copilotResult.likely_cause,
          reason: copilotResult.reason || 'Automated self-healing triggered by AI DevOps Copilot',
          incidentId: incident._id,
          bypassCooldown: true,
        });

        console.log(`[Chaos Engine] Recovery execution completed. Result status: ${executionResult.status}`);

        if (executionResult.success) {
          // 8. Restore Metrics & Verify SLO
          const recoveryPoint = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            latency: 135,
            errorRate: 0.05,
            rps: 480,
          };
          metricStream.push(recoveryPoint);
          if (metricStream.length > 20) metricStream.shift();

          slo.status = 'met';
          slo.lastCheckedAt = new Date();
          await slo.save();

          emitEvent('slo:update', { sloId: slo._id, status: 'met', value: 135 });
        } else {
          incident.status = 'escalated';
          await incident.save();
        }

        emitEvent('metrics:update', { metrics: metricStream });
        emitEvent('k8s:update', await k8sService.getDeploymentStatus({ deploymentName: service.deploymentName || 'demo-checkout-service' }));
      } catch (recoveryErr) {
        console.error(`[Chaos Engine] Autonomous self-healing failed: ${recoveryErr.message}`);
      }
    }, 1500);

    res.json({
      message: 'Chaos anomaly injected. Real AI diagnosis and self-healing loop executing.',
      aiDiagnosis: copilotResult,
      incident,
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
