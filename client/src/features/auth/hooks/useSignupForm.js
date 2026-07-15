import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services/api';

export function useSignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: ({ email, password }) => authApi.register(email, password),
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      setError(null);
    },
    onError: (err) => {
      setError(err.error || 'Signup failed');
    },
  });

  const handleSignup = (e, onSuccess) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

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
    confirmPassword,
    setConfirmPassword,
    error,
    isLoading: mutation.isPending,
    handleSignup,
  };
}

export default useSignupForm;