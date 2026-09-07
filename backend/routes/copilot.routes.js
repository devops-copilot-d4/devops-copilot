const express = require('express');
const { analyze } = require('../controllers/copilot.controller');
const protect = require('../middleware/auth.middleware');

const router = express.Router();
router.post('/analyze', protect, analyze);
module.exports = router;
