const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth.middleware.js');
const evaluationController = require('../controllers/evaluation.controller.js');

router.post('/', auth, evaluationController.saveEvaluation);
router.post('/:id/feedback', auth, evaluationController.addFeedback);
router.get('/analytics', auth, evaluationController.getRAGAnalytics);

module.exports = router;