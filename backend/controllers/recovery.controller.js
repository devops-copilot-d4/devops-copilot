const RecoveryAction = require('../models/RecoveryAction');
const Incident = require('../models/Incident');
const Service = require('../models/Service');
const recoveryService = require('../services/recovery.service');

// High-impact action types that can optionally require human approval
const HIGH_IMPACT_ACTIONS = ['rollback', 'scale_down'];

/**
 * Trigger an autonomous or user-initiated self-healing recovery action.
 * Evaluates safety constraints, executes K8s API operation, and runs verification.
 */
const createRecoveryAction = async (req, res, next) => {
  try {
    const { incidentId, serviceId, actionType, deploymentName, namespace, reason, rootCause } = req.body;

    let targetDeployment = deploymentName || 'demo-checkout-service';
    let targetNamespace = namespace || 'default';
    let targetServiceId = serviceId;

    if (incidentId) {
      const incident = await Incident.findById(incidentId).populate('service');
      if (incident && incident.service) {
        targetDeployment = incident.service.deploymentName || targetDeployment;
        targetNamespace = incident.service.namespace || targetNamespace;
        targetServiceId = incident.service._id;
      }
    }

    const result = await recoveryService.executeRecovery({
      serviceId: targetServiceId,
      deploymentName: targetDeployment,
      namespace: targetNamespace,
      actionType: actionType || 'RESTART',
      rootCause: rootCause || 'AI DevOps Copilot automated detection',
      reason: reason || 'Self-healing triggered based on failure diagnosis',
      incidentId,
    });

    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    next(err);
  }
};

// Human approves a pending recovery action
const approveRecoveryAction = async (req, res, next) => {
  try {
    const action = await RecoveryAction.findById(req.params.id).populate('service');
    if (!action) return res.status(404).json({ message: 'Recovery action not found' });

    action.approvedBy = req.user ? req.user.id : 'admin';
    action.status = 'executing';
    await action.save();

    const result = await recoveryService.executeRecovery({
      serviceId: action.service ? action.service._id : null,
      deploymentName: action.service ? action.service.deploymentName : 'demo-checkout-service',
      namespace: action.service ? action.service.namespace : 'default',
      actionType: action.actionType,
      reason: action.reason,
      incidentId: action.incident,
    });

    res.json(result);
  } catch (err) {
    next(err);
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

module.exports = {
  createRecoveryAction,
  approveRecoveryAction,
  getRecoveryActions,
};
