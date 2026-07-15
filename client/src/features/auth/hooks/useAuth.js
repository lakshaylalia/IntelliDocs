import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';

const getToken = () => localStorage.getItem('token');

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body) => {
      const token = getToken();
      return authApi.updateProfile(body, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (body) => {
      const token = getToken();
      return authApi.changePassword(body, token);
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body) => {
      const token = getToken();
      return authApi.updatePreferences(body, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await authApi.login(email, password);
      localStorage.setItem('token', res.token);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await authApi.register(email, password);
      localStorage.setItem('token', res.token);
      return res;
    },
  });
}