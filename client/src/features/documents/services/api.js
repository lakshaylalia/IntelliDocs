import { BASE_URL } from '../../../config/api';

const endpoints = {
  upload: `${BASE_URL}/document/upload`,
  list: `${BASE_URL}/document`,
  get: (id) => `${BASE_URL}/document/${id}`,
  update: (id) => `${BASE_URL}/document/${id}`,
  delete: (id) => `${BASE_URL}/document/${id}`,
  status: (id) => `${BASE_URL}/document/${id}/status`,
  users: `${BASE_URL}/document/users`,
};

export const documentsApi = {
  // Upload document
  upload: async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(endpoints.upload, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Get all documents
  getAll: async (token, search = '') => {
    let url = endpoints.list;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Get single document
  get: async (id, token) => {
    const res = await fetch(endpoints.get(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Update document (tags, category, sharedWith)
  update: async (id, body, token) => {
    const res = await fetch(endpoints.update(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Delete document
  delete: async (id, token) => {
    const res = await fetch(endpoints.delete(id), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Get document status
  getStatus: async (id, token) => {
    const res = await fetch(endpoints.status(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Search users for sharing
  searchUsers: async (search, token) => {
    const url = search ? `${endpoints.users}?search=${encodeURIComponent(search)}` : endpoints.users;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
};

export default documentsApi;