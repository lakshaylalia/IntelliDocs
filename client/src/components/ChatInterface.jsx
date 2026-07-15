import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiFetch, endpoints } from '../config/api';

const ChatInterface = ({ onSend, onStreamSend, messages, loading, sessionId }) => {
  const [input, setInput] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const [feedbackLoading, setFeedbackLoading] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const token = localStorage.getItem('token');

  // Give feedback on a message
  const handleFeedback = async (msgIdx, feedback) => {
    setFeedbackLoading(msgIdx);
    try {
      // Save feedback to the backend
      await apiFetch(
        endpoints.addFeedback(sessionId),
        {
          method: 'POST',
          body: JSON.stringify({ feedback })
        },
        token
      );
      setFeedbackGiven(prev => ({ ...prev, [msgIdx]: feedback }));
    } catch (err) {
      console.error('Feedback error:', err);
      // Still show feedback as given locally even if API fails
      setFeedbackGiven(prev => ({ ...prev, [msgIdx]: feedback }));
    }
    setFeedbackLoading(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter or Cmd+Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (input.trim() && !loading) {
          if (onStreamSend) {
            onStreamSend(input);
          } else if (onSend) {
            onSend(input);
          }
          setInput('');
        }
      }
      // Escape to clear input
      if (e.key === 'Escape') {
        setInput('');
        inputRef.current?.blur();
      }
      // / to focus input
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, loading, onSend, onStreamSend]);

  // Debug: log when messages change
  useEffect(() => {
    console.log('[ChatInterface] Messages updated:', messages.length, 'loading:', loading);
  }, [messages, loading]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      console.log('[ChatInterface] Submitting message, use streaming:', !!onStreamSend);
      // Use streaming by default for better real-time experience
      if (onStreamSend) {
        onStreamSend(input);
      } else if (onSend) {
        onSend(input);
      }
      setInput('');
    }
  };

  // Handle streaming progress indicator
  const isStreaming = messages.length > 0 && messages[messages.length - 1].role === 'assistant' && loading;

  // Export chat as PDF
  const exportAsPDF = () => {
    const content = messages.map(msg => {
      const role = msg.role === 'user' ? 'You' : 'AI';
      return `${role}: ${msg.content}`;
    }).join('\n\n');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Chat Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            .user { color: #2563eb; font-weight: bold; }
            .ai { color: #1f2937; }
            .message { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Chat Export</h1>
          <p>Exported on: ${new Date().toLocaleString()}</p>
          <hr/>
          ${messages.map(msg => `
            <div class="message">
              <p class="${msg.role}">${msg.role === 'user' ? 'You' : 'AI'}:</p>
              <pre style="white-space: pre-wrap;">${msg.content}</pre>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-md w-full">
      {/* Header with export button */}
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold dark:text-white">Chat</h2>
        {messages.length > 0 && (
          <button
            onClick={exportAsPDF}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Export as PDF
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mb-2 space-y-4 p-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-3 rounded-lg max-w-xl ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
            }`}>
              <div className="prose prose-sm max-w-none">
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>

              {/* Source citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <div className="text-xs font-semibold text-gray-600 mb-2">Sources:</div>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800"
                        title={`Relevance: ${(source.relevanceScore * 100).toFixed(1)}%`}
                      >
                        📄 {source.filename}
                        <span className="ml-1 text-blue-600">
                          ({(source.relevanceScore * 100).toFixed(0)}%)
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback buttons for assistant messages */}
              {msg.role === 'assistant' && (
                <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Was this helpful?</span>
                  <button
                    onClick={() => handleFeedback(idx, 'helpful')}
                    className={`p-1 rounded hover:bg-gray-200 ${feedbackGiven[idx] === 'helpful' ? 'text-green-600' : 'text-gray-400'}`}
                    title="Helpful"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => handleFeedback(idx, 'not_helpful')}
                    className={`p-1 rounded hover:bg-gray-200 ${feedbackGiven[idx] === 'not_helpful' ? 'text-red-600' : 'text-gray-400'}`}
                    title="Not helpful"
                  >
                    👎
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-lg bg-gray-100 text-gray-600">
              {isStreaming ? (
                <span className="inline-flex items-center">
                  <span className="animate-pulse mr-2">●</span>
                  Typing...
                </span>
              ) : (
                <span className="animate-pulse">Thinking...</span>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="flex gap-2 p-4 border-t dark:border-gray-700" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ask a question about your documents... (Press / to focus)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              if (input.trim() && !loading) {
                if (onStreamSend) {
                  onStreamSend(input);
                } else if (onSend) {
                  onSend(input);
                }
                setInput('');
              }
            }
          }}
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shrink-0"
          disabled={loading || !input.trim()}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;