const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const { createService, getServices, getServiceById } = require('../controllers/service.controller');

router.post('/', protect, createService);
router.get('/', protect, getServices);
router.get('/:id', protect, getServiceById);

module.exports = router;