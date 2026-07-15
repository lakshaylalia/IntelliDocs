import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../services/api';

const getToken = () => localStorage.getItem('token');

export function useChatSessions() {
  return useQuery({
    queryKey: ['chatSessions'],
    queryFn: async () => {
      const token = getToken();
      const res = await chatApi.getSessions(token);
      return res.sessions || [];
    },
    staleTime: 10000,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = getToken();
      return chatApi.createSession(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId) => {
      const token = getToken();
      return chatApi.deleteSession(sessionId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });
}

export function useEditSessionTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, title }) => {
      const token = getToken();
      return chatApi.editTitle(sessionId, title, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
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