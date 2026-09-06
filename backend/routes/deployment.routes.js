const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const {
  triggerDeployment,
  deployToKubernetes,
  getDeployments,
  getDeploymentStatus,
} = require('../controllers/deployment.controller');

router.post('/trigger', protect, triggerDeployment);
router.post('/deploy', protect, deployToKubernetes);
router.get('/', protect, getDeployments);
router.get('/:id/status', protect, getDeploymentStatus);

module.exports = router;

