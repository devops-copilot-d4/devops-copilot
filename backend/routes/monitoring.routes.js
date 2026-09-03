const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const { getSLOStatus, refreshSLO } = require('../controllers/monitoring.controller');

router.get('/slo', protect, getSLOStatus);
router.post('/slo/:id/refresh', protect, refreshSLO);

module.exports = router;

