'use client';

/**
 * Forgot Password Request Page
 * Module: Authentication UI (apps/web/src/app/(auth)/forgot-password/page.tsx)
 *
 * Allows students and staff to initiate account recovery by entering their email address.
 * Dispatches a 6-digit OTP code and seamlessly directs them to the reset verification screen.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { SiteNavbar } from '@/components/layout/site-navbar';

/**
 * Forgot password request page component.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  /**
   * Submits email for password recovery OTP challenge.
   */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to request password reset.');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0f0d] text-stone-100 font-sans flex flex-col justify-between selection:bg-emerald-800 selection:text-white">
      {/* Unified Site Navbar */}
      <SiteNavbar hideAnnouncement={true} />

      <main className="auth-shell max-w-4xl mx-auto w-full py-8 px-4 flex flex-col justify-between">

      {/* Card */}
      <section className="auth-card max-w-md w-full mx-auto my-8 bg-white p-8 rounded-2xl shadow-xl border border-neutral-200/80">
        <div className="space-y-1 mb-6">
          <p className="text-[10px] tracking-widest font-mono font-bold text-brand-700 uppercase">
            ACCOUNT RECOVERY
          </p>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight font-display">
            Reset password.
          </h1>
          <p className="text-xs text-neutral-600">
            Enter your registered email address and we will dispatch a 6-digit recovery code.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verification Code Sent</span>
              </div>
              <p>
                If an account exists for <strong className="font-semibold">{email}</strong>, a 6-digit verification code has been dispatched.
              </p>
              <p className="text-[11px] text-emerald-700">
                The code remains valid for 10 minutes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="w-full py-3 px-4 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              Enter Verification Code <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Registered Email Address
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

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 px-4 bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {busy ? 'Sending recovery code…' : 'Send Recovery Code'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-neutral-200 text-center text-xs text-neutral-500">
          Remembered your password?{' '}
          <Link href="/sign-in" className="text-brand-700 font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </section>

      <footer className="max-w-4xl mx-auto w-full text-center text-[10px] text-neutral-400 pt-6">
        Northstar Learning Management Platform &copy; {new Date().getFullYear()}
      </footer>
    </main>
    </div>
  );
}
