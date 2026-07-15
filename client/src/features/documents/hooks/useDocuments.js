import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../services/api';

const getToken = () => localStorage.getItem('token');

export function useDocuments(search = '') {
  return useQuery({
    queryKey: ['documents', search],
    queryFn: async () => {
      const token = getToken();
      const res = await documentsApi.getAll(token, search);
      return res.documents || [];
    },
    staleTime: 30000, // 30 seconds
  });
}

export function useDocument(id) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const token = getToken();
      return documentsApi.get(id, token);
    },
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file) => {
      const token = getToken();
      return documentsApi.upload(file, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }) => {
      const token = getToken();
      return documentsApi.update(id, body, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const token = getToken();
      return documentsApi.delete(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useSearchUsers(search) {
  return useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const token = getToken();
      const res = await documentsApi.searchUsers(search, token);
      return res.users || [];
    },
    enabled: search.length > 0,
    staleTime: 60000,
  });
}