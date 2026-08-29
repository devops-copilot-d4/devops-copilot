const SLO = require('../models/SLO');
const { checkSLO } = require('../services/prometheus.service');
const { emitEvent } = require('../services/socket.service');

// Return all SLOs with their current live status
const getSLOStatus = async (req, res, next) => {
  try {
    const slos = await SLO.find().populate('requirement').populate('metric');
    res.json(slos);
  } catch (err) {
    next(err);
  }
};

// Manually trigger a re-check of a specific SLO against Prometheus
const refreshSLO = async (req, res, next) => {
  try {
    const slo = await SLO.findById(req.params.id).populate('metric');
    if (!slo) return res.status(404).json({ message: 'SLO not found' });

    const result = await checkSLO({
      queryExpression: slo.metric.queryExpression,
      threshold: slo.threshold,
      comparator: slo.comparator,
    });

    slo.status = result.status;
    slo.lastCheckedAt = new Date();
    await slo.save();

    emitEvent('slo:update', { sloId: slo._id, status: slo.status, value: result.value });

    res.json({ slo, currentValue: result.value });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSLOStatus, refreshSLO };

