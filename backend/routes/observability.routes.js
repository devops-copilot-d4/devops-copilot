const express = require('express');
const protect = require('../middleware/auth.middleware');
const controller = require('../controllers/observability.controller');

const router = express.Router();

router.get('/services/:service/telemetry', protect, controller.getTelemetry);
router.get('/services/:service/pods', protect, controller.getPods);
router.get('/services/:service/logs', protect, controller.getLogs);
router.get('/services/:service/events', protect, controller.getEvents);
router.get('/services/:service/status', protect, controller.getStatus);

module.exports = router;
