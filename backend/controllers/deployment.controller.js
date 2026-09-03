const Deployment = require('../models/Deployment');
const Service = require('../models/Service');
const User = require('../models/User');
const k8sService = require('../services/k8s.service');
const { emitEvent } = require('../services/socket.service');
const { parseRepoUrl, triggerWorkflowDispatch, getLatestWorkflowRuns } = require('../services/github.service');

// Background polling for GitHub Actions workflow run progress
const pollWorkflowStatus = async (deploymentId, accessToken, owner, repo, triggeredAt) => {
  let attempts = 0;
  const maxAttempts = 30; // poll every 10s up to 5 mins

  const interval = setInterval(async () => {
    attempts++;
    try {
      const runs = await getLatestWorkflowRuns(accessToken, owner, repo);
      // Find the workflow run created around or after our dispatch
      const targetRun = runs.find((r) => new Date(r.created_at) >= new Date(triggeredAt.getTime() - 15000));

      if (targetRun) {
        let buildStatus = targetRun.status === 'completed'
          ? (targetRun.conclusion === 'success' ? 'success' : 'failed')
          : 'building';

        const deployment = await Deployment.findById(deploymentId).populate('service');
        if (deployment) {
          deployment.buildStatus = buildStatus;

          if (buildStatus === 'success') {
            clearInterval(interval);
            deployment.deployStatus = 'deploying';
            await deployment.save();
            emitEvent('deployment:update', {
              deploymentId: deployment._id,
              buildStatus: 'success',
              deployStatus: 'deploying',
              deployment,
            });

            // Trigger K8s deployment step (stub)
            await k8sService.deployService({
              deploymentName: deployment.service?.deploymentName,
              namespace: deployment.service?.namespace,
              imageName: deployment.service?.imageName || 'devops-copilot-backend:latest',
            });

            deployment.deployStatus = 'running';
            await deployment.save();
            emitEvent('deployment:update', {
              deploymentId: deployment._id,
              buildStatus: 'success',
              deployStatus: 'running',
              deployment,
            });
          } else if (buildStatus === 'failed') {
            clearInterval(interval);
            deployment.deployStatus = 'failed';
            await deployment.save();
            emitEvent('deployment:update', {
              deploymentId: deployment._id,
              buildStatus: 'failed',
              deployStatus: 'failed',
              deployment,
            });
          } else {
            await deployment.save();
            emitEvent('deployment:update', {
              deploymentId: deployment._id,
              buildStatus: 'building',
              deployStatus: deployment.deployStatus,
              deployment,
            });
          }
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    } catch (err) {
      console.error('Error polling workflow run:', err.message);
      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }
  }, 10000);
};

// Triggered when a user imports a repo / pushes code.
const triggerDeployment = async (req, res, next) => {
  try {
    const { serviceId, commitSha } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const deployment = await Deployment.create({
      service: serviceId,
      triggeredBy: req.user.id,
      commitSha,
      buildStatus: 'queued',
      deployStatus: 'pending',
    });

    emitEvent('deployment:update', {
      deploymentId: deployment._id,
      buildStatus: 'queued',
      deployStatus: 'pending',
      deployment,
    });

    // Fire-and-forget: Trigger GitHub Actions workflow_dispatch if configured
    const user = await User.findById(req.user.id);
    const repoInfo = parseRepoUrl(service.repoUrl);

    if (user?.accessToken && repoInfo) {
      const triggeredAt = new Date();
      triggerWorkflowDispatch(user.accessToken, repoInfo.owner, repoInfo.repo)
        .then(() => {
          pollWorkflowStatus(deployment._id, user.accessToken, repoInfo.owner, repoInfo.repo, triggeredAt);
        })
        .catch((err) => {
          console.error('[deployment.controller] workflow_dispatch trigger failed:', err.response?.data?.message || err.message);
        });
    }

    res.status(201).json(deployment);
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

    const liveStatus = await k8sService.getDeploymentStatus({
      deploymentName: deployment.service.deploymentName,
      namespace: deployment.service.namespace,
    });

    res.json({ deployment, liveStatus });
  } catch (err) {
    next(err);
  }
};

module.exports = { triggerDeployment, getDeployments, getDeploymentStatus };

