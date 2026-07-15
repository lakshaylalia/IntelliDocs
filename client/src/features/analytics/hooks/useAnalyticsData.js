import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';
import { chatApi } from '../../chat/services/api';

const getToken = () => localStorage.getItem('token');

export function useAnalyticsData() {
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const token = getToken();
      return analyticsApi.getAnalytics(token);
    },
    staleTime: 60000,
  });

  const { data: ragData, isLoading: ragLoading, error: ragError } = useQuery({
    queryKey: ['ragAnalytics'],
    queryFn: async () => {
      const token = getToken();
      return chatApi.getRagAnalytics(token);
    },
    staleTime: 60000,
  });

  return {
    analytics,
    ragAnalytics: ragData,
    isLoading: analyticsLoading || ragLoading,
    error: analyticsError || ragError,
  };
}

export default useAnalyticsData;