const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const {
  createRecoveryAction,
  approveRecoveryAction,
  getRecoveryActions,
} = require('../controllers/recovery.controller');

router.post('/', protect, createRecoveryAction);
router.post('/:id/approve', protect, approveRecoveryAction);
router.get('/', protect, getRecoveryActions);

module.exports = router;

