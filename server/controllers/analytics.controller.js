const { Document } = require('../models/document.model.js');
const { ChatSession } = require('../models/chat.model.js');

const getAnalytics = async (req, res) => {
  try {
    // Get userId as string from the authenticated user
    const userIdStr = req.user._id.toString();
    console.log('Analytics request for userId:', userIdStr);

    // Get document stats using string comparison
    const totalDocuments = await Document.countDocuments({ userId: userIdStr });
    console.log('Total documents:', totalDocuments);

    const completedDocuments = await Document.countDocuments({
      userId: userIdStr,
      status: 'completed'
    });

    const pendingDocuments = await Document.countDocuments({
      userId: userIdStr,
      status: { $in: ['pending', 'processing'] }
    });

    const failedDocuments = await Document.countDocuments({
      userId: userIdStr,
      status: 'failed'
    });

    // Get chat stats
    const totalChatSessions = await ChatSession.countDocuments({ userId: userIdStr });
    console.log('Total chat sessions:', totalChatSessions);

    // Get total messages across all sessions
    const chatSessions = await ChatSession.find({ userId: userIdStr }).select('messages');
    const totalMessages = chatSessions.reduce((acc, session) => {
      return acc + (session.messages?.length || 0);
    }, 0);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentDocuments = await Document.countDocuments({
      userId: userIdStr,
      createdAt: { $gte: sevenDaysAgo }
    });

    const recentChats = await ChatSession.countDocuments({
      userId: userIdStr,
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get documents by month for chart
    const documentsByMonth = await Document.aggregate([
      { $match: { userId: userIdStr } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    console.log('Documents by month:', documentsByMonth);

    res.json({
      documents: {
        total: totalDocuments,
        completed: completedDocuments,
        pending: pendingDocuments,
        failed: failedDocuments
      },
      chat: {
        totalSessions: totalChatSessions,
        totalMessages: totalMessages,
        recentSessions: recentChats
      },
      recentActivity: {
        documents: recentDocuments,
        chats: recentChats
      },
      documentsByMonth: documentsByMonth.map(item => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        count: item.count
      }))
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Error fetching analytics: ' + error.message });
  }
};

module.exports = {
  getAnalytics
};