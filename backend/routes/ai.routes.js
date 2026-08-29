const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const { runRootCauseAnalysis, getIncidents } = require('../controllers/ai.controller');

router.post('/rca', protect, runRootCauseAnalysis);
router.get('/incidents', protect, getIncidents);

module.exports = router;

