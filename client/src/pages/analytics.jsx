import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FiArrowLeft, FiFileText, FiMessageSquare, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiThumbsUp, FiThumbsDown, FiTrendingUp } from 'react-icons/fi';
import { useAnalyticsData } from '../features/analytics';

const Analytics = () => {
  const navigate = useNavigate();
  const { analytics, ragAnalytics, isLoading, error } = useAnalyticsData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex items-center gap-2"
        >
          <FiArrowLeft /> Back to Dashboard
        </Button>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error?.error || 'Failed to load analytics'}
        </div>
      </div>
    );
  }

  const stats = analytics?.documents || {};
  const chatStats = analytics?.chat || {};
  const recentActivity = analytics?.recentActivity || {};

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        className="mb-4 flex items-center gap-2"
      >
        <FiArrowLeft /> Back to Dashboard
      </Button>

      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Analytics</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Documents</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.total || 0}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <FiFileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chat Sessions</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{chatStats.totalSessions || 0}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <FiMessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Messages</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{chatStats.totalMessages || 0}</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <FiClock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">
                  {recentActivity.documents + recentActivity.chats}
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                <FiAlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <FiClock className="w-4 h-4" />
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <FiXCircle className="w-4 h-4" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">New Documents</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{recentActivity.documents || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">New Chat Sessions</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">{recentActivity.chats || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents by Month */}
      {analytics?.documentsByMonth?.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Documents by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.documentsByMonth.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (item.count / (stats.total || 1)) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* RAG Evaluation Metrics */}
      {ragAnalytics && ragAnalytics.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiTrendingUp className="w-5 h-5" />
              RAG Evaluation Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{ragAnalytics.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Queries</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {ragAnalytics.feedbackStats?.helpful || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                  <FiThumbsUp className="w-4 h-4" /> Helpful
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {ragAnalytics.feedbackStats?.not_helpful || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                  <FiThumbsDown className="w-4 h-4" /> Not Helpful
                </p>
              </div>
            </div>

            {/* Average Similarity */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Average Document Relevance Score
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full"
                    style={{ width: `${(ragAnalytics.avgSimilarity * 100)}%` }}
                  ></div>
                </div>
                <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {(ragAnalytics.avgSimilarity * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;