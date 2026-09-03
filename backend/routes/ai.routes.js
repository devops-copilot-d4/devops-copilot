const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const {
  predictFailure,
  runCopilotDiagnosis,
  runRootCauseAnalysis,
  getIncidents,
} = require('../controllers/ai.controller');

// Public/dashboard callable AI endpoints
router.post('/predict', predictFailure);
router.post('/copilot/diagnose', runCopilotDiagnosis);

// Protected routes
router.post('/rca', protect, runRootCauseAnalysis);
router.get('/incidents', protect, getIncidents);

module.exports = router;
