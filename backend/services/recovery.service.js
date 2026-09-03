const mongoose = require('mongoose');
const RecoveryAction = require('../models/RecoveryAction');
const Incident = require('../models/Incident');
const Service = require('../models/Service');
const k8sService = require('./k8s.service');
const { emitEvent } = require('./socket.service');

// Strict safety allow-list
const ALLOWED_ACTIONS = ['RESTART', 'SCALE', 'ROLLBACK', 'RECREATE', 'NO ACTION', 'scale_up', 'scale_down', 'restart', 'rollback'];
const ALLOWED_NAMESPACES = ['default', 'devops-copilot', 'production', 'staging'];
const COOLDOWN_PERIOD_MS = 60 * 1000; // 60 seconds cooldown between actions
const MAX_RETRIES = 2; // Prevent infinite self-healing loops

// In-memory cooldown & retry tracker: key = namespace/deploymentName
const cooldownTracker = new Map();
const retryTracker = new Map();

const normalizeActionType = (action) => {
  const upper = (action || '').toUpperCase();
  if (upper === 'RESTART') return 'restart';
  if (upper === 'ROLLBACK') return 'rollback';
  if (upper === 'SCALE' || upper === 'SCALE_UP') return 'scale_up';
  if (upper === 'SCALE_DOWN') return 'scale_down';
  if (upper === 'RECREATE') return 'recreate';
  if (['restart', 'rollback', 'scale_up', 'scale_down', 'recreate', 'alert_only'].includes(action)) return action;
  return 'restart';
};

class RecoveryService {
  /**
   * Validates if a proposed recovery action complies with safety rules.
   */
  validateSafety({ deploymentName, namespace = 'default', actionType, bypassCooldown = false }) {
    const key = `${namespace}/${deploymentName}`;
    const normalizedAction = actionType.toUpperCase();

    // 1. Allow-list check
    if (!ALLOWED_ACTIONS.includes(normalizedAction) && !ALLOWED_ACTIONS.includes(actionType)) {
      return { allowed: false, reason: `Action '${actionType}' is not in the approved safety allow-list.` };
    }

    // 2. Namespace check
    if (!ALLOWED_NAMESPACES.includes(namespace)) {
      return { allowed: false, reason: `Namespace '${namespace}' is restricted.` };
    }

    // 3. Cooldown check
    const lastExecuted = cooldownTracker.get(key);
    if (!bypassCooldown && lastExecuted && Date.now() - lastExecuted < COOLDOWN_PERIOD_MS) {
      const remainingSec = Math.ceil((COOLDOWN_PERIOD_MS - (Date.now() - lastExecuted)) / 1000);
      return { allowed: false, reason: `Safety cooldown active for ${deploymentName}. Please wait ${remainingSec}s before next recovery.` };
    }

    // 4. Retry limit check
    const attempts = retryTracker.get(key) || 0;
    if (attempts >= MAX_RETRIES) {
      return { allowed: false, reason: `Maximum autonomous retry limit (${MAX_RETRIES}) reached. Escalating to human administrator.` };
    }

    return { allowed: true };
  }

  /**
   * Executes approved recovery action via Kubernetes API, waits for stabilization,
   * and verifies whether the recovery succeeded.
   */
  async executeRecovery({
    serviceId,
    deploymentName = 'demo-checkout-service',
    namespace = 'default',
    actionType,
    rootCause = 'Operational anomaly detected',
    reason = 'Automated self-healing triggered by AI DevOps Copilot',
    incidentId = null,
    bypassCooldown = false,
  }) {
    const startTime = Date.now();
    const key = `${namespace}/${deploymentName}`;
    const normalizedAction = actionType.toUpperCase();
    const canonicalActionType = normalizeActionType(actionType);

    // Validate safety constraints
    const safety = this.validateSafety({ deploymentName, namespace, actionType, bypassCooldown });
    if (!safety.allowed && normalizedAction !== 'NO ACTION') {
      console.warn(`[Self-Healing Safety] Blocked action on ${deploymentName}: ${safety.reason}`);
      return {
        success: false,
        status: 'BLOCKED_BY_SAFETY_GUARD',
        message: safety.reason,
      };
    }

    if (normalizedAction === 'NO ACTION') {
      return { success: true, status: 'NO_ACTION_REQUIRED', message: 'System is healthy' };
    }

    // Mark cooldown & increment retry counter
    cooldownTracker.set(key, Date.now());
    retryTracker.set(key, (retryTracker.get(key) || 0) + 1);

    console.log(`[Self-Healing Controller] Executing action '${normalizedAction}' on ${deploymentName} in ${namespace}`);

    // Resolve Service Document
    let targetServiceId = serviceId;
    if (!targetServiceId && mongoose.connection.readyState === 1) {
      try {
        let svc = await Service.findOne({
          $or: [
            { deploymentName: deploymentName },
            { name: deploymentName },
          ],
        });
        if (!svc) {
          svc = await Service.create({
            name: deploymentName || 'demo-checkout-service',
            repoUrl: 'https://github.com/devops-copilot-d4/devops-copilot',
            deploymentName: deploymentName || 'demo-checkout-service',
            namespace: namespace || 'devops-copilot',
            status: 'running',
          });
        }
        targetServiceId = svc._id;
      } catch (svcErr) {
        console.warn(`[Self-Healing] Service resolution notice: ${svcErr.message}`);
      }
    }

    // Resolve Incident Document
    let targetIncidentId = incidentId;
    if (!targetIncidentId && targetServiceId && mongoose.connection.readyState === 1) {
      try {
        let inc = await Incident.findOne({
          service: targetServiceId,
          status: { $in: ['open', 'diagnosing'] },
        }).sort({ createdAt: -1 });

        if (!inc) {
          inc = await Incident.create({
            service: targetServiceId,
            type: 'runtime_failure',
            severity: 'high',
            rootCause: rootCause || 'Operational anomaly detected by AI DevOps Copilot',
            confidence: 0.91,
            status: 'diagnosing',
          });
        }
        targetIncidentId = inc._id;
      } catch (incErr) {
        console.warn(`[Self-Healing] Incident resolution notice: ${incErr.message}`);
      }
    }

    // Create DB Audit Record
    let actionRecord = null;
    if (targetServiceId && targetIncidentId && mongoose.connection.readyState === 1) {
      try {
        actionRecord = await RecoveryAction.create({
          service: targetServiceId,
          incident: targetIncidentId,
          actionType: canonicalActionType,
          reason,
          status: 'executing',
          requiresApproval: false,
        });
        emitEvent('recovery:new', { actionId: actionRecord._id, actionType: normalizedAction });
      } catch (e) {
        console.warn(`[Self-Healing] RecoveryAction creation warning: ${e.message}`);
      }
    }

    // 1. Dispatch K8s API Operation
    let k8sResult;
    try {
      switch (normalizedAction) {
        case 'RESTART':
          k8sResult = await k8sService.restartDeployment({ deploymentName, namespace });
          break;
        case 'ROLLBACK':
          k8sResult = await k8sService.rollbackDeployment({ deploymentName, namespace });
          break;
        case 'SCALE':
        case 'SCALE_UP':
          k8sResult = await k8sService.scaleDeployment({ deploymentName, namespace, replicas: 3 });
          break;
        case 'SCALE_DOWN':
          k8sResult = await k8sService.scaleDeployment({ deploymentName, namespace, replicas: 1 });
          break;
        case 'RECREATE':
          k8sResult = await k8sService.deployService({ deploymentName, namespace, imageName: 'app:stable-latest' });
          break;
        default:
          throw new Error(`Unsupported recovery action: ${actionType}`);
      }
    } catch (err) {
      console.error(`[Self-Healing Controller] K8s action failed: ${err.message}`);
      if (actionRecord) {
        actionRecord.status = 'failed';
        await actionRecord.save();
      }
      return { success: false, status: 'RECOVERY_EXECUTION_FAILED', error: err.message };
    }

    // 2. Post-Recovery Stabilization Wait (500ms simulated or live probe)
    console.log(`[Self-Healing Controller] Action dispatched. Probing cluster for post-recovery stabilization...`);
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 3. Post-Recovery Verification Phase
    const verifyStatus = await k8sService.getDeploymentStatus({ deploymentName, namespace });
    const isHealthy = verifyStatus.status === 'Healthy' && verifyStatus.availableReplicas >= 1;
    const mttrSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));

    if (isHealthy) {
      console.log(`[Self-Healing Controller] VERIFICATION SUCCESSFUL for ${deploymentName} (MTTR: ${mttrSeconds}s)`);
      // Reset retry counter on verified success
      retryTracker.set(key, 0);

      if (actionRecord) {
        actionRecord.status = 'success';
        actionRecord.requirementVerified = true;
        actionRecord.mttr = mttrSeconds;
        await actionRecord.save();
      }

      if (targetIncidentId) {
        try {
          await Incident.findByIdAndUpdate(targetIncidentId, { status: 'resolved' });
        } catch (incUpdErr) {}
      }

      emitEvent('recovery:update', {
        actionId: actionRecord ? actionRecord._id : null,
        status: 'RECOVERY_SUCCESSFUL',
        verified: true,
        mttr: mttrSeconds,
      });

      return {
        success: true,
        status: 'RECOVERY_SUCCESSFUL',
        deploymentName,
        actionTaken: normalizedAction,
        mttr: mttrSeconds,
        verification: {
          replicas: verifyStatus.replicas,
          availableReplicas: verifyStatus.availableReplicas,
          healthStatus: 'Healthy',
        },
      };
    } else {
      console.warn(`[Self-Healing Controller] VERIFICATION FAILED for ${deploymentName}`);
      if (actionRecord) {
        actionRecord.status = 'failed';
        actionRecord.requirementVerified = false;
        actionRecord.mttr = mttrSeconds;
        await actionRecord.save();
      }

      if (targetIncidentId) {
        try {
          await Incident.findByIdAndUpdate(targetIncidentId, { status: 'escalated' });
        } catch (incUpdErr) {}
      }

      emitEvent('recovery:update', {
        actionId: actionRecord ? actionRecord._id : null,
        status: 'RECOVERY_FAILED',
        verified: false,
      });

      return {
        success: false,
        status: 'RECOVERY_FAILED',
        deploymentName,
        actionTaken: normalizedAction,
        message: 'Deployment did not return to healthy status within verification window.',
      };
    }
  }
}

module.exports = new RecoveryService();
