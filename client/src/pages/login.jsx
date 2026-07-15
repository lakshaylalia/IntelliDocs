import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { FiMail, FiLock } from 'react-icons/fi';
import { useLoginForm } from '../features/auth';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    error,
    isLoading,
    handleLogin,
  } = useLoginForm();

  const onSuccess = () => {
    if (onLogin) onLogin();
    navigate('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 dark:bg-gray-800">
        <CardHeader className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-400 mb-2">Sign in to your account</h2>
        </CardHeader>
        <form onSubmit={(e) => handleLogin(e, onSuccess)}>
          <CardContent className="space-y-5">
            <div className="relative">
              <FiMail className="absolute left-3 top-3 text-gray-400" size={20} />
              <Input
                type="email"
                placeholder="Email address"
                className="pl-10"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-gray-400" size={20} />
              <Input
                type="password"
                placeholder="Password"
                className="pl-10"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
                Remember me
              </label>
            </div>
            {error && <div className="text-red-600 text-center text-sm">{error}</div>}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 mt-4">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <div className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <a href="/signup" className="text-blue-600 hover:underline">Sign Up</a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;