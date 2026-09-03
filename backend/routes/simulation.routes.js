const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const {
  getLiveMetrics,
  getPodTelemetry,
  triggerChaosSpike,
} = require('../controllers/simulation.controller');

router.get('/metrics', protect, getLiveMetrics);
router.get('/pods', protect, getPodTelemetry);
router.post('/chaos', protect, triggerChaosSpike);

module.exports = router;
