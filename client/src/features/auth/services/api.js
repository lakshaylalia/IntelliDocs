import { BASE_URL } from '../../../config/api';

const endpoints = {
  register: `${BASE_URL}/auth/register`,
  login: `${BASE_URL}/auth/login`,
  profile: `${BASE_URL}/auth/profile`,
  updateProfile: `${BASE_URL}/auth/profile`,
  changePassword: `${BASE_URL}/auth/password`,
  updatePreferences: `${BASE_URL}/auth/preferences`,
};

export const authApi = {
  // Register new user
  register: async (email, password) => {
    const res = await fetch(endpoints.register, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Login
  login: async (email, password) => {
    const res = await fetch(endpoints.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Get profile
  getProfile: async (token) => {
    const res = await fetch(endpoints.profile, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  // Update profile
  updateProfile: async (body, token) => {
    const res = await fetch(endpoints.updateProfile, {
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

  // Change password
  changePassword: async (body, token) => {
    const res = await fetch(endpoints.changePassword, {
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

  // Update preferences
  updatePreferences: async (body, token) => {
    const res = await fetch(endpoints.updatePreferences, {
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
};

export default authApi;