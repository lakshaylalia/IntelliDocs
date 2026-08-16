const { Document, DocumentChunk } = require('../models/document.model.js');
const { createDocumentChunks } = require('../config/langchain');
const { addDocumentChunks, deleteDocumentChunks } = require('../config/mongodbVectorStore');
const { addToQueue, startWorker } = require('../config/redisQueue');
const fs = require('fs').promises;
const path = require('path');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { DocxLoader } = require('@langchain/community/document_loaders/fs/docx');

// Start the Redis worker when the module loads
startWorker();

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user._id.toString();

    // Create new document with pending status
    const document = new Document({
      userId: req.user._id,
      filename: req.file.originalname,
      content: '', // Will be filled by worker
      status: 'pending',
      metadata: {
        fileType: path.extname(req.file.originalname).substring(1),
        fileSize: req.file.size.toString()
      }
    });

    await document.save();

    // Add to processing queue (async) - use relative path for server portability
    const relativePath = path.relative(process.cwd(), req.file.path);
    const queueResult = await addToQueue(
      document._id.toString(),
      relativePath,
      req.file.originalname,
      userId
    );

    res.status(201).json({
      id: document._id,
      filename: document.filename,
      status: queueResult.async ? 'pending' : 'processing',
      metadata: document.metadata,
      createdAt: document.createdAt,
      message: queueResult.async
        ? 'Document uploaded. Processing in background...'
        : 'Document uploaded and processing...'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error uploading document: ' + error.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, shared } = req.query;

    // Query: either owned by user OR shared with user
    const query = {
      $or: [
        { userId: req.user._id },
        { sharedWith: req.user._id }
      ]
    };

    if (search) {
      query.$text = { $search: search };
    }

    // Optionally filter to show only shared documents
    if (shared === 'true') {
      query.sharedWith = { $in: [req.user._id] };
    }

    const documents = await Document.find(query)
      .select('-content')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Document.countDocuments(query);

    res.json({
      documents,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
};

const getDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching document' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete document chunks from MongoDB
    await DocumentChunk.deleteMany({ documentId: document._id });

    // Delete embeddings from MongoDB Atlas Vector Search (user-isolated)
    await deleteDocumentChunks(document._id.toString(), req.user._id.toString());

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting document' });
  }
};

// Get document processing status
const getDocumentStatus = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).select('status processedAt error filename');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      id: document._id,
      filename: document.filename,
      status: document.status,
      processedAt: document.processedAt,
      error: document.error
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching document status' });
  }
};

// Update document tags and category
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags, category, sharedWith } = req.body;

    // Find document - either owned or shared with user
    let document = await Document.findOne({
      _id: id,
      $or: [
        { userId: req.user._id },
        { sharedWith: req.user._id }
      ]
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Only owner can update tags, category, and sharing
    if (document.userId.toString() === req.user._id.toString()) {
      if (tags) document.tags = tags;
      if (category) document.category = category;
      if (sharedWith) document.sharedWith = sharedWith;
    }
    await document.save();

    res.json({
      message: 'Document updated',
      document: {
        id: document._id,
        filename: document.filename,
        tags: document.tags,
        category: document.category,
        sharedWith: document.sharedWith
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating document' });
  }
};

// Get list of users for sharing
const getUsers = async (req, res) => {
  try {
    const { User } = require('../models/user.model.js');
    const { search } = req.query;

    let query = { _id: { $ne: req.user._id } }; // Exclude current user
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('name email').limit(10);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
};


module.exports = {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  getDocumentStatus,
  updateDocument,
  getUsers,
};