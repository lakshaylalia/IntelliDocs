import React, { useState, useEffect } from 'react';
import { apiFetch, endpoints, BASE_URL } from '../config/api';

const DocumentLibrary = ({ documents, onDelete, onPreview, onSearch, searchQuery, onUpdateTags, onShare }) => {
  const [docStatuses, setDocStatuses] = useState({});
  const [editingTags, setEditingTags] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [showShareModal, setShowShareModal] = useState(null);
  const [searchUsers, setSearchUsers] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [sharedWith, setSharedWith] = useState([]);
  const token = localStorage.getItem('token');
  const [localSearch, setLocalSearch] = useState(searchQuery || '');

  // Predefined categories
  const categories = [
    { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    { value: 'work', label: 'Work', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    { value: 'personal', label: 'Personal', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    { value: 'important', label: 'Important', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
    { value: 'archived', label: 'Archived', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  ];

  const getCategoryBadge = (category) => {
    const cat = categories.find(c => c.value === category) || categories[0];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${cat.color}`}>
        {cat.label}
      </span>
    );
  };

  // Handle tag edit
  const startEditTags = (doc, e) => {
    e.stopPropagation();
    setEditingTags(doc.id);
    setTagInput(doc.tags?.join(', ') || '');
  };

  const saveTags = async (docId) => {
    const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t);
    if (onUpdateTags) {
      await onUpdateTags(docId, newTags);
    }
    setEditingTags(null);
    setTagInput('');
  };

  // Sync local search with prop
  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  // Fetch users when searching
  useEffect(() => {
    if (!showShareModal) return;
    const searchUsersFn = async () => {
      try {
        const res = await fetch(`${BASE_URL}/document/users?search=${encodeURIComponent(searchUsers)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setUserResults(data.users || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    const timer = setTimeout(searchUsersFn, 300);
    return () => clearTimeout(timer);
  }, [searchUsers, showShareModal]);

  // Open share modal
  const openShareModal = (doc, e) => {
    e.stopPropagation();
    setShowShareModal(doc.id);
    setSharedWith(doc.sharedWith || []);
    setSearchUsers('');
    setUserResults([]);
  };

  // Save sharing
  const saveShare = async (docId) => {
    if (onShare) {
      await onShare(docId, sharedWith);
    }
    setShowShareModal(null);
  };

  // Add user to shared list
  const addUserToShare = (user) => {
    if (!sharedWith.find(u => u._id === user._id)) {
      setSharedWith([...sharedWith, user]);
    }
    setSearchUsers('');
    setUserResults([]);
  };

  // Remove user from shared list
  const removeUserFromShare = (userId) => {
    setSharedWith(sharedWith.filter(u => u._id !== userId));
  };

  // Get file icon based on extension
  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      pdf: '📕',
      docx: '📘',
      doc: '📘',
      txt: '📄',
      md: '📝',
      csv: '📊',
      xlsx: '📈',
      xls: '📈',
      pptx: '📊',
      ppt: '📊',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      gif: '🖼️',
      webp: '🖼️',
    };
    return icons[ext] || '📄';
  };

  // Get status badge
  const getStatusBadge = (doc) => {
    const status = docStatuses[doc.id]?.status || doc.status || 'completed';

    const badges = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', label: '⏳ Pending' },
      processing: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200', label: '⚙️ Processing...' },
      completed: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', label: '✅ Ready' },
      failed: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', label: '❌ Failed' }
    };

    const badge = badges[status] || badges.completed;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  // Poll for document status
  useEffect(() => {
    const pendingDocs = documents.filter(d => d.status === 'pending' || d.status === 'processing');
    if (pendingDocs.length === 0) return;

    const pollStatus = async () => {
      for (const doc of pendingDocs) {
        try {
          const res = await fetch(`${BASE_URL}/document/${doc.id}/status`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setDocStatuses(prev => ({ ...prev, [doc.id]: data }));
          }
        } catch (err) {
          console.error('Error fetching status:', err);
        }
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [documents]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold dark:text-white">Document Library</h2>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search documents..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onSearch) {
                onSearch(localSearch);
              }
            }}
            className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <svg
            className="absolute left-3 top-2.5 text-gray-400 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                if (onSearch) onSearch('');
              }}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
          {localSearch && <span className="ml-2">matching "{localSearch}"</span>}
        </span>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Share Document</h3>
              <button onClick={() => setShowShareModal(null)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search users */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {userResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-32 overflow-y-auto">
                  {userResults.map(user => (
                    <button
                      key={user._id}
                      onClick={() => addUserToShare(user)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="font-medium dark:text-white">{user.name || 'No name'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Shared with list */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Shared with:</p>
              {sharedWith.length === 0 ? (
                <p className="text-gray-400 text-sm">No one yet</p>
              ) : (
                <div className="space-y-1">
                  {sharedWith.map(user => (
                    <div key={user._id || user} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                      <span className="text-sm dark:text-gray-200">{user.name || user.email || user}</span>
                      <button
                        onClick={() => removeUserFromShare(user._id || user)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowShareModal(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => saveShare(showShareModal)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-4xl mb-2">📁</p>
          <p>No documents uploaded yet.</p>
          <p className="text-sm">Upload documents to start chatting with them!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left font-semibold text-gray-600 dark:text-gray-400">File</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-600 dark:text-gray-400">Category</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-600 dark:text-gray-400">Tags</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-600 dark:text-gray-400">Size</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, index) => (
                <tr
                  key={doc.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getFileIcon(doc.filename)}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-xs" title={doc.filename}>
                        {doc.filename}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getCategoryBadge(doc.category)}
                  </td>
                  <td className="py-3 px-4">
                    {editingTags === doc.id ? (
                      <div className="flex gap-1 items-center">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveTags(doc.id)}
                          placeholder="tag1, tag2"
                          className="w-24 px-2 py-1 text-xs border rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button onClick={() => saveTags(doc.id)} className="text-green-600 text-xs">Save</button>
                        <button onClick={() => setEditingTags(null)} className="text-gray-500 text-xs">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {doc.tags?.length > 0 ? (
                          doc.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded text-xs">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">No tags</span>
                        )}
                        <button
                          onClick={(e) => startEditTags(doc, e)}
                          className="text-blue-600 hover:text-blue-800 text-xs ml-1"
                          title="Edit tags"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(doc)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {doc.size} MB
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded transition-colors text-sm"
                        onClick={() => onPreview && onPreview(doc)}
                        title="Preview document"
                      >
                        View
                      </button>
                      <button
                        className="text-green-600 hover:text-green-800 hover:bg-green-50 px-3 py-1 rounded transition-colors text-sm"
                        onClick={(e) => openShareModal(doc, e)}
                        title="Share document"
                      >
                        Share
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors text-sm"
                        onClick={() => onDelete(doc.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;