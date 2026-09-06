const mongoose = require('mongoose');
const Service = require('../models/Service');
const k8sService = require('../services/k8s.service');
const { collectServiceTelemetry } = require('../services/prometheus.service');

const resolveService = async (identifier) => {
  const byId = mongoose.isValidObjectId(identifier) ? await Service.findById(identifier) : null;
  const service = byId || await Service.findOne({ $or: [{ deploymentName: identifier }, { name: identifier }] });
  if (!service) {
    const error = new Error('Service not found. Use a registered service ID or deployment name.');
    error.statusCode = 404;
    error.code = 'SERVICE_NOT_FOUND';
    throw error;
  }
  if (!service.deploymentName || !service.namespace) {
    const error = new Error('Service is missing Kubernetes deployment or namespace configuration.');
    error.statusCode = 422;
    error.code = 'SERVICE_OBSERVABILITY_NOT_CONFIGURED';
    throw error;
  }
  return service;
};

const sendKubernetesObservation = async (res, operation, unavailableCode) => {
  const observation = await k8sService.observe(operation, unavailableCode);
  return res.status(observation.available ? 200 : (observation.errorCode === 'KUBERNETES_RESOURCE_NOT_FOUND' ? 404 : 503)).json(observation);
};

const getPods = async (req, res, next) => {
  try {
    const service = await resolveService(req.params.service);
    return sendKubernetesObservation(res, async () => ({ namespace: service.namespace, service: service.deploymentName, pods: await k8sService.getPods({ deploymentName: service.deploymentName, namespace: service.namespace }) }));
  } catch (error) { next(error); }
};

const getStatus = async (req, res, next) => {
  try {
    const service = await resolveService(req.params.service);
    return sendKubernetesObservation(res, async () => ({ namespace: service.namespace, service: service.deploymentName, deployment: await k8sService.getDeploymentStatus({ deploymentName: service.deploymentName, namespace: service.namespace }), history: await k8sService.getDeploymentHistory({ deploymentName: service.deploymentName, namespace: service.namespace }) }));
  } catch (error) { next(error); }
};

const getEvents = async (req, res, next) => {
  try {
    const service = await resolveService(req.params.service);
    return sendKubernetesObservation(res, async () => ({ namespace: service.namespace, service: service.deploymentName, events: await k8sService.getEvents({ deploymentName: service.deploymentName, namespace: service.namespace }) }), 'EVENTS_UNAVAILABLE');
  } catch (error) { next(error); }
};

const getLogs = async (req, res, next) => {
  try {
    const service = await resolveService(req.params.service);
    const podName = req.query.pod;
    if (!podName) return res.status(400).json({ available: false, source: 'kubernetes', errorCode: 'LOGS_UNAVAILABLE', message: 'Query parameter "pod" is required.' });
    return sendKubernetesObservation(res, async () => ({ service: service.deploymentName, ...(await k8sService.getPodLogs({ namespace: service.namespace, podName, container: req.query.container })) }), 'LOGS_UNAVAILABLE');
  } catch (error) { next(error); }
};

const getTelemetry = async (req, res, next) => {
  try {
    const service = await resolveService(req.params.service);
    const telemetry = await collectServiceTelemetry(service);
    return res.status(telemetry.available ? 200 : 503).json(telemetry);
  } catch (error) { next(error); }
};

module.exports = { getPods, getStatus, getEvents, getLogs, getTelemetry, resolveService };
