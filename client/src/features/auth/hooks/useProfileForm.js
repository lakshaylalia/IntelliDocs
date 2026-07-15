import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../services/api';

const getToken = () => localStorage.getItem('token');

export function useProfile() {
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch profile
  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const token = getToken();
      return authApi.getProfile(token);
    },
    staleTime: 60000,
    enabled: !!getToken(),
  });

  const profile = {
    email: profileData?.email || '',
    name: profileData?.name || '',
  };

  const setProfile = (newProfile) => {
    // This will trigger a refetch
    refetch();
  };

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (body) => {
      const token = getToken();
      return authApi.updateProfile(body, token);
    },
    onSuccess: () => {
      setSuccess('Profile updated successfully');
      setError(null);
      refetch();
    },
    onError: (err) => {
      setError(err.error || 'Failed to update profile');
    },
  });

  // Change password mutation
  const passwordMutation = useMutation({
    mutationFn: async (body) => {
      const token = getToken();
      return authApi.changePassword(body, token);
    },
    onSuccess: () => {
      setSuccess('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError(null);
    },
    onError: (err) => {
      setError(err.error || 'Failed to change password');
    },
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    await updateMutation.mutateAsync({ email: profile.email, name: profile.name });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    await passwordMutation.mutateAsync({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    });
  };

  return {
    profile,
    setProfile,
    passwords,
    setPasswords,
    error,
    success,
    isLoading,
    isSaving: updateMutation.isPending || passwordMutation.isPending,
    handleProfileUpdate,
    handlePasswordChange,
  };
}

export default useProfile;