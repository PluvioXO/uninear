'use client';

import React from 'react';
import Link from 'next/link';
import MagneticButton from '@/components/MagneticButton';
import ReactBitsBeams from '@/components/ReactBitsBeams';

export default function SignupPage() {
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
            <h1 className="text-3xl font-bold mb-2">Get started</h1>
            <p className="text-gray-400">Create an account for your society</p>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Jane Doe"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="society" className="block text-sm font-medium text-gray-300">
                Society Name
              </label>
              <input
                id="society"
                type="text"
                placeholder="Tech Society"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>

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
                placeholder="Create a password"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>

            <div className="pt-2">
              <MagneticButton
                label="Create Account"
                className="w-full bg-white text-black justify-center font-semibold"
                accentClassName="from-purple-400 via-pink-400 to-blue-400"
                type="submit"
              />
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
