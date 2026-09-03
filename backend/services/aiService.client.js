const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Communicates with the Python FastAPI AI Microservice.
 * Provides fallback if Python service is offline.
 */
class AIServiceClient {
  constructor() {
    this.baseUrl = AI_SERVICE_URL;
  }

  async predict(telemetry) {
    try {
      const response = await axios.post(`${this.baseUrl}/predict`, telemetry, { timeout: 4000 });
      return response.data;
    } catch (err) {
      console.warn(`[AIServiceClient] FastAPI /predict unavailable (${err.message}). Using local heuristic.`);
      return this.localPredictFallback(telemetry);
    }
  }

  async analyzeCopilotState({ serviceName, namespace = 'default', telemetry, logs = '', events = '', recentDeploymentInfo = 'v1.0' }) {
    try {
      const response = await axios.post(`${this.baseUrl}/copilot/analyze`, {
        service_name: serviceName,
        namespace,
        telemetry,
        logs,
        events,
        recent_deployment_info: recentDeploymentInfo,
      }, { timeout: 6000 });
      return response.data;
    } catch (err) {
      console.warn(`[AIServiceClient] FastAPI /copilot/analyze unavailable (${err.message}). Using built-in policy fallback.`);
      return this.localCopilotFallback({ telemetry, logs, events, recentDeploymentInfo });
    }
  }

  localPredictFallback(telemetry) {
    const { cpu_usage = 20, memory_usage = 30, restart_count = 0, error_rate = 0, pod_status = 'Running' } = telemetry;
    let prob = 0.05;
    let failureType = 'Normal';

    const status = pod_status.toLowerCase();
    if (status.includes('crashloop') || restart_count >= 3) {
      prob = Math.min(0.96, 0.70 + restart_count * 0.05);
      failureType = 'CrashLoopBackOff';
    } else if (status.includes('oom') || memory_usage >= 90) {
      prob = Math.min(0.94, 0.65 + (memory_usage - 80) * 0.02);
      failureType = 'OOMKilled';
    } else if (cpu_usage >= 85) {
      prob = Math.min(0.91, 0.60 + (cpu_usage - 80) * 0.02);
      failureType = 'High CPU';
    } else if (status.includes('image') || status.includes('config')) {
      prob = 0.89;
      failureType = status.includes('image') ? 'Failed deployment' : 'Configuration error';
    } else if (error_rate > 20) {
      prob = Math.min(0.88, 0.40 + error_rate * 0.015);
      failureType = 'Application health failure';
    }

    const risk = prob >= 0.70 ? 'HIGH' : (prob >= 0.40 ? 'MEDIUM' : 'LOW');
    return {
      failure_probability: parseFloat(prob.toFixed(4)),
      risk_level: risk,
      predicted_failure_type: failureType,
      is_failure_predicted: prob >= 0.50,
      feature_signals: { cpu_usage, memory_usage, restart_count, error_rate, pod_status },
    };
  }

  localCopilotFallback({ telemetry, logs, recentDeploymentInfo }) {
    const prediction = this.localPredictFallback(telemetry);
    const type = prediction.predicted_failure_type;

    const policies = {
      'CrashLoopBackOff': {
        action: 'ROLLBACK',
        cause: 'Application crashed during initialization following deployment rollout',
        reason: 'Repeated container crashes detected immediately following deployment; rolling back restores last stable state.',
      },
      'OOMKilled': {
        action: 'SCALE',
        cause: 'Container memory limit exceeded under runtime load',
        reason: 'Memory usage saturated cgroup threshold; horizontal scaling distributes workload and mitigates OOM.',
      },
      'High CPU': {
        action: 'SCALE',
        cause: 'CPU threshold saturation causing degraded response latency',
        reason: 'Sustained high CPU requires scaling deployment replicas to maintain SLO.',
      },
      'Failed deployment': {
        action: 'ROLLBACK',
        cause: 'Image pull failure or malformed rollout descriptor',
        reason: 'New deployment failed to stabilize; roll back to previous healthy revision.',
      },
      'Application health failure': {
        action: 'RESTART',
        cause: 'Liveness / readiness probe failure or deadlock',
        reason: 'Container health probes failing while host resources are nominal; rolling restart clears stuck workers.',
      },
      'Configuration error': {
        action: 'ROLLBACK',
        cause: 'Missing or corrupted ConfigMap / Secret environment variable',
        reason: 'Application unable to locate required config bindings; roll back to previous functioning configuration.',
      },
      'Normal': {
        action: 'NO ACTION',
        cause: 'System operating within standard SLO boundaries',
        reason: 'All health checks and telemetry metrics are nominal.',
      },
    };

    const policy = policies[type] || policies['Normal'];
    return {
      risk: prediction.risk_level,
      failure_type: type,
      probability: prediction.failure_probability,
      likely_cause: policy.cause,
      recommended_action: policy.action,
      reason: policy.reason,
      confidence: prediction.risk_level === 'HIGH' ? 0.92 : 0.85,
    };
  }
}

module.exports = new AIServiceClient();
