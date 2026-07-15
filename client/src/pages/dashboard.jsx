import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DocumentUploader from '../components/DocumentUploader';
import DocumentLibrary from '../components/DocumentLibrary';
import DocumentPreview from '../components/DocumentPreview';
import ChatInterface from '../components/ChatInterface';
import { useDashboardData } from '../features/documents';
import { useChatHistory } from '../features/chat';
import { BASE_URL } from '../config/api';

const endpointsChat = {
  createSession: `${BASE_URL}/chat/sessions`,
  sendMessage: (sessionId) => `${BASE_URL}/chat/sessions/${sessionId}/messages`,
  streamMessage: (sessionId) => `${BASE_URL}/chat/sessions/${sessionId}/messages/stream`,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('documents');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    documents,
    chatSessions,
    error,
    previewDocument,
    documentsLoading,
    chatLoading,
    isUploading,
    handleUpload,
    handleDelete,
    handleUpdateTags,
    handleShare,
    setPreviewDocument,
    createSession,
    deleteSession,
    editTitle,
  } = useDashboardData();

  const {
    chatSessionId,
    chatMessages,
    chatLoading: chatMsgLoading,
    streamMessage,
    setChatSessionId,
    setChatMessages,
  } = useChatHistory();

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Handle navigation
  const handleNavigate = (path) => {
    navigate(path);
  };

  // Create new chat session
  const handleCreateSession = async () => {
    try {
      console.log('Creating new chat session...');
      const res = await createSession();
      console.log('Created session:', res);
      setChatSessionId(res._id || res.id);
      setChatMessages([]);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  // Load chat history - just set session ID, the query will fetch with caching
  const handleLoadHistory = (sessionId) => {
    setChatSessionId(sessionId);
  };

  // Delete session
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Delete this chat session?')) return;
    try {
      await deleteSession(sessionId);
      if (chatSessionId === sessionId) {
        setChatSessionId(null);
        setChatMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Edit title
  const handleEditTitle = async (sessionId, oldTitle) => {
    const newTitle = window.prompt('Edit chat title:', oldTitle);
    if (!newTitle || newTitle === oldTitle) return;
    try {
      await editTitle({ sessionId, title: newTitle });
    } catch (err) {
      console.error('Failed to edit title:', err);
    }
  };

  // Handle streaming send
  const handleStreamSend = async (message) => {
    await streamMessage(message);
  };

  // Render content based on active tab
  const renderContent = () => {
    if (activeTab === 'documents') {
      return (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 w-full">
            <DocumentUploader onUpload={handleUpload} error={error} loading={isUploading} />
          </div>
          <div className="md:w-2/3 w-full">
            <DocumentLibrary
              documents={documents}
              onDelete={handleDelete}
              onPreview={setPreviewDocument}
              onUpdateTags={handleUpdateTags}
              onShare={handleShare}
            />
          </div>
        </div>
      );
    }

    if (activeTab === 'chat') {
      return (
        <div className="h-full flex flex-col">
          {!chatSessionId ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-gray-400">
              Start a new chat session to begin or select a past chat.
            </div>
          ) : (
            <ChatInterface
              onStreamSend={handleStreamSend}
              messages={chatMessages}
              loading={chatMsgLoading}
              sessionId={chatSessionId}
            />
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNavigate={handleNavigate}
        chatSessions={chatSessions}
        chatSessionId={chatSessionId}
        onLoadChatHistory={handleLoadHistory}
        onCreateChat={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onEditSessionTitle={handleEditTitle}
        onLogout={handleLogout}
        chatLoading={chatLoading}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-blue-700 dark:text-blue-400">IntelliDocs</h1>
          <div className="w-10" />
        </div>

        {renderContent()}
      </main>

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreview document={previewDocument} onClose={() => setPreviewDocument(null)} />
      )}
    </div>
  );
};

export default Dashboard;