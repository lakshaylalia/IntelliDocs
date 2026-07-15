const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller.js');
const { auth} = require('../middlewares/auth.middleware.js');

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/password', auth, authController.changePassword);
router.put('/preferences', auth, authController.updatePreferences);

module.exports = router;