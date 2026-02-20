'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactBitsBeams from '@/components/ReactBitsBeams';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isBathEmail = (value: string) => /^[^@\s]+@bath\.ac\.uk$/i.test(value);
  const showEmailError = email.length > 0 && !isBathEmail(email);

  const isSubmitDisabled = !isBathEmail(email) || password.trim().length === 0 || loading;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setError('');
    setLoading(true);

    try {
      const { error: authError } = await login(email, password);

      if (authError) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20">
        <ReactBitsBeams beamNumber={6} beamHeight={12} beamWidth={2} speed={1.5} />
      </div>

      {/* Navigation / Home Link */}
      <nav className="absolute top-0 w-full z-50 p-6">
        <Link href="/" className="text-2xl font-bold tracking-tighter hover:text-orange-600 transition-colors text-orange-600">
          UNINEAR
        </Link>
      </nav>

      <div className="relative z-10 w-full max-w-md">
        <div className="border border-gray-200 rounded-[2rem] p-8 bg-white/80 backdrop-blur-xl shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Welcome back</h1>
            <p className="text-gray-500">Sign in to manage your society events</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@bath.ac.uk"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
              {showEmailError ? (
                <p className="text-xs text-red-600">Only @bath.ac.uk emails are allowed</p>
              ) : (
                <p className="text-xs text-gray-500">Use the email associated with your society account.</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full px-4 py-3 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-orange-600 hover:text-orange-500 font-medium transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
