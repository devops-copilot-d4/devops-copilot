const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const {
  createRequirement,
  getRequirements,
  getRequirementById,
} = require('../controllers/requirement.controller');

router.post('/', protect, createRequirement);
router.get('/', protect, getRequirements);
router.get('/:id', protect, getRequirementById);

module.exports = router;

