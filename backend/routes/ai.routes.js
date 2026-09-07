const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const {
  predictFailure,
  runCopilotDiagnosis,
  runRootCauseAnalysis,
  getIncidents,
} = require('../controllers/ai.controller');
const copilotController = require('../controllers/copilot.controller');

// Public/dashboard callable AI endpoints
router.post('/predict', predictFailure);
router.post('/copilot/diagnose', runCopilotDiagnosis);
router.post('/copilot/analyze', protect, copilotController.analyze);

// Protected routes
router.post('/rca', protect, runRootCauseAnalysis);
router.get('/incidents', protect, getIncidents);

module.exports = router;
