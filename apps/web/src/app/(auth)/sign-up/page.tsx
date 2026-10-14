'use client';

/**
 * SaaS User Registration Page
 * Module: Authentication UI (apps/web/src/app/(auth)/sign-up/page.tsx)
 *
 * Provides a clean onboarding portal with multiple entry pathways:
 * 1. Single sign-on with Google (delegated through Supabase OAuth provider).
 * 2. Traditional Email + Password registration with defensive password strength rules.
 * 3. Modern Passwordless 6-digit OTP verification registration.
 * 4. Referral code support for bonus starting coins.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, Mail, Lock, User, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';
import { SiteNavbar } from '@/components/layout/site-navbar';

type AuthMode = 'password' | 'otp';

/**
 * Sign up page component supporting Google, Password, and OTP modes.
 */
export default function SignUpPage() {
  const router = useRouter();

  // Form State
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // UI State
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /**
   * Dispatches OTP challenge to student's email.
   */
  async function requestOtpCode(event: React.FormEvent) {
    event.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setBusy(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          authType: 'otp',
          referralCode: referralCode || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Could not send verification code.');
      }

      setOtpSent(true);
      setSuccessMsg('A 6-digit verification code has been dispatched to your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send verification code.');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Finalizes registration via password or verified OTP.
   */
  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload: Record<string, unknown> = {
        email,
        name: name || undefined,
        referralCode: referralCode || undefined,
        authType: authMode,
      };

      if (authMode === 'password') {
        if (!password || password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }
        payload.password = password;
      } else {
        if (!otpCode || otpCode.trim().length !== 6) {
          throw new Error('Please enter the 6-digit verification code.');
        }
        payload.otpCode = otpCode.trim();
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Registration failed.');
      }

      // Check if profile setup is required
      if (!data.user?.isProfileComplete) {
        router.replace('/profile');
      } else {
        router.replace('/learning');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0f0d] text-stone-100 font-sans flex flex-col justify-between selection:bg-emerald-800 selection:text-white">
      {/* Unified Site Navbar */}
      <SiteNavbar hideAnnouncement={true} />

      <main className="auth-shell max-w-4xl mx-auto w-full py-8 px-4 flex flex-col justify-between">

      {/* Auth Card Container */}
      <section className="auth-card max-w-md w-full mx-auto my-8 bg-white p-8 rounded-2xl shadow-xl border border-neutral-200/80">
        <div className="space-y-1 mb-6">
          <p className="text-[10px] tracking-widest font-mono font-bold text-brand-700 uppercase">
            STUDENT ENROLLMENT
          </p>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight font-display">
            Create account.
          </h1>
          <p className="text-xs text-neutral-600">
            Join thousands of IITM BS learners mastering mathematics, programming, and data science.
          </p>
        </div>

        {/* Google OAuth Quick Button */}
        <a
          className="google-sign-in w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-neutral-300 text-neutral-800 font-medium text-xs hover:bg-neutral-50 transition-colors"
          href="/api/auth/google/start"
        >
          <svg className="w-4 h-4" aria-hidden="true" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.8 6.1-14.9Z" />
            <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z" />
            <path fill="#FBBC05" d="M12.6 27.8a12 12 0 0 1 0-7.6V15H5.8a20 20 0 0 0 0 17.9l6.8-5.1Z" />
            <path fill="#EA4335" d="M24 11.8c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.7 29.5 4 24 4A20 20 0 0 0 5.8 15l6.8 5.2c1.6-4.8 6.1-8.4 11.4-8.4Z" />
          </svg>
          Continue with Google
        </a>

        {/* Divider */}
        <div className="auth-divider my-6 text-[11px] text-neutral-400 text-center relative flex items-center justify-center">
          <span className="bg-white px-3 text-neutral-500 z-10">or sign up with email</span>
        </div>

        {/* Auth Method Tabs */}
        <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-lg mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setError('');
            }}
            className={`py-1.5 rounded-md transition-all ${
              authMode === 'password'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('otp');
              setError('');
            }}
            className={`py-1.5 rounded-md transition-all ${
              authMode === 'otp'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            OTP Code
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
            <span className="font-bold">Error:</span>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={authMode === 'otp' && !otpSent ? requestOtpCode : handleSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@study.iitm.ac.in"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                maxLength={254}
              />
            </div>
          </div>

          {authMode === 'password' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                  minLength={8}
                  maxLength={128}
                />
              </div>
            </div>
          )}

          {authMode === 'otp' && otpSent && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                6-Digit Verification Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 font-mono tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                  maxLength={6}
                />
              </div>
              <div className="mt-1 flex justify-between text-[11px]">
                <span className="text-neutral-500">Valid for 10 minutes</span>
                <button
                  type="button"
                  onClick={requestOtpCode}
                  disabled={busy}
                  className="text-brand-700 hover:underline font-semibold"
                >
                  Resend code
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Referral Code <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Sparkles className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. 7K2M9"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600 uppercase"
                maxLength={10}
              />
            </div>
            <p className="mt-1 text-[10px] text-neutral-500">
              Entering a valid referral code awards you 2,500 bonus learning coins.
            </p>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 px-4 bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm"
          >
            {busy ? (
              'Processing…'
            ) : authMode === 'otp' && !otpSent ? (
              <>
                Send Verification Code <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Complete Registration <ShieldCheck className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 pt-4 border-t border-neutral-200 text-center text-[11px] text-neutral-500">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-[10px] text-neutral-400 pt-6">
        Northstar Learning Management Platform &copy; {new Date().getFullYear()}
      </footer>
    </main>
    </div>
  );
}
