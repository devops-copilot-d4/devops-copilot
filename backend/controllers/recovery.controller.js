const RecoveryAction = require('../models/RecoveryAction');
const Incident = require('../models/Incident');
const Service = require('../models/Service');
const SLO = require('../models/SLO');
const k8sService = require('../services/k8s.service');
const { checkSLO } = require('../services/prometheus.service');
const { explainRecoveryDecision } = require('../services/llm.service');
const { emitEvent } = require('../services/socket.service');

// High-impact action types require human approval before execution
const HIGH_IMPACT_ACTIONS = ['rollback', 'scale_down'];

// Create a recovery action for an incident (does not execute it yet if it
// requires approval)
const createRecoveryAction = async (req, res, next) => {
  try {
    const { incidentId, actionType, businessImpact } = req.body;

    const incident = await Incident.findById(incidentId).populate('service');
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    const reason = await explainRecoveryDecision({
      rootCause: incident.rootCause,
      actionType,
      businessImpact: businessImpact || 'unspecified',
    });

    const requiresApproval = HIGH_IMPACT_ACTIONS.includes(actionType);

    const action = await RecoveryAction.create({
      incident: incident._id,
      service: incident.service._id,
      actionType,
      reason,
      requiresApproval,
      status: requiresApproval ? 'pending_approval' : 'executing',
    });

    emitEvent('recovery:new', { actionId: action._id, actionType, requiresApproval });

    if (!requiresApproval) {
      await executeAction(action);
    }

    res.status(201).json(action);
  } catch (err) {
    next(err);
  }
};

// Human approves a pending high-impact recovery action
const approveRecoveryAction = async (req, res, next) => {
  try {
    const action = await RecoveryAction.findById(req.params.id);
    if (!action) return res.status(404).json({ message: 'Recovery action not found' });

    action.approvedBy = req.user.id;
    action.status = 'executing';
    await action.save();

    await executeAction(action);

    res.json(action);
  } catch (err) {
    next(err);
  }
};

// Internal helper: run the K8s action, then verify against the requirement/SLO
const executeAction = async (action) => {
  const service = await Service.findById(action.service);

  const params = { deploymentName: service.deploymentName, namespace: service.namespace };

  try {
    switch (action.actionType) {
      case 'restart':
        await k8sService.restartDeployment(params);
        break;
      case 'rollback':
        await k8sService.rollbackDeployment(params);
        break;
      case 'scale_up':
        await k8sService.scaleDeployment({ ...params, replicas: 3 });
        break;
      case 'scale_down':
        await k8sService.scaleDeployment({ ...params, replicas: 1 });
        break;
      case 'alert_only':
      default:
        break; // no K8s action, just an alert
    }

    // Post-recovery verification: re-check the SLO tied to this incident's
    // service, not just pod health, per the requirement-aware design.
    const slo = await SLO.findOne({ }).populate('metric'); // TODO: scope to incident's SLO precisely
    let verified = false;
    if (slo?.metric?.queryExpression) {
      const result = await checkSLO({
        queryExpression: slo.metric.queryExpression,
        threshold: slo.threshold,
        comparator: slo.comparator,
      });
      verified = result.status === 'met';
    }

    action.status = 'success';
    action.requirementVerified = verified;
    await action.save();

    emitEvent('recovery:update', { actionId: action._id, status: 'success', verified });
  } catch (err) {
    action.status = 'failed';
    await action.save();
    emitEvent('recovery:update', { actionId: action._id, status: 'failed' });
  }
};

const getRecoveryActions = async (req, res, next) => {
  try {
    const actions = await RecoveryAction.find().populate('incident service').sort({ createdAt: -1 });
    res.json(actions);
  } catch (err) {
    next(err);
  }
};

module.exports = { createRecoveryAction, approveRecoveryAction, getRecoveryActions };

