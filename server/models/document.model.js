const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  position: {
    type: Number,
    required: true
  },
  // Embeddings are now stored in MongoDB Atlas Vector Search per user
});

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processedAt: {
    type: Date
  },
  error: {
    type: String
  },
  metadata: {
    type: Map,
    of: String,
    default: new Map()
  },
  tags: {
    type: [String],
    default: []
  },
  category: {
    type: String,
    enum: ['general', 'work', 'personal', 'important', 'archived'],
    default: 'general'
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

documentSchema.index({ content: 'text' });

module.exports = {
  Document: mongoose.model('Document', documentSchema),
  DocumentChunk: mongoose.model('DocumentChunk', documentChunkSchema)
};