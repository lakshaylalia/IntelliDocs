const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller.js');
const { upload, handleUploadError } = require('../middlewares/upload.middleware.js');
const { auth} = require('../middlewares/auth.middleware.js');

router.post('/upload',
    auth,
    upload.single('file'),
    handleUploadError,
    documentController.uploadDocument
  );
router.get('/', auth, documentController.getDocuments);
router.get('/users', auth, documentController.getUsers);
// Important: specific routes before parameterized routes
router.get('/:id/status', auth, documentController.getDocumentStatus);
router.get('/:id', auth, documentController.getDocument);
router.put('/:id', auth, documentController.updateDocument);
router.delete('/:id', auth, documentController.deleteDocument);

module.exports = router;