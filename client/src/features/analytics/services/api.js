import { BASE_URL } from '../../../config/api';

const endpoints = {
  analytics: `${BASE_URL}/analytics`,
};

export const analyticsApi = {
  getAnalytics: async (token) => {
    const res = await fetch(endpoints.analytics, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
};

export default analyticsApi;