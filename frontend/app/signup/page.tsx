'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactBitsBeams from '@/components/ReactBitsBeams';
import Stepper, { Step } from '@/components/Stepper';
import { signup } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [society, setSociety] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBathEmail = (value: string) => /^[^@\s]+@bath\.ac\.uk$/i.test(value);
  const showEmailError = email.length > 0 && !isBathEmail(email);
  const showPasswordError = password.length > 0 && password.length < 8;

  const isNextDisabled = (step: number) => {
    if (step === 1) return name.trim().length === 0 || society.trim().length === 0;
    if (step === 2) return !isBathEmail(email);
    if (step === 3) return password.trim().length < 8;
    return false;
  };

  const handleSignup = async () => {
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);

    try {
      const { data, error: authError } = await signup(email, password, {
        metadata: { full_name: name, society },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          setError('An account with this email already exists');
        } else {
          setError(authError.message);
        }
        setIsSubmitting(false);
        return;
      }

      // Duplicate detection: Supabase returns user with empty identities
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('An account with this email already exists');
        setIsSubmitting(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
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
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Get started</h1>
            <p className="text-gray-500">Create an account for your society</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          <Stepper
            onStepChange={() => setError('')}
            onFinalStepCompleted={handleSignup}
            backButtonText="Previous"
            nextButtonText="Next"
            finalButtonText={isSubmitting ? 'Creating...' : 'Create Account'}
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
                  University Email (@bath.ac.uk)
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@bath.ac.uk"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
                {showEmailError ? (
                  <p className="text-xs text-red-600">Only @bath.ac.uk emails are allowed</p>
                ) : (
                  <p className="text-xs text-gray-500">Use your University of Bath email to verify your identity.</p>
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
                {showPasswordError ? (
                  <p className="text-xs text-red-600">Password must be at least 8 characters</p>
                ) : (
                  <p className="text-xs text-gray-500">Use at least 8 characters for a strong password.</p>
                )}
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
                </ul>
                <p className="text-sm text-gray-500">Click &quot;Create Account&quot; to finish creating your society profile.</p>
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
