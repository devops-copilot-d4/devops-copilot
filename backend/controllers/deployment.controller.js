const Deployment = require('../models/Deployment');
const Service = require('../models/Service');
const User = require('../models/User');
const k8sService = require('../services/k8s.service');
const { emitEvent } = require('../services/socket.service');
const { parseRepoUrl, triggerWorkflowDispatch, getLatestWorkflowRuns } = require('../services/github.service');

const workflowState = (run) => {
  if (!run || run.status !== 'completed') return { buildStatus: 'building', deployStatus: 'pending' };
  return run.conclusion === 'success'
    ? { buildStatus: 'success', deployStatus: 'pending' }
    : { buildStatus: 'failed', deployStatus: 'failed' };
};

const updateDeployment = async (deployment, state) => {
  deployment.buildStatus = state.buildStatus;
  deployment.deployStatus = state.deployStatus;
  await deployment.save();
  emitEvent('deployment:update', { deploymentId: deployment._id, ...state, deployment });
};

const pollWorkflowStatus = async (deploymentId, accessToken, owner, repo, triggeredAt) => {
  let attempts = 0;
  const interval = setInterval(async () => {
    attempts += 1;
    try {
      const runs = await getLatestWorkflowRuns(accessToken, owner, repo);
      const run = runs.find((candidate) => new Date(candidate.created_at) >= new Date(triggeredAt.getTime() - 15000));
      if (run) {
        const deployment = await Deployment.findById(deploymentId).populate('service');
        if (deployment) {
          const state = workflowState(run);
          await updateDeployment(deployment, state);
          if (run.status === 'completed') clearInterval(interval);
        }
      }
    } catch (err) {
      const deployment = await Deployment.findById(deploymentId);
      if (deployment) await updateDeployment(deployment, { buildStatus: 'failed', deployStatus: 'failed' });
      clearInterval(interval);
    }
    if (attempts >= 30) clearInterval(interval);
  }, 10000);
};

const triggerDeployment = async (req, res, next) => {
  try {
    const { serviceId, commitSha } = req.body;
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const deployment = await Deployment.create({
      service: serviceId,
      triggeredBy: req.user.id,
      commitSha: commitSha || null,
      buildStatus: 'queued',
      deployStatus: 'pending',
    });
    emitEvent('deployment:update', { deploymentId: deployment._id, buildStatus: 'queued', deployStatus: 'pending', deployment });

    const user = await User.findById(req.user.id);
    const repoInfo = parseRepoUrl(service.repoUrl);
    if (!user?.accessToken || !repoInfo) {
      await updateDeployment(deployment, { buildStatus: 'failed', deployStatus: 'failed' });
      return res.status(503).json({ message: 'GitHub workflow dispatch is not configured for this service.', code: 'WORKFLOW_UNAVAILABLE', deployment });
    }

    try {
      const triggeredAt = new Date();
      await triggerWorkflowDispatch(user.accessToken, repoInfo.owner, repoInfo.repo);
      pollWorkflowStatus(deployment._id, user.accessToken, repoInfo.owner, repoInfo.repo, triggeredAt);
      return res.status(201).json(deployment);
    } catch (err) {
      await updateDeployment(deployment, { buildStatus: 'failed', deployStatus: 'failed' });
      return res.status(502).json({ message: `GitHub workflow dispatch failed: ${err.message}`, code: 'WORKFLOW_DISPATCH_FAILED', deployment });
    }
  } catch (err) {
    next(err);
  }
};

const getDeployments = async (req, res, next) => {
  try {
    const deployments = await Deployment.find().populate('service').sort({ createdAt: -1 });
    res.json(deployments);
  } catch (err) {
    next(err);
  }
};

const getDeploymentStatus = async (req, res, next) => {
  try {
    const deployment = await Deployment.findById(req.params.id).populate('service');
    if (!deployment) return res.status(404).json({ message: 'Deployment not found' });
    const liveStatus = await k8sService.getDeploymentStatus({ deploymentName: deployment.service.deploymentName, namespace: deployment.service.namespace });
    res.json({ deployment, liveStatus });
  } catch (err) {
    next(err);
  }
};

module.exports = { triggerDeployment, getDeployments, getDeploymentStatus, workflowState };
