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
  const [deleteModal, setDeleteModal] = useState({ show: false, sessionId: null, title: '' });
  const [editTitleModal, setEditTitleModal] = useState({ show: false, sessionId: null, currentTitle: '' });

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
    setDeleteModal({ show: true, sessionId, title: '' });
  };

  // Confirm delete session
  const confirmDeleteSession = async () => {
    const { sessionId } = deleteModal;
    setDeleteModal({ show: false, sessionId: null, title: '' });
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
    setEditTitleModal({ show: true, sessionId, currentTitle: oldTitle });
  };

  // Confirm edit title
  const confirmEditTitle = async () => {
    const { sessionId, currentTitle } = editTitleModal;
    const newTitle = document.getElementById('edit-title-input')?.value || currentTitle;
    setEditTitleModal({ show: false, sessionId: null, currentTitle: '' });
    if (!newTitle || newTitle === currentTitle) return;
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

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Delete Chat
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, sessionId: null, title: '' })}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSession}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Title Modal */}
      {editTitleModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-4">
              Edit Chat Title
            </h3>
            <input
              id="edit-title-input"
              type="text"
              defaultValue={editTitleModal.currentTitle}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new title"
              onKeyDown={(e) => e.key === 'Enter' && confirmEditTitle()}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditTitleModal({ show: false, sessionId: null, currentTitle: '' })}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmEditTitle}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;