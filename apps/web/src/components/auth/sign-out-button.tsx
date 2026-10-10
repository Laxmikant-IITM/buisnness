'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Keep sign-out navigation consistent while the HttpOnly session cookie stays server-owned. */
export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/');
      router.refresh();
    }
  }

  return <button className="sign-out-button" type="button" onClick={signOut} disabled={busy}>
    {busy ? 'Signing out…' : 'Sign out'}
  </button>;
}
