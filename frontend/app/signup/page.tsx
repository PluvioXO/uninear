'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ReactBitsBeams from '@/components/ReactBitsBeams';
import Stepper, { Step } from '@/components/Stepper';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [society, setSociety] = useState('');
  const [email, setEmail] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [verificationOtp, setVerificationOtp] = useState('');
  const [verificationOtpInput, setVerificationOtpInput] = useState('');
  const [verificationOtpSent, setVerificationOtpSent] = useState(false);

  const isValidEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
  const isBathEmail = (value: string) => /^[^@\s]+@bath\.ac\.uk$/.test(value);
  const showVerificationError = verificationEmail.length > 0 && !isBathEmail(verificationEmail);

  const createMockOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleSendEmailOtp = () => {
    if (!isValidEmail(email)) return;
    setEmailOtp(createMockOtp());
    setEmailOtpInput('');
    setEmailOtpSent(true);
  };

  const handleSendVerificationOtp = () => {
    if (!isBathEmail(verificationEmail)) return;
    setVerificationOtp(createMockOtp());
    setVerificationOtpInput('');
    setVerificationOtpSent(true);
  };

  const isNextDisabled = (step: number) => {
    if (step === 1) return name.trim().length === 0 || society.trim().length === 0;
    if (step === 2) return !isValidEmail(email) || !emailOtpSent || emailOtpInput !== emailOtp;
    if (step === 3)
      return !isBathEmail(verificationEmail) || !verificationOtpSent || verificationOtpInput !== verificationOtp;
    if (step === 4) return password.trim().length === 0;
    return false;
  };

  const handleSignup = () => {
    if (isNextDisabled(1) || isNextDisabled(2) || isNextDisabled(3)) return;
    console.log('Signup submitted', { name, society, email, verificationEmail });
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
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Get started</h1>
            <p className="text-gray-500">Create an account for your society</p>
          </div>

          <Stepper
            onStepChange={(step) => console.log('Signup step', step)}
            onFinalStepCompleted={handleSignup}
            backButtonText="Previous"
            nextButtonText="Next"
            finalButtonText="Create Account"
            isNextDisabled={isNextDisabled}
          >
            <Step>
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="society" className="block text-sm font-medium text-gray-700">
                  Society Name
                </label>
                <input
                  id="society"
                  type="text"
                  placeholder="Tech Society"
                  value={society}
                  onChange={(event) => setSociety(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
            </Step>

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
                    setEmailOtpSent(false);
                    setEmailOtp('');
                    setEmailOtpInput('');
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="emailOtp" className="block text-sm font-medium text-gray-700">
                  Email OTP Code
                </label>
                <div className="flex gap-3">
                  <input
                    id="emailOtp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={emailOtpInput}
                    onChange={(event) => setEmailOtpInput(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    className="whitespace-nowrap px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-orange-400 hover:text-orange-600 transition-colors"
                  >
                    Send code
                  </button>
                </div>
                {emailOtpSent ? (
                  <p className="text-xs text-gray-500">
                    Mock code sent: <span className="font-semibold text-gray-700">{emailOtp}</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Send a mock OTP to verify this email.</p>
                )}
              </div>
            </Step>

            <Step>
              <div className="space-y-2">
                <label htmlFor="verificationEmail" className="block text-sm font-medium text-gray-700">
                  Verification Email (@bath.ac.uk)
                </label>
                <input
                  id="verificationEmail"
                  type="email"
                  placeholder="name@bath.ac.uk"
                  pattern="^[^@\s]+@bath\.ac\.uk$"
                  title="Please use your @bath.ac.uk email address."
                  required
                  value={verificationEmail}
                  onChange={(event) => {
                    setVerificationEmail(event.target.value);
                    setVerificationOtpSent(false);
                    setVerificationOtp('');
                    setVerificationOtpInput('');
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
                {showVerificationError ? (
                  <p className="text-xs text-red-600">Verification email must end with @bath.ac.uk.</p>
                ) : (
                  <p className="text-xs text-gray-500">We&apos;ll send a verification link to this university email.</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="verificationOtp" className="block text-sm font-medium text-gray-700">
                  Verification OTP Code
                </label>
                <div className="flex gap-3">
                  <input
                    id="verificationOtp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={verificationOtpInput}
                    onChange={(event) => setVerificationOtpInput(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleSendVerificationOtp}
                    className="whitespace-nowrap px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-orange-400 hover:text-orange-600 transition-colors"
                  >
                    Send code
                  </button>
                </div>
                {verificationOtpSent ? (
                  <p className="text-xs text-gray-500">
                    Mock code sent: <span className="font-semibold text-gray-700">{verificationOtp}</span>
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
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
                <p className="text-xs text-gray-500">Use at least 8 characters for a strong password.</p>
              </div>
            </Step>

            <Step>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Review your details</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    <span className="font-medium text-gray-700">Name:</span> {name || '—'}
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">Society:</span> {society || '—'}
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">Email:</span> {email || '—'}
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">Verification:</span> {verificationEmail || '—'}
                  </li>
                </ul>
                <p className="text-sm text-gray-500">Click “Create Account” to finish creating your society profile.</p>
              </div>
            </Step>
          </Stepper>

          <div className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-600 hover:text-orange-500 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
