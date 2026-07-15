const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth.middleware.js');
const analyticsController = require('../controllers/analytics.controller.js');

router.get('/', auth, analyticsController.getAnalytics);

module.exports = router;