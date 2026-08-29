const Requirement = require('../models/Requirement');
const Metric = require('../models/Metric');
const SLO = require('../models/SLO');
const { requirementToSLO } = require('../services/llm.service');

// Create a requirement, then use the LLM to draft an SLO from it automatically
const createRequirement = async (req, res, next) => {
  try {
    const { text, service } = req.body;

    const requirement = await Requirement.create({
      text,
      service,
      createdBy: req.user.id,
    });

    // Ask the LLM to convert this NL requirement into a draft measurable SLO
    let draftSlo = null;
    try {
      const sloDraft = await requirementToSLO(text);

      const metric = await Metric.create({
        name: sloDraft.metricName,
        service,
        source: 'prometheus',
      });

      draftSlo = await SLO.create({
        requirement: requirement._id,
        metric: metric._id,
        threshold: sloDraft.threshold,
        comparator: sloDraft.comparator,
        unit: sloDraft.unit,
      });
    } catch (llmErr) {
      // Don't fail the whole request if the LLM step fails - the requirement
      // is still saved; SLO can be added manually or retried later.
      console.error('LLM SLO generation failed:', llmErr.message);
    }

    res.status(201).json({ requirement, draftSlo });
  } catch (err) {
    next(err);
  }
};

const getRequirements = async (req, res, next) => {
  try {
    const requirements = await Requirement.find().populate('service');
    res.json(requirements);
  } catch (err) {
    next(err);
  }
};

const getRequirementById = async (req, res, next) => {
  try {
    const requirement = await Requirement.findById(req.params.id).populate('service');
    if (!requirement) return res.status(404).json({ message: 'Requirement not found' });
    res.json(requirement);
  } catch (err) {
    next(err);
  }
};

module.exports = { createRequirement, getRequirements, getRequirementById };

