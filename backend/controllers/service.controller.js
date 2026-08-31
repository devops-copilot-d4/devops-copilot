const Service = require('../models/Service');

// Create a new service (this is what "Import Repository" should actually call first)
const createService = async (req, res, next) => {
  try {
    const { name, repoUrl, namespace } = req.body;

    if (!name || !repoUrl) {
      return res.status(400).json({ message: 'name and repoUrl are required' });
    }

    const service = await Service.create({
      name,
      repoUrl,
      owner: req.user.id,
      namespace: namespace || 'default',
      deploymentName: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      status: 'pending',
    });

    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
};

// List all services (so the frontend can show a dropdown instead of a raw text box)
const getServices = async (req, res, next) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    next(err);
  }
};

const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    next(err);
  }
};

module.exports = { createService, getServices, getServiceById };