'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MagneticButton from '@/components/MagneticButton';
import ReactBitsBeams from '@/components/ReactBitsBeams';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0">
        <ReactBitsBeams beamNumber={6} beamHeight={12} beamWidth={2} speed={1.5} />
      </div>

      {/* Navigation / Home Link */}
      <nav className="absolute top-0 w-full z-50 p-6">
        <Link href="/" className="text-2xl font-bold tracking-tighter hover:text-purple-400 transition-colors">
          UNINEAR
        </Link>
      </nav>

      <div className="relative z-10 w-full max-w-md">
        <div className="border border-white/10 rounded-[2rem] p-8 bg-black/40 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-gray-400">Sign in to manage your society events</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="president@society.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-gray-300">
                <input type="checkbox" className="rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500/50" />
                Remember me
              </label>
              <Link href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
              <MagneticButton
                label="Sign In"
                className="w-full bg-white text-black justify-center font-semibold"
                accentClassName="from-purple-400 via-pink-400 to-blue-400"
                type="submit"
              />
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
