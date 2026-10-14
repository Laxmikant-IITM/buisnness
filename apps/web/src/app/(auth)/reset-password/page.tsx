'use client';

/**
 * Password Reset Execution Page
 * Module: Authentication UI (apps/web/src/app/(auth)/reset-password/page.tsx)
 *
 * Allows students to enter the 6-digit recovery OTP along with their new password.
 * On submission, old active sessions are revoked instantaneously via tokenVersion
 * increment and a fresh authentication cookie is established.
 */

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Lock, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SiteNavbar } from '@/components/layout/site-navbar';

/**
 * Inner reset password form wrapped in Suspense for search params resolution.
 */
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [searchParams]);

  /**
   * Submits reset payload to /api/auth/reset-password.
   */
  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (code.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Password reset failed.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.replace('/learning');
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while resetting password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card max-w-md w-full mx-auto my-8 bg-white p-8 rounded-2xl shadow-xl border border-neutral-200/80">
      <div className="space-y-1 mb-6">
        <p className="text-[10px] tracking-widest font-mono font-bold text-brand-700 uppercase">
          SECURITY CREDENTIALS
        </p>
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight font-display">
          Set new password.
        </h1>
        <p className="text-xs text-neutral-600">
          Enter the 6-digit recovery code sent to your email and select a strong new password.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {success ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-2 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h2 className="font-bold text-sm text-emerald-800">Password Updated Successfully!</h2>
          <p className="text-emerald-700">
            All other active sessions have been invalidated. Redirecting to your learning workspace…
          </p>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Account Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@study.iitm.ac.in"
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              6-Digit Recovery Code
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 font-mono tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                maxLength={6}
              />
            </div>
            <p className="mt-1 text-[10px] text-neutral-500">
              Check your inbox or spam folder for the code.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                minLength={8}
                maxLength={128}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                minLength={8}
                maxLength={128}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 px-4 bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {busy ? 'Updating password…' : 'Update Password & Sign In'}
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-neutral-200 text-center text-xs text-neutral-500">
        Didn&apos;t receive a code?{' '}
        <Link href="/forgot-password" className="text-brand-700 font-semibold hover:underline">
          Request new code
        </Link>
      </div>
    </section>
  );
}

/**
 * Password reset page container with navigation and Suspense wrapper.
 */
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0c0f0d] text-stone-100 font-sans flex flex-col justify-between selection:bg-emerald-800 selection:text-white">
      {/* Unified Site Navbar */}
      <SiteNavbar hideAnnouncement={true} />

      <main className="auth-shell max-w-4xl mx-auto w-full py-8 px-4 flex flex-col justify-between">
        <Suspense fallback={<div className="text-center text-xs text-neutral-500 py-12">Loading recovery form…</div>}>
          <ResetPasswordContent />
        </Suspense>

        <footer className="max-w-4xl mx-auto w-full text-center text-[10px] text-neutral-400 pt-6">
          Northstar Learning Management Platform &copy; {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}
