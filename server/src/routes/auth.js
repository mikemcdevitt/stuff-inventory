const express = require('express');
const controller = require('../controllers/authController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post('/google', controller.googleLogin);
router.get('/me', requireAuth, controller.me);

module.exports = router;
