import React, { useState, useEffect } from 'react';
import { endpoints, apiFetch, BASE_URL } from '../config/api';

const DocumentPreview = ({ document, onClose }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (document?._id) {
      fetchDocumentContent();
    }
  }, [document]);

  const fetchDocumentContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(endpoints.getDocument(document._id), {}, token);
      setContent(res.content || res.text || 'No content available');
    } catch (err) {
      setError(err.error || 'Failed to load document');
    }
    setLoading(false);
  };

  if (!document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {document.filename?.split('.').pop().toLowerCase() === 'pdf' ? '📕' :
               document.filename?.endsWith('docx') ? '📘' : '📄'}
            </span>
            <h2 className="text-xl font-semibold text-gray-800 truncate max-w-md">
              {document.filename}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading document...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchDocumentContent}
                className="text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans bg-gray-50 p-4 rounded-lg overflow-x-auto">
                {content}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;