'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactBitsBeams from '@/components/ReactBitsBeams';
import Stepper, { Step } from '@/components/Stepper';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginOtpInput, setLoginOtpInput] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);

  const isValidEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

  const createMockOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleSendLoginOtp = () => {
    if (!isValidEmail(email)) return;
    setLoginOtp(createMockOtp());
    setLoginOtpInput('');
    setLoginOtpSent(true);
  };

  const isNextDisabled = (step: number) => {
    if (step === 1) return !isValidEmail(email) || !loginOtpSent || loginOtpInput !== loginOtp;
    if (step === 2) return password.trim().length === 0;
    return false;
  };

  const handleLogin = () => {
    if (isNextDisabled(1) || isNextDisabled(2)) return;
    router.push('/dashboard');
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

          <Stepper
            onStepChange={(step) => console.log('Login step', step)}
            onFinalStepCompleted={handleLogin}
            backButtonText="Previous"
            nextButtonText="Next"
            finalButtonText="Sign In"
            isNextDisabled={isNextDisabled}
          >
            <Step>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="president@society.com"
                  required
                  pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
                  title="Please enter a valid email address."
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setLoginOtpSent(false);
                    setLoginOtp('');
                    setLoginOtpInput('');
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
                <p className="text-xs text-gray-500">Use the email associated with your society account.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="loginOtp" className="block text-sm font-medium text-gray-700">
                  Email OTP Code
                </label>
                <div className="flex gap-3">
                  <input
                    id="loginOtp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    disabled={!loginOtpSent}
                    value={loginOtpInput}
                    onChange={(event) => setLoginOtpInput(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={handleSendLoginOtp}
                    className="whitespace-nowrap px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-orange-400 hover:text-orange-600 transition-colors"
                  >
                    Send code
                  </button>
                </div>
                {loginOtpSent ? (
                  <p className="text-xs text-gray-500">
                    Mock code sent: <span className="font-semibold text-gray-700">{loginOtp}</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Send a mock OTP to verify this email.</p>
                )}
              </div>
            </Step>

            <Step>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-500 cursor-pointer hover:text-gray-900">
                  <input type="checkbox" className="rounded bg-gray-100 border-gray-300 text-orange-600 focus:ring-orange-500" />
                  Remember me
                </label>
                <Link href="#" className="text-orange-600 hover:text-orange-500 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </Step>

            <Step>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Ready to sign in?</h3>
                <p className="text-sm text-gray-500">
                  We&apos;ll take you straight to your society dashboard after you confirm.
                </p>
                <div className="rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Signed in as:</span> {email || '—'}
                </div>
              </div>
            </Step>
          </Stepper>

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
