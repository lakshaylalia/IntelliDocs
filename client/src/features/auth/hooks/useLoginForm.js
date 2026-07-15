import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services/api';

export function useLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: ({ email, password }) => authApi.login(email, password),
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      setError(null);
    },
    onError: (err) => {
      setError(err.error || 'Login failed');
    },
  });

  const handleLogin = (e, onSuccess) => {
    e.preventDefault();
    setError(null);
    mutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    error,
    isLoading: mutation.isPending,
    handleLogin,
  };
}

export default useLoginForm;