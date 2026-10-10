'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error');
    if (code === 'google_config') setError('Google sign-in needs its OAuth credentials configured for this deployment.');
    else if (code === 'google') setError('Google sign-in did not complete. Please try again.');
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Sign-in failed. Try again.');
      router.replace(result.role === 'STUDENT' ? '/learning' : '/manager');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell">
    <header className="auth-nav"><Link className="learn-brand" href="/">northstar<span>.</span></Link><Link href="/">Home</Link></header>
    <section className="auth-card" aria-labelledby="signin-title">
      <p className="learn-kicker">YOUR LEARNING SPACE</p>
      <h1 id="signin-title">Welcome back.</h1>
      <p>Sign in to open your courses or manager workspace.</p>
      <a className="google-sign-in" href="/api/auth/google/start">
        <svg aria-hidden="true" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.8 6.1-14.9Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.8a12 12 0 0 1 0-7.6V15H5.8a20 20 0 0 0 0 17.9l6.8-5.1Z"/><path fill="#EA4335" d="M24 11.8c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.7 29.5 4 24 4A20 20 0 0 0 5.8 15l6.8 5.2c1.6-4.8 6.1-8.4 11.4-8.4Z"/></svg>
        Continue with Google
      </a>
      <div className="auth-divider"><span>or use your password</span></div>
      <form onSubmit={signIn} className="auth-form">
        <label>Email address<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></label>
        <label>Password<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={128} /></label>
        <button className="learn-button" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">→</span></button>
      </form>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <p className="auth-note">First-time Google sign-ins create a student account automatically. Management access is assigned by role.</p>
    </section>
  </main>;
}
