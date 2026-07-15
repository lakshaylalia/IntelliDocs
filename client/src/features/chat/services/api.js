import { BASE_URL } from '../../../config/api';

const endpoints = {
  sessions: `${BASE_URL}/chat/sessions`,
  session: (id) => `${BASE_URL}/chat/sessions/${id}`,
  messages: (id) => `${BASE_URL}/chat/sessions/${id}/messages`,
  stream: (id) => `${BASE_URL}/chat/sessions/${id}/messages/stream`,
  evaluation: `${BASE_URL}/evaluation`,
  evaluationFeedback: (id) => `${BASE_URL}/evaluation/${id}/feedback`,
  ragAnalytics: `${BASE_URL}/evaluation/analytics`,
};

export const chatApi = {
  // Create new chat session
  createSession: async (token) => {
    const res = await fetch(endpoints.sessions, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Get all chat sessions
  getSessions: async (token) => {
    const res = await fetch(endpoints.sessions, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Get chat history
  getHistory: async (sessionId, token) => {
    const res = await fetch(endpoints.session(sessionId), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Send message (non-streaming)
  sendMessage: async (sessionId, message, token) => {
    const res = await fetch(endpoints.messages(sessionId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Delete chat session
  deleteSession: async (sessionId, token) => {
    const res = await fetch(endpoints.session(sessionId), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Edit session title
  editTitle: async (sessionId, title, token) => {
    const res = await fetch(endpoints.session(sessionId), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Get streaming response
  streamMessage: async (sessionId, message, token) => {
    return fetch(endpoints.stream(sessionId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
  },

  // Get RAG analytics
  getRagAnalytics: async (token) => {
    const res = await fetch(endpoints.ragAnalytics, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
};

export default chatApi;