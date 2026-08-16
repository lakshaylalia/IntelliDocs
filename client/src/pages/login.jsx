// Login.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
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
    <div className="relative flex items-center justify-center min-h-screen bg-[#FAF7F0] dark:bg-[#12181F] p-4 overflow-hidden">
      {/* faint grid, not a gradient blob */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(#D8D2C4 1px, transparent 1px), linear-gradient(90deg, #D8D2C4 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <Card className="relative w-full max-w-md rounded-none border border-[#D8D2C4] dark:border-[#2A3441] bg-[#FFFDF9] dark:bg-[#171F29] shadow-[0_1px_0_0_#D8D2C4] dark:shadow-none">
        {/* registration marks — the signature element */}
        <span className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-[#C4842B]" />
        <span className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 border-[#C4842B]" />
        <span className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 border-[#C4842B]" />
        <span className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-[#C4842B]" />

        <CardHeader className="pt-10 pb-2 px-8">
          <div className="flex items-center gap-2 mb-8">
            <span className="inline-block w-2 h-2 bg-[#C4842B]" />
            <span className="font-mono text-xs tracking-[0.25em] text-[#3D4B5C] dark:text-[#9AA7B5] uppercase">
              IntelliDocs
            </span>
          </div>
          <h2 className="font-serif text-[28px] leading-tight text-[#1B2430] dark:text-[#F2EFE7]">
            Welcome back
          </h2>
          <p className="text-sm text-[#3D4B5C] dark:text-[#8892A0] mt-1">
            Sign in to pick up where you left off.
          </p>
        </CardHeader>

        <form onSubmit={(e) => handleLogin(e, onSuccess)}>
          <CardContent className="px-8 pt-6 space-y-6">
            <div>
              <label className="block font-mono text-[10px] tracking-[0.2em] text-[#8A8168] dark:text-[#6E7A88] uppercase mb-1.5">
                01 · Email
              </label>
              <Input
                type="email"
                placeholder="you@company.com"
                className="rounded-none border-0 border-b-2 border-[#D8D2C4] dark:border-[#2A3441] bg-transparent px-0 focus-visible:ring-0 focus-visible:border-[#C4842B] dark:text-[#F2EFE7] placeholder:text-[#B7B0A0] dark:placeholder:text-[#4C5866]"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-[0.2em] text-[#8A8168] dark:text-[#6E7A88] uppercase mb-1.5">
                02 · Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                className="rounded-none border-0 border-b-2 border-[#D8D2C4] dark:border-[#2A3441] bg-transparent px-0 focus-visible:ring-0 focus-visible:border-[#C4842B] dark:text-[#F2EFE7] placeholder:text-[#B7B0A0] dark:placeholder:text-[#4C5866]"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded-none accent-[#C4842B]"
                />
                <span className="text-xs text-[#3D4B5C] dark:text-[#8892A0]">Remember me</span>
              </label>
              <a href="/forgot-password" className="text-xs text-[#C4842B] hover:underline">
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="text-[#B4432E] text-sm border-l-2 border-[#B4432E] pl-3">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 px-8 pb-10 pt-6">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-none bg-[#1B2430] hover:bg-[#0F151D] dark:bg-[#C4842B] dark:hover:bg-[#AD7325] text-[#FAF7F0] dark:text-[#12181F] font-medium tracking-wide"
            >
              {isLoading ? 'Signing in…' : 'Sign in →'}
            </Button>
            <div className="text-center text-xs text-[#3D4B5C] dark:text-[#8892A0]">
              New to IntelliDocs?{' '}
              <Link to="/signup" className="text-[#C4842B] hover:underline">Create an account</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;