const RAGEvaluation = require('../models/ragEvaluation.model.js');

// Save RAG evaluation after each chat response
const saveEvaluation = async (req, res) => {
  try {
    const { sessionId, query, response, retrievedDocs } = req.body;
    const userId = req.user._id;

    const evaluation = new RAGEvaluation({
      userId,
      sessionId,
      query,
      response,
      retrievedDocs: retrievedDocs || []
    });

    await evaluation.save();

    res.json({ success: true, id: evaluation._id });
  } catch (error) {
    console.error('Error saving evaluation:', error);
    res.status(500).json({ error: 'Error saving evaluation' });
  }
};

// Add user feedback
const addFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, comment } = req.body;

    const evaluation = await RAGEvaluation.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    evaluation.userFeedback = feedback;
    if (comment) evaluation.feedbackComment = comment;
    await evaluation.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ error: 'Error adding feedback' });
  }
};

// Get analytics for RAG evaluation
const getRAGAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total evaluations
    const total = await RAGEvaluation.countDocuments({ userId });

    // Feedback breakdown
    const feedbackStats = await RAGEvaluation.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$userFeedback',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average similarity score
    const avgSimilarity = await RAGEvaluation.aggregate([
      { $match: { userId, avgSimilarity: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$avgSimilarity' }
        }
      }
    ]);

    // Recent evaluations
    const recent = await RAGEvaluation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('query userFeedback avgSimilarity createdAt');

    // Documents by similarity distribution
    const similarityDistribution = await RAGEvaluation.aggregate([
      { $match: { userId, avgSimilarity: { $gt: 0 } } },
      {
        $bucket: {
          groupBy: '$avgSimilarity',
          boundaries: [0, 0.3, 0.5, 0.7, 0.9, 1.01],
          default: 'Other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    res.json({
      total,
      feedbackStats: feedbackStats.reduce((acc, item) => {
        if (item._id) acc[item._id] = item.count;
        return acc;
      }, {}),
      avgSimilarity: avgSimilarity[0]?.avg || 0,
      recent,
      similarityDistribution
    });
  } catch (error) {
    console.error('Error getting RAG analytics:', error);
    res.status(500).json({ error: 'Error getting analytics' });
  }
};

module.exports = {
  saveEvaluation,
  addFeedback,
  getRAGAnalytics
};