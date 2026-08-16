// Signup.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useSignupForm } from '../features/auth';

const Signup = ({ onSignup }) => {
  const navigate = useNavigate();
  const {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    isLoading,
    handleSignup,
  } = useSignupForm();

  const onSuccess = () => {
    if (onSignup) onSignup();
    navigate('/dashboard');
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#FAF7F0] dark:bg-[#12181F] p-4 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(#D8D2C4 1px, transparent 1px), linear-gradient(90deg, #D8D2C4 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <Card className="relative w-full max-w-md rounded-none border border-[#D8D2C4] dark:border-[#2A3441] bg-[#FFFDF9] dark:bg-[#171F29] shadow-[0_1px_0_0_#D8D2C4] dark:shadow-none">
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
            Create your account
          </h2>
          <p className="text-sm text-[#3D4B5C] dark:text-[#8892A0] mt-1">
            Set up your workspace in under a minute.
          </p>
        </CardHeader>

        <form onSubmit={(e) => handleSignup(e, onSuccess)}>
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
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-[0.2em] text-[#8A8168] dark:text-[#6E7A88] uppercase mb-1.5">
                03 · Confirm password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                className="rounded-none border-0 border-b-2 border-[#D8D2C4] dark:border-[#2A3441] bg-transparent px-0 focus-visible:ring-0 focus-visible:border-[#C4842B] dark:text-[#F2EFE7] placeholder:text-[#B7B0A0] dark:placeholder:text-[#4C5866]"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
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
              {isLoading ? 'Creating account…' : 'Create account →'}
            </Button>
            <div className="text-center text-xs text-[#3D4B5C] dark:text-[#8892A0]">
              Already on IntelliDocs?{' '}
              <Link to="/login" className="text-[#C4842B] hover:underline">Sign in</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signup;