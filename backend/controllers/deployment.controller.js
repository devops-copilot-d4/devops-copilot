const Deployment = require('../models/Deployment');
const Service = require('../models/Service');
const k8sService = require('../services/k8s.service');
const { emitEvent } = require('../services/socket.service');

// Triggered when a user imports a repo / pushes code.
// Week 1-2: just record the deployment. Week 3-4: wire in the actual
// GitHub Actions build trigger + K8s deploy call.
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

    emitEvent('deployment:update', { deploymentId: deployment._id, status: 'queued' });

    // TODO (Week 3): actually trigger the GitHub Actions workflow here,
    // then call k8sService.deployService(...) once the image is built.

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

