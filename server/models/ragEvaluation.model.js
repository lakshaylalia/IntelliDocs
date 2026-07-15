const mongoose = require('mongoose');

const ragEvaluationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true
  },
  query: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  retrievedDocs: [{
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    filename: String,
    similarity: Number,
    content: String
  }],
  avgSimilarity: {
    type: Number,
    default: 0
  },
  userFeedback: {
    type: String,
    enum: ['helpful', 'not_helpful', null],
    default: null
  },
  feedbackComment: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate average similarity before saving
ragEvaluationSchema.pre('save', function(next) {
  if (this.retrievedDocs && this.retrievedDocs.length > 0) {
    const sum = this.retrievedDocs.reduce((acc, doc) => acc + (doc.similarity || 0), 0);
    this.avgSimilarity = sum / this.retrievedDocs.length;
  }
  next();
});

// Index for analytics queries
ragEvaluationSchema.index({ userId: 1, createdAt: -1 });
ragEvaluationSchema.index({ userId: 1, userFeedback: 1 });

module.exports = mongoose.model('RAGEvaluation', ragEvaluationSchema);