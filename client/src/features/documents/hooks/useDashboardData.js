import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../services/api';
import { chatApi } from '../../chat/services/api';

const getToken = () => localStorage.getItem('token');

export function useDashboardData() {
  const queryClient = useQueryClient();
  const [error, setError] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);

  // Documents query
  const { data: documents = [], isLoading: documentsLoading, refetch: refetchDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const token = getToken();
      const res = await documentsApi.getAll(token);
      return res.documents || [];
    },
    staleTime: 30000,
  });

  // Chat sessions query
  const { data: chatSessions = [], isLoading: chatLoading } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: async () => {
      const token = getToken();
      const res = await chatApi.getSessions(token);
      return res.sessions || [];
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files) => {
      const token = getToken();
      for (const file of files) {
        await documentsApi.upload(file, token);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err) => {
      setError(err.error || 'Upload failed');
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = getToken();
      return documentsApi.delete(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err) => {
      setError(err.error || 'Delete failed');
    },
  });

  // Update document (tags) mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }) => {
      const token = getToken();
      return documentsApi.update(id, body, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err) => {
      setError(err.error || 'Update failed');
    },
  });

  // Share document mutation
  const shareMutation = useMutation({
    mutationFn: async ({ id, sharedWith }) => {
      const token = getToken();
      return documentsApi.update(id, { sharedWith }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err) => {
      setError(err.error || 'Share failed');
    },
  });

  // Chat mutations
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const token = getToken();
      return chatApi.createSession(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId) => {
      const token = getToken();
      return chatApi.deleteSession(sessionId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });

  const editTitleMutation = useMutation({
    mutationFn: async ({ sessionId, title }) => {
      const token = getToken();
      return chatApi.editTitle(sessionId, title, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });

  // Handlers
  const handleUpload = useCallback(async (files) => {
    setError(null);
    await uploadMutation.mutateAsync(files);
  }, [uploadMutation]);

  const handleDelete = useCallback(async (id) => {
    setError(null);
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const handleUpdateTags = useCallback(async (docId, tags) => {
    setError(null);
    await updateMutation.mutateAsync({ id: docId, tags });
  }, [updateMutation]);

  const handleShare = useCallback(async (docId, sharedWith) => {
    setError(null);
    const userIds = sharedWith.map(u => u._id || u);
    await shareMutation.mutateAsync({ id: docId, sharedWith: userIds });
  }, [shareMutation]);

  return {
    // Data
    documents,
    chatSessions,
    error,
    previewDocument,

    // Loading states
    documentsLoading,
    chatLoading,
    isUploading: uploadMutation.isPending,

    // Handlers
    handleUpload,
    handleDelete,
    handleUpdateTags,
    handleShare,
    setPreviewDocument,

    // Chat mutations
    createSession: createSessionMutation.mutateAsync,
    deleteSession: deleteSessionMutation.mutateAsync,
    editTitle: editTitleMutation.mutateAsync,

    // Refetch
    refetchDocuments,
  };
}

export default useDashboardData;