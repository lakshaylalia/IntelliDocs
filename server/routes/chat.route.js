const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth.middleware.js');

const chatController = require('../controllers/chat.controller.js');


// Chat routes
router.post('/sessions', auth, chatController.createSession);
router.post('/sessions/:sessionId/messages', auth, chatController.sendMessage);
router.post('/sessions/:sessionId/messages/stream', auth, chatController.streamMessage);
router.get('/sessions', auth, chatController.getSessions);
router.get('/sessions/:sessionId', auth, chatController.getHistory);
router.delete('/sessions/:sessionId', auth, chatController.deleteSession);
router.patch('/sessions/:sessionId', auth, chatController.editSessionTitle);
module.exports = router;