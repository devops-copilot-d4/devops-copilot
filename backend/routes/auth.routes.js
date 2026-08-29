const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const { githubLogin, githubCallback, getMe } = require('../controllers/auth.controller');

router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);
router.get('/me', protect, getMe);

module.exports = router;

