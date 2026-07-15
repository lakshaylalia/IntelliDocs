import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';
import { chatApi } from '../../chat/services/api';

const getToken = () => localStorage.getItem('token');

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const token = getToken();
      return analyticsApi.getAnalytics(token);
    },
    staleTime: 60000,
  });
}

export function useRagAnalytics() {
  return useQuery({
    queryKey: ['ragAnalytics'],
    queryFn: async () => {
      const token = getToken();
      return chatApi.getRagAnalytics(token);
    },
    staleTime: 60000,
  });
}