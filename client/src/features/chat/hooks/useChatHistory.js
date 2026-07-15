import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../services/api';

const getToken = () => localStorage.getItem('token');

export function useChatHistory(initialSessionId = null) {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSessionId, setChatSessionId] = useState(initialSessionId);

  // Load chat history - this query will auto-fetch when sessionId changes
  const { isLoading } = useQuery({
    queryKey: ['chatHistory', chatSessionId],
    queryFn: async () => {
      if (!chatSessionId) return null;
      console.log('Fetching chat history for:', chatSessionId);
      const token = getToken();
      const res = await chatApi.getHistory(chatSessionId, token);
      console.log('Got chat history:', res.messages?.length, 'messages');
      setChatMessages(res.messages || []);
      return res;
    },
    enabled: !!chatSessionId,
    staleTime: 60000,
    refetchOnMount: 'always',
    onSuccess: (data) => {
      console.log('Chat history loaded:', data?.messages?.length, 'messages');
      if (data) {
        setChatMessages(data.messages || []);
      }
    },
  });

  // Stream message
  const streamMessage = useCallback(async (message) => {
    if (!chatSessionId) return;
    setError(null);

    // Add user message and placeholder
    setChatMessages(prev => [
      ...prev,
      { role: 'user', content: message },
      { role: 'assistant', content: '', sources: [] }
    ]);
    setChatLoading(true);

    try {
      const token = getToken();
      const response = await chatApi.streamMessage(chatSessionId, message, token);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const event = line.replace('event: ', '');
            const dataLine = lines.find(l => l.startsWith('data: '));
            if (dataLine) {
              const data = JSON.parse(dataLine.replace('data: ', ''));

              if (event === 'message') {
                assistantMessage += data.content;
                setChatMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    role: 'assistant',
                    content: assistantMessage
                  };
                  return newMessages;
                });
              } else if (event === 'sources') {
                sources = data.sources;
              } else if (event === 'done') {
                setChatMessages(prev => {
                  const lastIndex = prev.length - 1;
                  return prev.map((msg, idx) =>
                    idx === lastIndex && msg.role === 'assistant'
                      ? { ...msg, sources }
                      : msg
                  );
                });
              } else if (event === 'error') {
                throw new Error(data.message);
              }
            }
          }
        }
      }

      // Invalidate sessions and current chat query to refresh
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
      queryClient.invalidateQueries({ queryKey: ['chatHistory', chatSessionId] });
    } catch (err) {
      setError(err.message || 'Failed to send message');
      setChatMessages(prev => prev.slice(0, -1));
    }

    setChatLoading(false);
  }, [chatSessionId, queryClient]);

  // Clear chat
  const clearChat = useCallback(() => {
    setChatSessionId(null);
    setChatMessages([]);
  }, []);

  return {
    chatSessionId,
    chatMessages,
    chatLoading: chatLoading || isLoading,
    error,
    isLoading,
    streamMessage,
    setChatSessionId,
    setChatMessages,
    setError,
    clearChat,
  };
}

export default useChatHistory;