import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';

const getToken = () => localStorage.getItem('token');

export function useSettings() {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState({ theme: 'system', notifications: true });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch profile - simplified
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;
      return authApi.getProfile(token);
    },
    staleTime: 60000,
    enabled: !!getToken(),
    onSuccess: (data) => {
      if (data) {
        setPreferences({
          theme: data.preferences?.theme || 'system',
          notifications: data.preferences?.notifications !== false,
        });
      }
    },
  });

  // Update theme mutation
  const themeMutation = useMutation({
    mutationFn: async (theme) => {
      const token = getToken();
      return authApi.updatePreferences({ theme }, token);
    },
    onSuccess: () => {
      if (preferences.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (preferences.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      setSuccess('Theme updated');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err) => {
      setError(err.error || 'Failed to update theme');
    },
  });

  // Update notifications mutation
  const notificationsMutation = useMutation({
    mutationFn: async (notifications) => {
      const token = getToken();
      return authApi.updatePreferences({ notifications }, token);
    },
    onSuccess: () => {
      setSuccess('Notification settings updated');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err) => {
      setError(err.error || 'Failed to update notifications');
    },
  });

  const handleThemeChange = async (theme) => {
    setPreferences({ ...preferences, theme });
    setSuccess(null);
    setError(null);
    await themeMutation.mutateAsync(theme);
  };

  const handleNotificationsChange = async () => {
    const newValue = !preferences.notifications;
    setPreferences({ ...preferences, notifications: newValue });
    setSuccess(null);
    setError(null);
    await notificationsMutation.mutateAsync(newValue);
  };

  return {
    preferences,
    loading: isLoadingProfile,
    error,
    success,
    isSaving: themeMutation.isPending || notificationsMutation.isPending,
    handleThemeChange,
    handleNotificationsChange,
  };
}

export default useSettings;